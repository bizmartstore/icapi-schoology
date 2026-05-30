import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { Inbox, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TERMS,
  TERM_LABELS,
  type TermGradeRow,
  type TermNumber,
  computeGeneralAverage,
  gradesToTermScores,
  remark,
  remarkColor,
} from "@/lib/term-grades";

type SubjectCard = {
  subjectId: string;
  subjectName: string;
  color: string;
  sectionName: string;
  sectionSubjectId: string;
  scores: Partial<Record<TermNumber, number | null>>;
  general: number | null;
};

const StudentTermGradesTab = () => {
  const { user } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const [cards, setCards] = useState<SubjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user || !isMemberOfAny) {
        setCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: ssRows } = await supabase
        .from("section_subjects")
        .select("id, subject_id, section_id")
        .in("section_id", memberSectionIds);

      const ss = ssRows || [];
      if (ss.length === 0) {
        setCards([]);
        setLoading(false);
        return;
      }

      const ssIds = ss.map((s) => s.id);
      const subjectIds = [...new Set(ss.map((s) => s.subject_id))];
      const sectionIds = [...new Set(ss.map((s) => s.section_id))];

      const [{ data: gradeRows }, { data: subjRows }, { data: secRows }] = await Promise.all([
        supabase
          .from("student_term_grades")
          .select("id, section_subject_id, student_id, term, final_average")
          .eq("student_id", user.id)
          .in("section_subject_id", ssIds),
        supabase.from("subjects").select("id, name, color").in("id", subjectIds),
        supabase.from("sections").select("id, name").in("id", sectionIds),
      ]);

      const grades = (gradeRows || []).map((r) => ({
        ...r,
        term: r.term as TermNumber,
        final_average: Number(r.final_average),
      })) as TermGradeRow[];

      const subjMap: Record<string, { name: string; color: string }> = {};
      (subjRows || []).forEach((s: { id: string; name: string; color: string | null }) => {
        subjMap[s.id] = { name: s.name, color: s.color || "bg-primary" };
      });
      const secMap: Record<string, string> = {};
      (secRows || []).forEach((s: { id: string; name: string }) => {
        secMap[s.id] = s.name;
      });

      const list: SubjectCard[] = ss.map((row) => {
        const scores = gradesToTermScores(grades, user.id, row.id);
        return {
          subjectId: row.subject_id,
          subjectName: subjMap[row.subject_id]?.name || "Subject",
          color: subjMap[row.subject_id]?.color || "bg-primary",
          sectionName: secMap[row.section_id] || "Section",
          sectionSubjectId: row.id,
          scores,
          general: computeGeneralAverage(scores),
        };
      });

      list.sort((a, b) => {
        const ga = a.general ?? -1;
        const gb = b.general ?? -1;
        return gb - ga;
      });

      setCards(list);
      setLoading(false);
    };

    load();
  }, [user?.id, memberSectionIds.join(","), isMemberOfAny]);

  const withGrades = cards.filter((c) => c.general != null);
  const overallGwa =
    withGrades.length > 0
      ? Math.round((withGrades.reduce((s, c) => s + (c.general ?? 0), 0) / withGrades.length) * 100) / 100
      : null;

  if (!isMemberOfAny) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground">Join a section to see term grades</p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-center text-sm text-muted-foreground py-8">Loading term grades…</p>;
  }

  const anyPosted = cards.some((c) => TERMS.some((t) => c.scores[t] != null));

  if (!anyPosted) {
    return (
      <div className="text-center py-10">
        <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground">No term grades posted yet</p>
        <p className="text-xs text-muted-foreground mt-1">Your teachers will enter Term 1–3 averages here when ready.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {overallGwa != null && (
        <div className="bg-gradient-to-r from-info/90 to-info/70 rounded-2xl p-5 card-shadow text-center">
          <p className="text-primary-foreground/80 text-xs font-medium">Overall General Average</p>
          <p className="text-4xl font-extrabold text-primary-foreground my-1">{overallGwa}</p>
          <p className="text-primary-foreground/80 text-sm">
            Across {withGrades.length} subject{withGrades.length === 1 ? "" : "s"} with posted grades
          </p>
        </div>
      )}

      <h3 className="text-sm font-bold text-foreground">Subject report card</h3>
      <div className="space-y-2">
        {cards.map((c) => {
          const isOpen = expanded === c.sectionSubjectId;
          return (
            <div key={c.sectionSubjectId} className="bg-card rounded-2xl card-shadow overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : c.sectionSubjectId)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                  <span className="text-sm font-bold text-primary-foreground">
                    {c.general != null ? c.general : "—"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.subjectName}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sectionName}</p>
                </div>
                {c.general != null && (
                  <span className={cn("text-xs font-bold", remarkColor(c.general))}>{remark(c.general)}</span>
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border/50 bg-muted/20">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {TERMS.map((t) => (
                      <div key={t} className="rounded-lg bg-card p-2 text-center border border-border/50">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase">{TERM_LABELS[t]}</p>
                        <p className="text-base font-bold text-foreground mt-0.5">
                          {c.scores[t] != null ? c.scores[t] : "—"}
                        </p>
                      </div>
                    ))}
                    <div className="rounded-lg bg-primary/10 p-2 text-center border border-primary/20">
                      <p className="text-[9px] text-primary font-semibold uppercase">General</p>
                      <p className="text-base font-extrabold text-primary mt-0.5">
                        {c.general != null ? c.general : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTermGradesTab;
