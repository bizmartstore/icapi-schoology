-- Final averages per student, subject (section_subject), and term (1–3)

CREATE TABLE public.student_term_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_subject_id UUID NOT NULL REFERENCES public.section_subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  term SMALLINT NOT NULL CHECK (term IN (1, 2, 3)),
  final_average NUMERIC(5, 2) NOT NULL CHECK (final_average >= 0 AND final_average <= 100),
  entered_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_subject_id, student_id, term)
);

CREATE INDEX student_term_grades_ss_student_idx
  ON public.student_term_grades (section_subject_id, student_id);

ALTER TABLE public.student_term_grades ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_student_term_grades_updated_at
  BEFORE UPDATE ON public.student_term_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Students view own term grades"
  ON public.student_term_grades FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Assigned teachers view term grades"
  ON public.student_term_grades FOR SELECT
  USING (public.can_manage_section_subject(section_subject_id, auth.uid()));

CREATE POLICY "Admins view all term grades"
  ON public.student_term_grades FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned teachers manage term grades"
  ON public.student_term_grades FOR INSERT
  WITH CHECK (
    public.can_manage_section_subject(section_subject_id, auth.uid())
    AND entered_by = auth.uid()
  );

CREATE POLICY "Assigned teachers update term grades"
  ON public.student_term_grades FOR UPDATE
  USING (public.can_manage_section_subject(section_subject_id, auth.uid()));

CREATE POLICY "Assigned teachers delete term grades"
  ON public.student_term_grades FOR DELETE
  USING (public.can_manage_section_subject(section_subject_id, auth.uid()));

CREATE POLICY "Admins manage term grades"
  ON public.student_term_grades FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
