-- 4-digit passcode required to request joining a section (hash never exposed to clients)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS join_passcode_hash TEXT;

UPDATE public.sections
SET join_passcode_hash = extensions.crypt('0000', extensions.gen_salt('bf'))
WHERE join_passcode_hash IS NULL;

REVOKE SELECT (join_passcode_hash) ON public.sections FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.hash_join_passcode(p_passcode text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_passcode IS NULL OR p_passcode !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Passcode must be exactly 4 digits';
  END IF;
  RETURN extensions.crypt(p_passcode, extensions.gen_salt('bf'));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_section_join_passcode(
  p_section_id uuid,
  p_passcode text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_section_owner(p_section_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to set section passcode';
  END IF;

  UPDATE public.sections
  SET join_passcode_hash = public.hash_join_passcode(p_passcode)
  WHERE id = p_section_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_section_join_passcode(
  p_section_id uuid,
  p_passcode text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sections s
    WHERE s.id = p_section_id
      AND s.is_active = true
      AND s.join_passcode_hash IS NOT NULL
      AND s.join_passcode_hash = extensions.crypt(p_passcode, s.join_passcode_hash)
  );
$$;

CREATE OR REPLACE FUNCTION public.request_section_join(
  p_section_id uuid,
  p_passcode text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_status public.approval_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(auth.uid(), 'student') THEN
    RAISE EXCEPTION 'Only students can request to join sections';
  END IF;

  IF NOT public.verify_section_join_passcode(p_section_id, p_passcode) THEN
    RAISE EXCEPTION 'Invalid passcode';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.section_members
    WHERE section_id = p_section_id AND student_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are already a member of this section';
  END IF;

  SELECT status INTO v_status
  FROM public.section_join_requests
  WHERE section_id = p_section_id AND student_id = auth.uid();

  IF v_status = 'pending' THEN
    RAISE EXCEPTION 'Request already sent';
  END IF;

  IF v_status = 'rejected' THEN
    UPDATE public.section_join_requests
    SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL, updated_at = now()
    WHERE section_id = p_section_id AND student_id = auth.uid();
    RETURN;
  END IF;

  IF v_status IS NULL THEN
    INSERT INTO public.section_join_requests (section_id, student_id, status)
    VALUES (p_section_id, auth.uid(), 'pending');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.hash_join_passcode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_section_join_passcode(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_section_join(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Students can create their own requests" ON public.section_join_requests;
