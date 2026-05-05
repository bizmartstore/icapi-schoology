import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ClipboardCheck, PenLine, Link as LinkIcon, CheckCircle2, Loader2, Undo2, Sparkles, Flame, GraduationCap, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type TaskDialogItem = {
  id: string; // raw id (activity or quiz)
  kind: "activity" | "quiz";
  title: string;
  subject_name: string;
  section_name: string;
  ss_id: string;
  due_date?: string | null;
  done?: boolean;
};

type Props = {
  item: TaskDialogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

const formatDue = (iso?: string | null) => {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dateStr = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  if (diff < 0) return `Overdue · ${dateStr}`;
  if (diff === 0) return `Due today · ${dateStr}`;
  if (diff === 1) return `Due tomorrow · ${dateStr}`;
  return `Due in ${diff} days · ${dateStr}`;
};

const TaskDetailsDialog = ({ item, open, onOpenChange, onChanged }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDetails(null);
      setSubmission(null);
      if (item.kind === "activity") {
        const [{ data: act }, sub] = await Promise.all([
          supabase.from("activities").select("*").eq("id", item.id).maybeSingle(),
          user
            ? supabase
                .from("activity_submissions")
                .select("*")
                .eq("activity_id", item.id)
                .eq("student_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (!cancelled) {
          setDetails(act);
          setSubmission(sub.data || null);
        }
      } else {
        const [{ data: quiz }, att] = await Promise.all([
          supabase.from("quizzes").select("*").eq("id", item.id).maybeSingle(),
          user
            ? supabase
                .from("quiz_attempts")
                .select("*")
                .eq("quiz_id", item.id)
                .eq("student_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (!cancelled) {
          setDetails(quiz);
          setSubmission(att.data || null);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, item?.id, item?.kind, user?.id]);

  if (!item) return null;

  const isActivity = item.kind === "activity";
  const isSubmitted = !!submission;

  const markSubmitted = async () => {
    if (!user) return toast.error("Sign in to submit");
    setWorking(true);
    const { error } = await supabase
      .from("activity_submissions")
      .insert({ activity_id: item.id, student_id: user.id });
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("Marked as submitted!");
    setSubmission({ activity_id: item.id, student_id: user.id, submitted_at: new Date().toISOString() });
    onChanged?.();
  };

  const undoSubmitted = async () => {
    if (!user) return;
    setWorking(true);
    const { error } = await supabase
      .from("activity_submissions")
      .delete()
      .eq("activity_id", item.id)
      .eq("student_id", user.id);
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("Marked as not submitted");
    setSubmission(null);
    onChanged?.();
  };

  const goToSubject = () => {
    onOpenChange(false);
    navigate(`/learn/${item.ss_id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className={`p-4 ${isActivity ? "bg-gradient-to-br from-accent/30 to-accent/10" : "bg-gradient-to-br from-primary/15 to-primary/5"}`}>
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isActivity ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                {isActivity ? <PenLine className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
              </div>
              <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wide bg-card/70">
                {item.kind}
              </Badge>
              {isSubmitted && (
                <Badge className="text-[9px] uppercase font-bold tracking-wide bg-success text-primary-foreground">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> {isActivity ? "Submitted" : "Done"}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-base font-extrabold leading-snug">{item.title}</DialogTitle>
            <DialogDescription className="text-[11px] flex items-center gap-2 text-muted-foreground">
              <School className="h-3 w-3" /> {item.section_name}
              <span className="text-muted-foreground/40">·</span>
              <GraduationCap className="h-3 w-3" /> {item.subject_name}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[55vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 rounded bg-muted animate-pulse w-3/4" />
              <div className="h-3 rounded bg-muted animate-pulse w-full" />
              <div className="h-3 rounded bg-muted animate-pulse w-5/6" />
            </div>
          ) : (
            <>
              {isActivity && details?.due_date && (
                <div className="flex items-center gap-2 text-[12px] font-bold text-foreground bg-muted/40 rounded-lg px-3 py-2">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  {formatDue(details.due_date)}
                </div>
              )}
              {!isActivity && details?.time_limit_minutes && (
                <div className="flex items-center gap-2 text-[12px] font-bold text-foreground bg-muted/40 rounded-lg px-3 py-2">
                  <Flame className="h-3.5 w-3.5 text-primary" /> Time limit: {details.time_limit_minutes} min
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Instructions</p>
                <p className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {details?.instructions || <span className="text-muted-foreground italic">No instructions provided.</span>}
                </p>
              </div>

              {/* Attachments / link (activities can carry a URL via instructions; quizzes don't) */}
              {isActivity && details?.url && (
                <a
                  href={details.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" /> Open attachment
                </a>
              )}

              {!isActivity && submission && (
                <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                  <p className="text-[11px] font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> You scored {submission.score}/{submission.total_points}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 pt-2 border-t border-border space-y-2 bg-card">
          {isActivity ? (
            isSubmitted ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl text-xs h-10" onClick={goToSubject}>
                  View Subject
                </Button>
                <Button variant="ghost" className="rounded-xl text-xs h-10 text-muted-foreground" disabled={working} onClick={undoSubmitted}>
                  {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Undo2 className="h-3.5 w-3.5 mr-1" /> Undo</>}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl text-xs h-10" onClick={goToSubject}>
                  View Task
                </Button>
                <Button className="flex-1 rounded-xl text-xs h-10 font-bold" disabled={working || !user} onClick={markSubmitted}>
                  {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Submitted</>}
                </Button>
              </div>
            )
          ) : isSubmitted ? (
            <Button className="w-full rounded-xl h-10 text-xs font-bold" variant="outline" onClick={goToSubject}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> View Result
            </Button>
          ) : (
            <Button className="w-full rounded-xl h-10 text-xs font-bold" onClick={goToSubject}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Start Quiz
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;