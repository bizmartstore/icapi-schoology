import { useEffect, useState } from "react";
import { FileText, Clock, ClipboardCheck, PenLine, Flame, Lock, Check, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  subject_name: string | null;
  due_date: string | null;
  task_type: string | null;
  is_urgent: boolean | null;
};

const typeIcon: Record<string, React.ReactNode> = {
  Quiz: <ClipboardCheck className="h-5 w-5" />,
  Assignment: <PenLine className="h-5 w-5" />,
};

const UpcomingTasks = () => {
  const { user, profile, roles } = useAuth();
  const { isMemberOfAny } = useSectionMembership();
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isStudent = roles.includes("student");
  const gated = isLoggedIn && isStudent && !isMemberOfAny;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Task | null>(null);

  // Load tasks + realtime
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("tasks").select("*").eq("is_active", true)
        .order("created_at", { ascending: false });
      setTasks((data as Task[]) || []);
    };
    load();
    const ch = supabase
      .channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load completions per user + realtime
  useEffect(() => {
    if (!user) { setCompleted(new Set()); return; }
    const load = async () => {
      const { data } = await supabase
        .from("task_completions").select("task_id").eq("user_id", user.id);
      setCompleted(new Set((data || []).map((r: any) => r.task_id)));
    };
    load();
    const ch = supabase
      .channel(`completions-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_completions", filter: `user_id=eq.${user.id}` },
        load
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const handleClick = (task: Task) => {
    if (gated) {
      toast.info("Join a section first to open tasks");
      return;
    }
    if (!isLoggedIn) {
      toast.info("Please login to open tasks");
      return;
    }
    setOpen(task);
  };

  const toggleComplete = async (task: Task) => {
    if (!user) return;
    const isDone = completed.has(task.id);
    if (isDone) {
      const { error } = await supabase
        .from("task_completions").delete().eq("task_id", task.id).eq("user_id", user.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Marked as not done");
    } else {
      const { error } = await supabase
        .from("task_completions").insert({ task_id: task.id, user_id: user.id });
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Task completed! 🎉");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-[11px] text-muted-foreground">No upcoming tasks yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      {gated && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
          <Lock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <p className="text-[11px] text-foreground font-medium leading-tight">
            Join a section to open and complete tasks.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const isDone = completed.has(task.id);
          return (
            <button
              key={task.id}
              onClick={() => handleClick(task)}
              className={`w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] hover:shadow-lg ${
                isDone
                  ? "bg-success/5 border-l-4 border-success opacity-80"
                  : task.is_urgent
                  ? "bg-gradient-to-r from-destructive/10 via-card to-card border-l-4 border-destructive shadow-md shadow-destructive/10"
                  : "bg-card border border-border/60 card-shadow"
              }`}
            >
              <div className="flex items-center gap-3 p-3.5">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDone
                    ? "bg-success text-primary-foreground"
                    : task.is_urgent
                    ? "bg-gradient-to-br from-destructive to-destructive/70 text-primary-foreground"
                    : "bg-gradient-to-br from-primary/15 to-primary/5 text-primary"
                }`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : (typeIcon[task.task_type || ""] || <FileText className="h-5 w-5" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-[13px] font-bold truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</h4>
                    {task.is_urgent && !isDone && <Flame className="h-3.5 w-3.5 text-destructive flex-shrink-0 animate-pulse" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{task.subject_name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1 bg-muted/80 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />{task.due_date}
                    </span>
                    <Badge variant={task.task_type === "Quiz" ? "default" : "secondary"} className="text-[8px] font-bold px-2 py-0 rounded-full">
                      {task.task_type}
                    </Badge>
                    {isDone && (
                      <span className="text-[8px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">DONE</span>
                    )}
                    {task.is_urgent && !isDone && (
                      <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">URGENT</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {typeIcon[open.task_type || ""] || <FileText className="h-5 w-5" />}
                  {open.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {open.subject_name} • {open.task_type}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Due: {open.due_date || "No due date"}</span>
                </div>
                {open.is_urgent && (
                  <div className="flex items-center gap-2 text-xs text-destructive font-bold">
                    <Flame className="h-3.5 w-3.5" /> Urgent
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-2">
                  Mark this task as complete when you're done. Your progress syncs in real-time.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(null)} className="rounded-md">
                  Close
                </Button>
                <Button size="sm" onClick={() => toggleComplete(open)} className="rounded-md font-bold">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {completed.has(open.id) ? "Undo Complete" : "Mark Complete"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpcomingTasks;
