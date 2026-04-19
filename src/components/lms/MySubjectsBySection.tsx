import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, GraduationCap, Sparkles, ArrowRight } from "lucide-react";

type SectionSubject = {
  id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  section?: { name: string; color: string | null };
  subject?: { name: string; color: string | null; icon_name: string | null };
  teacher?: { first_name: string; last_name: string };
};

/**
 * Shows the student's subjects grouped by section.
 * Returns null when the student has no memberships (so the homepage can hide it entirely).
 */
const MySubjectsBySection = ({ onLoadedEmpty }: { onLoadedEmpty?: (empty: boolean) => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grouped, setGrouped] = useState<Record<string, { sectionName: string; color: string | null; items: SectionSubject[] }>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setGrouped({});
      onLoadedEmpty?.(true);
      setLoading(false);
      return;
    }
    const { data: memberships } = await supabase
      .from("section_members")
      .select("section_id")
      .eq("student_id", user.id);

    const sectionIds = (memberships || []).map((m) => m.section_id);
    if (sectionIds.length === 0) {
      setGrouped({});
      onLoadedEmpty?.(true);
      setLoading(false);
      return;
    }

    const [{ data: ssRows }, { data: secRows }] = await Promise.all([
      supabase.from("section_subjects").select("*").in("section_id", sectionIds),
      supabase.from("sections").select("id, name, color").in("id", sectionIds),
    ]);

    const ssList = (ssRows as any[]) || [];
    const subjectIds = [...new Set(ssList.map((s) => s.subject_id))];
    const teacherIds = [...new Set(ssList.map((s) => s.teacher_id))];

    const [{ data: subjects }, { data: teachers }] = await Promise.all([
      subjectIds.length ? supabase.from("subjects").select("id, name, color, icon_name").in("id", subjectIds) : Promise.resolve({ data: [] as any[] }),
      teacherIds.length ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", teacherIds) : Promise.resolve({ data: [] as any[] }),
    ]);

    const subjMap: Record<string, any> = {};
    (subjects || []).forEach((s: any) => (subjMap[s.id] = s));
    const tMap: Record<string, any> = {};
    (teachers || []).forEach((t: any) => (tMap[t.user_id] = t));
    const secMap: Record<string, any> = {};
    (secRows || []).forEach((s: any) => (secMap[s.id] = s));

    const g: Record<string, { sectionName: string; color: string | null; items: SectionSubject[] }> = {};
    sectionIds.forEach((sid) => {
      g[sid] = { sectionName: secMap[sid]?.name || "Section", color: secMap[sid]?.color || null, items: [] };
    });
    ssList.forEach((ss: any) => {
      if (!g[ss.section_id]) return;
      g[ss.section_id].items.push({ ...ss, subject: subjMap[ss.subject_id], teacher: tMap[ss.teacher_id] });
    });

    setGrouped(g);
    const totalSubs = Object.values(g).reduce((acc, v) => acc + v.items.length, 0);
    onLoadedEmpty?.(totalSubs === 0 && sectionIds.length === 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`my-subjects-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "section_members", filter: `student_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "section_subjects" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) return <div className="px-4 pb-3 text-[11px] text-muted-foreground">Loading subjects…</div>;

  const sectionEntries = Object.entries(grouped).filter(([, v]) => v.items.length > 0);
  if (sectionEntries.length === 0) return null;

  return (
    <div className="px-4 pb-3 space-y-3">
      {sectionEntries.map(([sid, group]) => (
        <div key={sid}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <p className="text-[11px] font-extrabold text-foreground">{group.sectionName}</p>
            </div>
            <span className="text-[9px] text-muted-foreground font-semibold">{group.items.length} subject{group.items.length === 1 ? "" : "s"}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {group.items.map((ss) => (
              <button
                key={ss.id}
                onClick={() => navigate(`/learn/${ss.id}`)}
                className="group min-w-[160px] max-w-[160px] bg-card rounded-2xl overflow-hidden border border-border/50 card-shadow active:scale-95 hover:shadow-lg transition-all flex-shrink-0 text-left"
              >
                <div className={`h-16 ${ss.subject?.color || "bg-primary"} relative flex items-center justify-center`}>
                  <BookOpen className="h-7 w-7 text-primary-foreground/90" />
                  <ArrowRight className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-2.5">
                  <p className="text-[12px] font-extrabold text-foreground line-clamp-1">{ss.subject?.name}</p>
                  <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <GraduationCap className="h-2.5 w-2.5" />
                    {ss.teacher ? `${ss.teacher.first_name} ${ss.teacher.last_name}` : "Teacher"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySubjectsBySection;
