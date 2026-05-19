
-- 1) Allow section members to view their adviser's profile
CREATE POLICY "Section members view adviser profile"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sections s
    JOIN public.section_members sm ON sm.section_id = s.id
    WHERE s.teacher_id = profiles.user_id
      AND sm.student_id = auth.uid()
  )
);

-- Also let any authenticated user view a section adviser's basic profile (so guests/non-members opening a section can see adviser name)
CREATE POLICY "Anyone can view section adviser profile"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sections s
    WHERE s.teacher_id = profiles.user_id AND s.is_active = true
  )
);

-- 2) Auto-populate section_subjects on section creation by grade_level
CREATE UNIQUE INDEX IF NOT EXISTS section_subjects_section_subject_unique
  ON public.section_subjects (section_id, subject_id);

CREATE OR REPLACE FUNCTION public.auto_populate_section_subjects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.grade_level IS NOT NULL THEN
    INSERT INTO public.section_subjects (section_id, subject_id, teacher_id)
    SELECT NEW.id, s.id, NEW.teacher_id
    FROM public.subjects s
    WHERE s.is_active = true AND s.grade_level = NEW.grade_level
    ON CONFLICT (section_id, subject_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_populate_section_subjects ON public.sections;
CREATE TRIGGER trg_auto_populate_section_subjects
AFTER INSERT ON public.sections
FOR EACH ROW EXECUTE FUNCTION public.auto_populate_section_subjects();

-- Backfill existing sections
INSERT INTO public.section_subjects (section_id, subject_id, teacher_id)
SELECT sec.id, sub.id, sec.teacher_id
FROM public.sections sec
JOIN public.subjects sub
  ON sub.is_active = true AND sub.grade_level = sec.grade_level
WHERE sec.grade_level IS NOT NULL
ON CONFLICT (section_id, subject_id) DO NOTHING;

-- 3) Section chat
CREATE TABLE IF NOT EXISTS public.section_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members and adviser view section messages"
ON public.section_messages FOR SELECT
USING (
  public.is_section_member(section_id, auth.uid())
  OR public.is_section_owner(section_id, auth.uid())
);

CREATE POLICY "Members and adviser send messages"
ON public.section_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_section_member(section_id, auth.uid())
    OR public.is_section_owner(section_id, auth.uid())
  )
);

CREATE POLICY "Authors delete own messages"
ON public.section_messages FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_section_messages_section_created
  ON public.section_messages (section_id, created_at);

ALTER TABLE public.section_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_messages;
