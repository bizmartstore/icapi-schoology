-- SECTIONS TABLE
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  school_level public.school_level,
  cover_image_url TEXT,
  color TEXT DEFAULT 'from-primary to-primary/70',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sections"
  ON public.sections FOR SELECT
  USING (is_active = true);

CREATE POLICY "Teachers can view all their sections"
  ON public.sections FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create sections"
  ON public.sections FOR INSERT
  WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update their own sections"
  ON public.sections FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own sections"
  ON public.sections FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can manage all sections"
  ON public.sections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEMBERS
CREATE TABLE public.section_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id, student_id)
);

ALTER TABLE public.section_members ENABLE ROW LEVEL SECURITY;

-- helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_section_member(_section_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.section_members
    WHERE section_id = _section_id AND student_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_section_owner(_section_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sections
    WHERE id = _section_id AND teacher_id = _user_id
  )
$$;

CREATE POLICY "Students can view their own memberships"
  ON public.section_members FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Section owner can view members"
  ON public.section_members FOR SELECT
  USING (public.is_section_owner(section_id, auth.uid()));

CREATE POLICY "Members can view co-members"
  ON public.section_members FOR SELECT
  USING (public.is_section_member(section_id, auth.uid()));

CREATE POLICY "Section owner can add members"
  ON public.section_members FOR INSERT
  WITH CHECK (public.is_section_owner(section_id, auth.uid()));

CREATE POLICY "Section owner can remove members"
  ON public.section_members FOR DELETE
  USING (public.is_section_owner(section_id, auth.uid()));

CREATE POLICY "Students can leave a section"
  ON public.section_members FOR DELETE
  USING (auth.uid() = student_id);

-- JOIN REQUESTS
CREATE TABLE public.section_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  message TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id, student_id)
);

ALTER TABLE public.section_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own requests"
  ON public.section_join_requests FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Section owner can view requests"
  ON public.section_join_requests FOR SELECT
  USING (public.is_section_owner(section_id, auth.uid()));

CREATE POLICY "Students can create their own requests"
  ON public.section_join_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Section owner can update requests"
  ON public.section_join_requests FOR UPDATE
  USING (public.is_section_owner(section_id, auth.uid()));

CREATE POLICY "Students can cancel their own pending requests"
  ON public.section_join_requests FOR DELETE
  USING (auth.uid() = student_id AND status = 'pending');

CREATE TRIGGER update_section_join_requests_updated_at
  BEFORE UPDATE ON public.section_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add member when request is approved
CREATE OR REPLACE FUNCTION public.handle_join_request_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.section_members (section_id, student_id)
    VALUES (NEW.section_id, NEW.student_id)
    ON CONFLICT (section_id, student_id) DO NOTHING;
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_join_request_status_change
  BEFORE UPDATE ON public.section_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_join_request_approval();