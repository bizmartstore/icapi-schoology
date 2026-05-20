-- Only admin can assign subject teachers within sections.
-- Advisers can no longer manage section_subjects (insert/update/delete);
-- they keep SELECT via the existing "Section owner can view section subjects" policy.
DROP POLICY IF EXISTS "Section owner can manage section subjects" ON public.section_subjects;

-- Tighten can_manage_section_subject: only the assigned teacher (or admin) can
-- manage activities/materials/quizzes. Adviser-as-section-owner no longer grants
-- management rights unless they are also the assigned subject teacher.
CREATE OR REPLACE FUNCTION public.can_manage_section_subject(_ss_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.section_subjects ss
    WHERE ss.id = _ss_id
      AND (
        ss.teacher_id = _user_id
        OR public.has_role(_user_id, 'admin')
      )
  )
$function$;

-- Keep can_view unchanged so adviser and members still see the subject content.
-- (Advisers can still SELECT section_subjects via "Section owner can view section subjects".)
