
-- 1. Teacher ↔ Subject assignments (admin-managed)
CREATE TABLE public.teacher_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view teacher subjects"
  ON public.teacher_subjects FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage teacher subjects"
  ON public.teacher_subjects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Section subjects (adviser links subjects + their teachers into a section)
CREATE TABLE public.section_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id, subject_id)
);
ALTER TABLE public.section_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Section owner can view section subjects"
  ON public.section_subjects FOR SELECT
  USING (is_section_owner(section_id, auth.uid()));
CREATE POLICY "Section members can view section subjects"
  ON public.section_subjects FOR SELECT
  USING (is_section_member(section_id, auth.uid()));
CREATE POLICY "Assigned teacher can view"
  ON public.section_subjects FOR SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can view all section subjects"
  ON public.section_subjects FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Section owner can manage section subjects"
  ON public.section_subjects FOR ALL
  USING (is_section_owner(section_id, auth.uid()))
  WITH CHECK (is_section_owner(section_id, auth.uid()));
CREATE POLICY "Admins can manage all section subjects"
  ON public.section_subjects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Class schedules (weekly recurring slots per section_subject)
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_subject_id UUID NOT NULL REFERENCES public.section_subjects(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View schedules of accessible section subjects"
  ON public.class_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.section_subjects ss
      WHERE ss.id = section_subject_id
        AND (
          is_section_owner(ss.section_id, auth.uid())
          OR is_section_member(ss.section_id, auth.uid())
          OR ss.teacher_id = auth.uid()
          OR has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );
CREATE POLICY "Section owner manages schedules"
  ON public.class_schedules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.section_subjects ss
            WHERE ss.id = section_subject_id
              AND is_section_owner(ss.section_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.section_subjects ss
            WHERE ss.id = section_subject_id
              AND is_section_owner(ss.section_id, auth.uid()))
  );
CREATE POLICY "Admins manage all schedules"
  ON public.class_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Extend announcements: scope + section_id + created_by
ALTER TABLE public.announcements
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'general' CHECK (scope IN ('general','section')),
  ADD COLUMN section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  ADD COLUMN created_by UUID;

-- Replace existing visibility policies
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;

CREATE POLICY "Anyone can view active general announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true AND scope = 'general');

CREATE POLICY "Section members can view section announcements"
  ON public.announcements FOR SELECT
  USING (
    is_active = true AND scope = 'section' AND section_id IS NOT NULL
    AND (
      is_section_member(section_id, auth.uid())
      OR is_section_owner(section_id, auth.uid())
    )
  );

-- Allow section advisers to create section announcements for their own section
CREATE POLICY "Adviser can insert section announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    scope = 'section'
    AND section_id IS NOT NULL
    AND is_section_owner(section_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Adviser can update own section announcements"
  ON public.announcements FOR UPDATE
  USING (
    scope = 'section'
    AND section_id IS NOT NULL
    AND is_section_owner(section_id, auth.uid())
  );

CREATE POLICY "Adviser can delete own section announcements"
  ON public.announcements FOR DELETE
  USING (
    scope = 'section'
    AND section_id IS NOT NULL
    AND is_section_owner(section_id, auth.uid())
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_schedules;
