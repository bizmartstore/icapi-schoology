import { useEffect, useMemo, useState } from "react";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Target, Sparkles, ChevronDown, Rocket, CalendarCheck, Inbox, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";

type SubjectGrade = {
  subject: string;
  color: string;
  scores: number[];
  average: number;
};

const remark = (g: number) =>
  g >= 90 ? "Outstanding" : g >= 85 ? "Very Good" : g >= 80 ? "Good" : g >= 75 ? "Fair" : "Needs Improvement";

const remarkColor = (g: number) =>
  g >= 90 ? "text-success" : g >= 80 ? "text-primary" : g >= 75 ? "text-warning" : "text-destructive";

const pct = (score: number, total: number) => (total > 0 ? Math.round((score / total) * 100) : 0);

const GradesPage = () => {
  const { user, roles } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const isStudent = roles.includes("student");
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user || !isMemberOfAny) {
        setGrades([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: ssRows } = await supabase
        .from("section_subjects")
        .select("id, subject_id")
        .in("section_id", memberSectionIds);

      const ss = ssRows || [];
      if (ss.length === 0) {
        setGrades([]);
        setLoading(false);
        return;
      }

      const ssIds = ss.map((s) => s.id);
      const subjectIds = [...new Set(ss.map((s) => s.subject_id))];

      const [{ data: quizRows }, { data: subjRows }, { data: attemptRows }] = await Promise.all([
        supabase.from("quizzes").select("id, title, section_subject_id").eq("is_published", true).in("section_subject_id", ssIds),
        supabase.from("subjects").select("id, name, color").in("id", subjectIds),
        supabase.from("quiz_attempts").select("quiz_id, score, total_points").eq("student_id", user.id),
      ]);

      const ssMap: Record<string, string> = {};
      ss.forEach((s) => (ssMap[s.id] = s.subject_id));

      const subjMap: Record<string, { name: string; color: string }> = {};
      (subjRows || []).forEach((s: { id: string; name: string; color: string | null }) => {
        subjMap[s.id] = { name: s.name, color: s.color || "bg-primary" };
      });

      const quizSubjectMap: Record<string, string> = {};
      (quizRows || []).forEach((q: { id: string; section_subject_id: string }) => {
        const subjId = ssMap[q.section_subject_id];
        if (subjId) quizSubjectMap[q.id] = subjId;
      });

      const bySubject: Record<string, number[]> = {};
      (attemptRows || []).forEach((a: { quiz_id: string; score: number; total_points: number }) => {
        const subjId = quizSubjectMap[a.quiz_id];
        if (!subjId) return;
        if (!bySubject[subjId]) bySubject[subjId] = [];
        bySubject[subjId].push(pct(a.score, a.total_points));
      });

      const list: SubjectGrade[] = Object.entries(bySubject).map(([subjId, scores]) => {
        const subj = subjMap[subjId];
        const average = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
        return {
          subject: subj?.name || "Subject",
          color: subj?.color || "bg-primary",
          scores,
          average,
        };
      });

      list.sort((a, b) => a.average - b.average);
      setGrades(list);
      setLoading(false);
    };

    load();
  }, [user?.id, memberSectionIds.join(",")]);

  const enriched = useMemo(() => grades, [grades]);
  const gwa = enriched.length > 0 ? Math.round(enriched.reduce((s, g) => s + g.average, 0) / enriched.length) : 0;
  const sorted = [...enriched].sort((a, b) => a.average - b.average);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const focusList = sorted.slice(0, 3);
  const target = lowest ? Math.min(95, lowest.average + 5) : 0;

  const weeklyActions = lowest
    ? [
        `Spend 30 mins/day reviewing ${lowest.subject} lessons (Mon–Fri)`,
        `Complete 1 practice quiz or activity in ${lowest.subject} every week`,
        `List 3 difficult topics and ask your teacher during consultation`,
        `Form a study buddy pair to discuss weekly lessons`,
      ]
    : [];

  if (!isStudent) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Grades view is available for students. Teachers can view quiz results in each subject dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isMemberOfAny) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">Join a section to see your grades</p>
            <p className="text-xs text-muted-foreground mt-1">Quiz scores from your teachers will appear here automatically.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center text-muted-foreground text-sm">Loading grades...</div>
      </div>
    );
  }

  if (enriched.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto">
          <QuickAccessMenu />
          <div className="px-4 py-10 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No grades yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete quizzes in your subjects to see scores here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4 space-y-4">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 card-shadow text-center">
            <p className="text-primary-foreground/70 text-xs font-medium">Quiz Average</p>
            <p className="text-4xl font-extrabold text-primary-foreground my-1">{gwa}</p>
            <p className="text-primary-foreground/70 text-sm">Based on {enriched.length} subject{enriched.length === 1 ? "" : "s"}</p>
          </div>

          {lowest && highest && (
            <>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Focus Insights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl p-4 card-shadow bg-gradient-to-br from-destructive/10 to-warning/10 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-destructive">Needs Most Focus</p>
                  </div>
                  <p className="text-base font-bold text-foreground">{lowest.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average <span className="font-bold text-foreground">{lowest.average}</span> — {remark(lowest.average)}.
                  </p>
                </div>
                <div className="rounded-2xl p-4 card-shadow bg-gradient-to-br from-success/10 to-primary/10 border border-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-success" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-success">Strongest Subject</p>
                  </div>
                  <p className="text-base font-bold text-foreground">{highest.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average <span className="font-bold text-foreground">{highest.average}</span> — {remark(highest.average)}.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl p-4 card-shadow bg-gradient-to-br from-primary/10 via-card to-success/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Improvement Plan</p>
                </div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground truncate">{lowest.subject}</p>
                    <p className="text-[11px] text-muted-foreground">Current {lowest.average} → Target {target}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground">Target</p>
                    <p className="text-2xl font-extrabold text-primary leading-none">{target}</p>
                  </div>
                </div>
                <Progress value={(lowest.average / target) * 100} className="h-1.5 mb-3" />
                <p className="text-[11px] font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-success" /> Weekly Study Actions
                </p>
                <ul className="space-y-1.5">
                  {weeklyActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-foreground">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <div className="bg-card rounded-2xl p-4 card-shadow">
            <p className="text-xs font-bold text-foreground mb-3">Subjects to Focus On</p>
            <div className="space-y-2">
              {focusList.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs font-semibold text-foreground flex-1 truncate">{g.subject}</span>
                  <Progress value={g.average} className="h-1.5 w-20" />
                  <span className={`text-xs font-bold w-8 text-right ${remarkColor(g.average)}`}>{g.average}</span>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground">Subject Grades</h3>
          <div className="space-y-2">
            {enriched.map((g, i) => {
              const isOpen = expanded === g.subject;
              const max = Math.max(...g.scores);
              const min = Math.min(...g.scores);
              return (
                <div key={i} className="bg-card rounded-2xl card-shadow animate-fade-in overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : g.subject)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-xl ${g.color} flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-bold text-primary-foreground">{g.average}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{g.subject}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {g.scores.length} quiz{g.scores.length === 1 ? "" : "zes"} taken
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`text-xs font-bold ${remarkColor(g.average)} text-right`}>{remark(g.average)}</div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/20">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3 mt-3">Quiz Scores</p>
                      <div className="flex flex-wrap gap-2">
                        {g.scores.map((s, idx) => (
                          <span key={idx} className={cn("text-xs font-bold px-2.5 py-1 rounded-full", remarkColor(s), "bg-muted")}>
                            Quiz {idx + 1}: {s}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="rounded-lg bg-card p-2">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Highest</p>
                          <p className="text-sm font-bold text-success">{max}</p>
                        </div>
                        <div className="rounded-lg bg-card p-2">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Average</p>
                          <p className="text-sm font-bold text-foreground">{g.average}</p>
                        </div>
                        <div className="rounded-lg bg-card p-2">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Lowest</p>
                          <p className="text-sm font-bold text-destructive">{min}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
