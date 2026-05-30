-- Create profiles from auth signup metadata (works even without a session / email confirm off-on edge cases)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := NEW.raw_user_meta_data;
  profile_user_type public.user_type;
  profile_approval public.approval_status := 'pending';
BEGIN
  IF meta->>'first_name' IS NULL OR meta->>'last_name' IS NULL OR meta->>'user_type' IS NULL THEN
    RETURN NEW;
  END IF;

  profile_user_type := (meta->>'user_type')::public.user_type;

  IF lower(NEW.email) = 'sheethappenswithjaa@gmail.com' THEN
    profile_approval := 'approved';
    profile_user_type := COALESCE(profile_user_type, 'teacher'::public.user_type);
  END IF;

  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    contact_number,
    user_type,
    school,
    grade_level,
    school_level,
    subject_taught,
    approval_status
  )
  VALUES (
    NEW.id,
    meta->>'first_name',
    meta->>'last_name',
    NEW.email,
    COALESCE(meta->>'contact_number', ''),
    profile_user_type,
    NULLIF(meta->>'school', ''),
    NULLIF(meta->>'grade_level', ''),
    NULLIF(meta->>'school_level', '')::public.school_level,
    NULLIF(meta->>'subject_taught', ''),
    profile_approval
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF lower(NEW.email) = 'sheethappenswithjaa@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'), (NEW.id, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Client-callable profile creation (session required); also used after signup when session exists
CREATE OR REPLACE FUNCTION public.create_user_profile(
  _first_name text,
  _last_name text,
  _contact_number text,
  _user_type public.user_type,
  _school text DEFAULT NULL,
  _grade_level text DEFAULT NULL,
  _school_level public.school_level DEFAULT NULL,
  _subject_taught text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
  profile_approval public.approval_status := 'pending';
  profile_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  IF lower(user_email) = 'sheethappenswithjaa@gmail.com' THEN
    profile_approval := 'approved';
  END IF;

  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    contact_number,
    user_type,
    school,
    grade_level,
    school_level,
    subject_taught,
    approval_status
  )
  VALUES (
    uid,
    _first_name,
    _last_name,
    user_email,
    _contact_number,
    _user_type,
    _school,
    _grade_level,
    _school_level,
    _subject_taught,
    profile_approval
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    contact_number = EXCLUDED.contact_number,
    user_type = EXCLUDED.user_type,
    school = EXCLUDED.school,
    grade_level = EXCLUDED.grade_level,
    school_level = EXCLUDED.school_level,
    subject_taught = EXCLUDED.subject_taught,
    approval_status = CASE
      WHEN lower(EXCLUDED.email) = 'sheethappenswithjaa@gmail.com' THEN 'approved'::public.approval_status
      ELSE public.profiles.approval_status
    END,
    updated_at = now()
  RETURNING id INTO profile_id;

  IF lower(user_email) = 'sheethappenswithjaa@gmail.com' THEN
    PERFORM public.grant_admin_role(uid);
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text, text, public.user_type, text, text, public.school_level, text) TO authenticated;

-- Granting admin also approves the profile (bootstrap admin can log in immediately)
CREATE OR REPLACE FUNCTION public.grant_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET approval_status = 'approved',
      approved_by = COALESCE(approved_by, _user_id),
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;
