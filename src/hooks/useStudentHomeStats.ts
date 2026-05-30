import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";

export type StudentHomeStats = {
  subjects: number;
  tasks: number;
  rank: number | null;
  loading: boolean;
};

const pct = (score: number, total: number) => (total > 0 ? (score / total) * 100 : 0);

export function useStudentHomeStats(): StudentHomeStats {
  const { user, roles } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const isStudent = roles.includes("student");
  const [stats, setStats] = useState<StudentHomeStats>({
    subjects: 0,
    tasks: 0,
    rank: null,
    loading: true,
  });

  useEffect(() => {
    if (!user || !isStudent || !isMemberOfAny || memberSectionIds.length === 0) {
      setStats({ subjects: 0, tasks: 0, rank: null, loading: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setStats((s) => ({ ...s, loading: true }));

      const { data: ssRows } = await supabase
        .from("section_subjects")
        .select("id")
        .in("section_id", memberSectionIds);
      const ssIds = (ssRows || []).map((r) => r.id);

      if (ssIds.length === 0) {
        if (!cancelled) setStats({ subjects: 0, tasks: 0, rank: null, loading: false });
        return;
      }

      const [{ data: actRows }, { data: quizRows }, { data: subs }, { data: members }] =
        await Promise.all([
          supabase.from("activities").select("id").eq("is_active", true).in("section_subject_id", ssIds),
          supabase.from("quizzes").select("id").eq("is_published", true).in("section_subject_id", ssIds),
          supabase.from("activity_submissions").select("activity_id").eq("student_id", user.id),
          supabase.from("section_members").select("student_id").in("section_id", memberSectionIds),
        ]);

      const quizIds = (quizRows || []).map((q) => q.id);
      let attemptRows: { quiz_id: string; student_id: string; score: number; total_points: number }[] = [];
      if (quizIds.length > 0) {
        const { data: att } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, student_id, score, total_points")
          .in("quiz_id", quizIds);
        attemptRows = att || [];
      }

      const attemptedQuizIds = new Set(
        attemptRows.filter((a) => a.student_id === user.id).map((a) => a.quiz_id),
      );
      const submittedActivityIds = new Set((subs || []).map((s) => s.activity_id));

      const pendingActivities = (actRows || []).filter((a) => !submittedActivityIds.has(a.id)).length;
      const pendingQuizzes = (quizRows || []).filter((q) => !attemptedQuizIds.has(q.id)).length;

      const peerIds = [...new Set((members || []).map((m) => m.student_id))];
      const avgByStudent = new Map<string, number[]>();

      attemptRows.forEach((a) => {
        const list = avgByStudent.get(a.student_id) || [];
        list.push(pct(a.score, a.total_points));
        avgByStudent.set(a.student_id, list);
      });

      const leaderboard = peerIds
        .map((sid) => {
          const scores = avgByStudent.get(sid);
          if (!scores?.length) return null;
          const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
          return { student_id: sid, avg };
        })
        .filter((x): x is { student_id: string; avg: number } => x !== null)
        .sort((a, b) => b.avg - a.avg);

      const myIndex = leaderboard.findIndex((e) => e.student_id === user.id);
      const rank = myIndex >= 0 ? myIndex + 1 : null;

      if (!cancelled) {
        setStats({
          subjects: ssIds.length,
          tasks: pendingActivities + pendingQuizzes,
          rank,
          loading: false,
        });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isStudent, isMemberOfAny, memberSectionIds.join(",")]);

  return stats;
}
