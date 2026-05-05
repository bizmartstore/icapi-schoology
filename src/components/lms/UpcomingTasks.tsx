import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, PenLine, Flame, Lock, CheckCircle2, CalendarClock, ChevronRight, Sparkles, Inbox, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import TaskDetailsDialog, { TaskDialogItem } from "./TaskDetailsDialog";

type Item = {
  id: string;
  raw_id: string;
  kind: "activity" | "quiz";
  title: string;
  subject_name: string;
  section_name: string;
  color: string;
  due_date: string | null;
  ss_id: string;
  done?: boolean;
};

const formatDue = (iso: string | null) => {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Overdue · ${d.toLocaleDateString()}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff <= 7) return `Due in ${diff} days`;
  return `Due ${d.toLocaleDateString()}`;
};

const isUrgent = (iso: string | null) => {
  if (!iso) return false;
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 2;
};

const UpcomingTasks = () => {
  const navigate = useNavigate();
  const { user, profile, roles } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isStudent = roles.includes("student");
  const gated = isStudent && (!isLoggedIn || !isMemberOfAny);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedSections, setJoinedSections] = useState<{ id: string; name: string }[]>([]);
  const [dialogItem, setDialogItem] = useState<TaskDialogItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    if (!user || !isMemberOfAny) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Get all section_subjects in joined sections
    const { data: ssRows } = await supabase
      .from("section_subjects")
      .select("id, subject_id, section_id")
      .in("section_id", memberSectionIds);
    const ss = ssRows || [];
    if (ss.length === 0) { setItems([]); setLoading(false); return; }

    const ssIds = ss.map((s) => s.id);
    const subjectIds = [...new Set(ss.map((s) => s.subject_id))];
    const sectionIds = [...new Set(ss.map((s) => s.section_id))];

    // 2. Fetch activities, quizzes, subjects, sections, attempts, activity submissions in parallel
    const [{ data: actRows }, { data: quizRows }, { data: subjRows }, { data: secRows }, { data: attempts }, { data: subs }] = await Promise.all([
      supabase.from("activities").select("id, title, due_date, section_subject_id, is_active").eq("is_active", true).in("section_subject_id", ssIds),
      supabase.from("quizzes").select("id, title, section_subject_id, is_published, created_at").eq("is_published", true).in("section_subject_id", ssIds),
      supabase.from("subjects").select("id, name, color").in("id", subjectIds),
      supabase.from("sections").select("id, name").in("id", sectionIds),
      supabase.from("quiz_attempts").select("quiz_id").eq("student_id", user.id),
      supabase.from("activity_submissions").select("activity_id").eq("student_id", user.id),
    ]);

    const ssMap: Record<string, any> = {};
    ss.forEach((x) => (ssMap[x.id] = x));
    const subjMap: Record<string, any> = {};
    (subjRows || []).forEach((x: any) => (subjMap[x.id] = x));
    const secMap: Record<string, any> = {};
    (secRows || []).forEach((x: any) => (secMap[x.id] = x));
    const attemptedQuizIds = new Set((attempts || []).map((a: any) => a.quiz_id));
    const submittedActivityIds = new Set((subs || []).map((a: any) => a.activity_id));

    const list: Item[] = [];

    (actRows || []).forEach((a: any) => {
      const link = ssMap[a.section_subject_id];
      if (!link) return;
      const subj = subjMap[link.subject_id];
      const sec = secMap[link.section_id];
      list.push({
        id: `a-${a.id}`,
        raw_id: a.id,
        kind: "activity",
        title: a.title,
        subject_name: subj?.name || "Subject",
        section_name: sec?.name || "Section",
        color: subj?.color || "bg-primary",
        due_date: a.due_date,
        ss_id: link.id,
        done: submittedActivityIds.has(a.id),
      });
    });

    (quizRows || []).forEach((q: any) => {
      const link = ssMap[q.section_subject_id];
      if (!link) return;
      const subj = subjMap[link.subject_id];
      const sec = secMap[link.section_id];
      list.push({
        id: `q-${q.id}`,
        raw_id: q.id,
        kind: "quiz",
        title: q.title,
        subject_name: subj?.name || "Subject",
        section_name: sec?.name || "Section",
        color: subj?.color || "bg-primary",
        due_date: null,
        ss_id: link.id,
        done: attemptedQuizIds.has(q.id),
      });
    });

    // Sort: not-done first, then by due date asc (nulls last), then by kind
    list.sort((a, b) => {
      if (!!a.done !== !!b.done) return a.done ? 1 : -1;
      const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ad - bd;
    });

    setItems(list.slice(0, 8));
    // Joined sections (for empty/loading hints)
    setJoinedSections(
      [...new Set(ss.map((s) => s.section_id))]
        .map((id) => ({ id, name: secMap[id]?.name || "Section" }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("upcoming-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quizzes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_attempts", filter: `student_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_submissions", filter: `student_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, memberSectionIds.join(",")]);

  const openTask = (it: Item) => {
    setDialogItem({
      id: it.raw_id,
      kind: it.kind,
      title: it.title,
      subject_name: it.subject_name,
      section_name: it.section_name,
      ss_id: it.ss_id,
      due_date: it.due_date,
      done: it.done,
    });
    setDialogOpen(true);
  };

  if (gated) {
    return (
      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold text-foreground">Join a section to see your tasks</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Activities and quizzes from your teachers will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 pb-3 space-y-2">
        <div className="rounded-xl bg-muted/30 px-3 py-2 flex items-center gap-2">
          <School className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
          <p className="text-[10px] text-muted-foreground">
            Checking your sections for new activities and quizzes…
          </p>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 overflow-hidden flex items-stretch">
            <div className="w-1.5 bg-muted/60 animate-pulse" />
            <div className="flex-1 p-2.5 flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-muted/60 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-muted/60 animate-pulse" />
                <div className="h-2 w-1/2 rounded bg-muted/40 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-muted/10 p-5 text-center">
          <div className="mx-auto h-10 w-10 rounded-full shopee-gradient flex items-center justify-center mb-2">
            <Inbox className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-[12px] font-bold text-foreground">You're all caught up!</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            New activities and quizzes from your teachers will appear here automatically.
          </p>
          {joinedSections.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-[9px] uppercase font-bold tracking-wide text-muted-foreground mb-1.5">
                Watching {joinedSections.length} section{joinedSections.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {joinedSections.slice(0, 6).map((s) => (
                  <span key={s.id} className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {s.name}
                  </span>
                ))}
                {joinedSections.length > 6 && (
                  <span className="text-[9px] text-muted-foreground">+{joinedSections.length - 6} more</span>
                )}
              </div>
            </div>
          )}
          <p className="text-[9px] text-muted-foreground mt-3 italic">
            Most teachers post new tasks at the start of each week.
          </p>
        </div>
      </div>
    );
  }

  const activeCount = items.filter((i) => !i.done).length;
  const urgentCount = items.filter((i) => !i.done && isUrgent(i.due_date)).length;

  return (
    <div className="px-4 pb-3">
      {/* Summary chips */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[9px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {activeCount} pending
        </span>
        {urgentCount > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="h-2.5 w-2.5" /> {urgentCount} urgent
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((it) => {
          const urgent = !it.done && isUrgent(it.due_date);
          return (
            <button
              key={it.id}
              onClick={() => openTask(it)}
              className={`w-full text-left rounded-xl overflow-hidden transition-all active:scale-[0.99] hover:shadow-md group flex items-stretch ${
                it.done
                  ? "bg-success/5 border border-success/30"
                  : urgent
                  ? "bg-card border border-destructive/30 shadow-sm shadow-destructive/5"
                  : "bg-card border border-border/60"
              }`}
            >
              {/* Colored side bar */}
              <div className={`w-1.5 flex-shrink-0 ${it.color}`} />

              <div className="flex items-center gap-2.5 p-2.5 flex-1 min-w-0">
                {/* Kind icon */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  it.done
                    ? "bg-success text-primary-foreground"
                    : it.kind === "quiz"
                    ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
                    : "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground"
                }`}>
                  {it.done ? <CheckCircle2 className="h-4 w-4" /> : it.kind === "quiz" ? <ClipboardCheck className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className={`text-[12px] font-bold truncate ${it.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {it.title}
                    </h4>
                    {urgent && <Flame className="h-3 w-3 text-destructive flex-shrink-0 animate-pulse" />}
                  </div>
                  <p className="text-[9px] text-muted-foreground line-clamp-1">
                    {it.section_name} · {it.subject_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                      it.kind === "quiz" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent-foreground"
                    }`}>
                      {it.kind}
                    </span>
                    {it.kind === "activity" && (
                      <span className={`text-[9px] flex items-center gap-1 ${urgent ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        <CalendarClock className="h-2.5 w-2.5" />
                        {formatDue(it.due_date)}
                      </span>
                    )}
                    {it.done && (
                      <span className="text-[9px] font-bold text-success">
                        {it.kind === "quiz" ? "Submitted" : "Done"}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      <TaskDetailsDialog
        item={dialogItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onChanged={load}
      />
    </div>
  );
};

export default UpcomingTasks;
