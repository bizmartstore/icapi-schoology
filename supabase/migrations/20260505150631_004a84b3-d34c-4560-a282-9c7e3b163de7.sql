-- Activity submissions: lets students mark an activity as submitted and teachers/admins view them
CREATE TABLE IF NOT EXISTS public.activity_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  student_id UUID NOT NULL,
  note TEXT,
  url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (activity_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_submissions_activity ON public.activity_submissions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_submissions_student ON public.activity_submissions(student_id);

ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;

-- Students see their own submissions
CREATE POLICY "Student views own submissions"
ON public.activity_submissions FOR SELECT
USING (auth.uid() = student_id);

-- Students can create their own submission, only if they're a member of the activity's section
CREATE POLICY "Student inserts own submission"
ON public.activity_submissions FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.activities a
    JOIN public.section_subjects ss ON ss.id = a.section_subject_id
    WHERE a.id = activity_submissions.activity_id
      AND public.is_section_member(ss.section_id, auth.uid())
  )
);

-- Students can delete (un-submit) their own submission
CREATE POLICY "Student deletes own submission"
ON public.activity_submissions FOR DELETE
USING (auth.uid() = student_id);

-- Teachers who manage the section_subject can view all submissions for their activity
CREATE POLICY "Teacher views submissions"
ON public.activity_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_submissions.activity_id
      AND public.can_manage_section_subject(a.section_subject_id, auth.uid())
  )
);

-- Admins manage all submissions
CREATE POLICY "Admin manages submissions"
ON public.activity_submissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_submissions;