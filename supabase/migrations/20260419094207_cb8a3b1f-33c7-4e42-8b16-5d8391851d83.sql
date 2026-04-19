
-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_subject_id UUID NOT NULL REFERENCES public.section_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- MATERIALS
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_subject_id UUID NOT NULL REFERENCES public.section_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- QUIZZES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_subject_id UUID NOT NULL REFERENCES public.section_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  time_limit_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- QUIZ QUESTIONS
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- QUIZ CHOICES
CREATE TABLE public.quiz_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_choices ENABLE ROW LEVEL SECURITY;

-- QUIZ ATTEMPTS (one per student per quiz)
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, student_id)
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- QUIZ ANSWERS
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES public.quiz_choices(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Helper: can_manage_section_subject
CREATE OR REPLACE FUNCTION public.can_manage_section_subject(_ss_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.section_subjects ss
    WHERE ss.id = _ss_id
      AND (ss.teacher_id = _user_id OR public.is_section_owner(ss.section_id, _user_id))
  )
$$;

-- Helper: can_view_section_subject (teacher, adviser, member, admin)
CREATE OR REPLACE FUNCTION public.can_view_section_subject(_ss_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.section_subjects ss
    WHERE ss.id = _ss_id
      AND (
        ss.teacher_id = _user_id
        OR public.is_section_owner(ss.section_id, _user_id)
        OR public.is_section_member(ss.section_id, _user_id)
        OR public.has_role(_user_id, 'admin')
      )
  )
$$;

-- =================== ACTIVITIES POLICIES ===================
CREATE POLICY "View activities" ON public.activities FOR SELECT
  USING (is_active = true AND public.can_view_section_subject(section_subject_id, auth.uid()));
CREATE POLICY "Manage activities" ON public.activities FOR ALL
  USING (public.can_manage_section_subject(section_subject_id, auth.uid()))
  WITH CHECK (public.can_manage_section_subject(section_subject_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Admins manage activities" ON public.activities FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =================== MATERIALS POLICIES ===================
CREATE POLICY "View materials" ON public.materials FOR SELECT
  USING (public.can_view_section_subject(section_subject_id, auth.uid()));
CREATE POLICY "Manage materials" ON public.materials FOR ALL
  USING (public.can_manage_section_subject(section_subject_id, auth.uid()))
  WITH CHECK (public.can_manage_section_subject(section_subject_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Admins manage materials" ON public.materials FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =================== QUIZZES POLICIES ===================
CREATE POLICY "Members view published quizzes" ON public.quizzes FOR SELECT
  USING (
    (is_published = true AND public.can_view_section_subject(section_subject_id, auth.uid()))
    OR public.can_manage_section_subject(section_subject_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Manage quizzes" ON public.quizzes FOR ALL
  USING (public.can_manage_section_subject(section_subject_id, auth.uid()))
  WITH CHECK (public.can_manage_section_subject(section_subject_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =================== QUIZ QUESTIONS POLICIES ===================
CREATE POLICY "View questions" ON public.quiz_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id
      AND (
        (q.is_published = true AND public.can_view_section_subject(q.section_subject_id, auth.uid()))
        OR public.can_manage_section_subject(q.section_subject_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  ));
CREATE POLICY "Manage questions" ON public.quiz_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND public.can_manage_section_subject(q.section_subject_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND public.can_manage_section_subject(q.section_subject_id, auth.uid())
  ));

-- =================== QUIZ CHOICES POLICIES ===================
-- Students must see choice text but NOT is_correct. We expose all rows; UI must omit is_correct.
-- For stricter privacy, use a view; for now allow read for taking quiz.
CREATE POLICY "View choices" ON public.quiz_choices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id
      AND (
        (q.is_published = true AND public.can_view_section_subject(q.section_subject_id, auth.uid()))
        OR public.can_manage_section_subject(q.section_subject_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  ));
CREATE POLICY "Manage choices" ON public.quiz_choices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND public.can_manage_section_subject(q.section_subject_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND public.can_manage_section_subject(q.section_subject_id, auth.uid())
  ));

-- =================== QUIZ ATTEMPTS POLICIES ===================
CREATE POLICY "Student views own attempt" ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Teacher views attempts" ON public.quiz_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND public.can_manage_section_subject(q.section_subject_id, auth.uid())
  ));
CREATE POLICY "Admin views attempts" ON public.quiz_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =================== QUIZ ANSWERS POLICIES ===================
CREATE POLICY "Student views own answers" ON public.quiz_answers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid()));
CREATE POLICY "Teacher views answers" ON public.quiz_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE a.id = attempt_id AND public.can_manage_section_subject(q.section_subject_id, auth.uid())
  ));
CREATE POLICY "Admin views answers" ON public.quiz_answers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =================== SUBMIT QUIZ RPC (auto-grade) ===================
CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz_id UUID, _answers JSONB)
RETURNS JSONB
LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user UUID := auth.uid();
  _ss_id UUID;
  _is_published BOOLEAN;
  _attempt_id UUID;
  _total INTEGER := 0;
  _score INTEGER := 0;
  _ans JSONB;
  _qid UUID;
  _cid UUID;
  _correct BOOLEAN;
  _pts INTEGER;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT section_subject_id, is_published INTO _ss_id, _is_published FROM public.quizzes WHERE id = _quiz_id;
  IF _ss_id IS NULL THEN RAISE EXCEPTION 'Quiz not found'; END IF;
  IF NOT _is_published THEN RAISE EXCEPTION 'Quiz not published'; END IF;
  IF NOT public.is_section_member((SELECT section_id FROM public.section_subjects WHERE id = _ss_id), _user) THEN
    RAISE EXCEPTION 'Not a member of this section';
  END IF;

  IF EXISTS (SELECT 1 FROM public.quiz_attempts WHERE quiz_id = _quiz_id AND student_id = _user) THEN
    RAISE EXCEPTION 'Already attempted';
  END IF;

  SELECT COALESCE(SUM(points), 0) INTO _total FROM public.quiz_questions WHERE quiz_id = _quiz_id;

  INSERT INTO public.quiz_attempts (quiz_id, student_id, score, total_points)
  VALUES (_quiz_id, _user, 0, _total)
  RETURNING id INTO _attempt_id;

  FOR _ans IN SELECT * FROM jsonb_array_elements(_answers) LOOP
    _qid := (_ans->>'question_id')::UUID;
    _cid := NULLIF(_ans->>'choice_id', '')::UUID;
    _correct := false;
    _pts := 0;

    IF _cid IS NOT NULL THEN
      SELECT c.is_correct, q.points INTO _correct, _pts
      FROM public.quiz_choices c
      JOIN public.quiz_questions q ON q.id = c.question_id
      WHERE c.id = _cid AND c.question_id = _qid AND q.quiz_id = _quiz_id;

      IF _correct IS NULL THEN _correct := false; END IF;
      IF _correct THEN _score := _score + COALESCE(_pts, 0); END IF;
    END IF;

    INSERT INTO public.quiz_answers (attempt_id, question_id, choice_id, is_correct)
    VALUES (_attempt_id, _qid, _cid, COALESCE(_correct, false));
  END LOOP;

  UPDATE public.quiz_attempts SET score = _score WHERE id = _attempt_id;

  RETURN jsonb_build_object('attempt_id', _attempt_id, 'score', _score, 'total', _total);
END;
$$;

-- updated_at triggers
CREATE TRIGGER trg_activities_updated BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_quizzes_updated BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
