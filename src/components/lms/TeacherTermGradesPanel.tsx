import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, GraduationCap } from "lucide-react";
import {
  TERMS,
  TERM_LABELS,
  type TermGradeRow,
  type TermNumber,
  type TermScores,
  computeGeneralAverage,
  gradesToTermScores,
  parseGradeInput,
} from "@/lib/term-grades";

type StudentProfile = { user_id: string; first_name: string; last_name: string };

type Props = {
  sectionSubjectId: string;
  members: { student_id: string }[];
};

type DraftRow = Record<TermNumber, string>;

const emptyDraft = (): DraftRow => ({ 1: "", 2: "", 3: "" });

const TeacherTermGradesPanel = ({ sectionSubjectId, members }: Props) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Record<string, StudentProfile>>({});
  const [grades, setGrades] = useState<TermGradeRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const studentIds = useMemo(() => members.map((m) => m.student_id), [members]);

  const load = useCallback(async () => {
    if (!sectionSubjectId) return;
    setLoading(true);
    const [{ data: gradeRows }, { data: studentRows }] = await Promise.all([
      supabase
        .from("student_term_grades")
        .select("id, section_subject_id, student_id, term, final_average")
        .eq("section_subject_id", sectionSubjectId),
      studentIds.length
        ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", studentIds)
        : Promise.resolve({ data: [] as StudentProfile[] }),
    ]);

    const list = (gradeRows || []).map((r) => ({
      ...r,
      term: r.term as TermNumber,
      final_average: Number(r.final_average),
    })) as TermGradeRow[];

    setGrades(list);
    const pmap: Record<string, StudentProfile> = {};
    (studentRows || []).forEach((s) => (pmap[s.user_id] = s));
    setProfiles(pmap);

    const nextDrafts: Record<string, DraftRow> = {};
    studentIds.forEach((sid) => {
      const scores = gradesToTermScores(list, sid, sectionSubjectId);
      nextDrafts[sid] = {
        1: scores[1] != null ? String(scores[1]) : "",
        2: scores[2] != null ? String(scores[2]) : "",
        3: scores[3] != null ? String(scores[3]) : "",
      };
    });
    setDrafts(nextDrafts);
    setLoading(false);
  }, [sectionSubjectId, studentIds.join(",")]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStudent = async (studentId: string) => {
    if (!user) return;
    const draft = drafts[studentId] || emptyDraft();
    setSavingId(studentId);

    try {
      for (const term of TERMS) {
        const parsed = parseGradeInput(draft[term]);
        const existing = grades.find(
          (g) => g.student_id === studentId && g.term === term && g.section_subject_id === sectionSubjectId,
        );

        if (parsed === null) {
          if (existing) {
            const { error } = await supabase.from("student_term_grades").delete().eq("id", existing.id);
            if (error) throw error;
          }
          continue;
        }

        if (existing) {
          const { error } = await supabase
            .from("student_term_grades")
            .update({ final_average: parsed })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("student_term_grades").insert({
            section_subject_id: sectionSubjectId,
            student_id: studentId,
            term,
            final_average: parsed,
            entered_by: user.id,
          });
          if (error) throw error;
        }
      }
      toast.success("Grades saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save grades");
    } finally {
      setSavingId(null);
    }
  };

  const updateDraft = (studentId: string, term: TermNumber, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || emptyDraft()), [term]: value },
    }));
  };

  const previewGeneral = (studentId: string): number | null => {
    const draft = drafts[studentId] || emptyDraft();
    const scores: TermScores = {};
    TERMS.forEach((t) => {
      scores[t] = parseGradeInput(draft[t]);
    });
    return computeGeneralAverage(scores);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-6">Loading term grades…</p>;
  }

  if (studentIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No students in this section yet. Approve join requests first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="text-[11px] text-foreground font-semibold flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          Enter final averages (0–100) for Term 1, Term 2, and Term 3. General average is computed from entered terms.
        </p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[520px] text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="py-2 pr-2">Student</th>
              {TERMS.map((t) => (
                <th key={t} className="py-2 px-1 text-center w-[72px]">
                  {TERM_LABELS[t]}
                </th>
              ))}
              <th className="py-2 px-1 text-center w-[80px]">General</th>
              <th className="py-2 pl-2 w-[72px]" />
            </tr>
          </thead>
          <tbody>
            {studentIds.map((sid) => {
              const p = profiles[sid];
              const name = p ? `${p.last_name}, ${p.first_name}` : "Student";
              const general = previewGeneral(sid);
              return (
                <tr key={sid} className="border-b border-border/40">
                  <td className="py-2 pr-2 text-[11px] font-medium text-foreground max-w-[120px] truncate">{name}</td>
                  {TERMS.map((t) => (
                    <td key={t} className="py-2 px-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        inputMode="decimal"
                        className="h-8 text-center text-xs px-1"
                        placeholder="—"
                        value={drafts[sid]?.[t] ?? ""}
                        onChange={(e) => updateDraft(sid, t, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="py-2 px-1 text-center text-sm font-extrabold text-primary">
                    {general != null ? general : "—"}
                  </td>
                  <td className="py-2 pl-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-[10px] px-2"
                      disabled={savingId === sid}
                      onClick={() => void saveStudent(sid)}
                    >
                      <Save className="h-3 w-3 mr-0.5" />
                      {savingId === sid ? "…" : "Save"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherTermGradesPanel;
