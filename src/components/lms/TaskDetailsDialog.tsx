import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ClipboardCheck, PenLine, Link as LinkIcon, CheckCircle2, Loader2, Undo2, Sparkles, Flame, GraduationCap, School, AlertTriangle, Upload, FileText, Download, Paperclip, X, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

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
  const ms = d.getTime() - Date.now();
  const dateStr = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  if (ms < 0) {
    const lateDays = Math.ceil(Math.abs(ms) / (1000 * 60 * 60 * 24));
    return `Late by ${lateDays}d · ${dateStr}`;
  }
  const diff = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const hrs = Math.ceil(ms / (1000 * 60 * 60));
  if (diff === 0) return `Due in ${hrs}h · ${dateStr}`;
  if (diff === 1) return `Due tomorrow · ${dateStr}`;
  return `Due in ${diff} days · ${dateStr}`;
};
const isLate = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();
const isUrgent = (iso?: string | null) => {
  if (!iso) return false;
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 && ms <= 1000 * 60 * 60 * 48;
};

const TaskDetailsDialog = ({ item, open, onOpenChange, onChanged }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setNote(sub.data?.note || "");
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
  const late = isActivity && isLate(details?.due_date) && !isSubmitted;
  const urgent = isActivity && isUrgent(details?.due_date) && !isSubmitted;

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${item.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("submissions")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("submissions").getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  const markSubmitted = async (fileUrl?: string | null) => {
    if (!user) return toast.error("Sign in to submit");
    setWorking(true);
    const payload: any = { activity_id: item.id, student_id: user.id };
    if (note.trim()) payload.note = note.trim();
    if (fileUrl) payload.url = fileUrl;
    const { data, error } = await supabase
      .from("activity_submissions")
      .insert(payload)
      .select()
      .maybeSingle();
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("✓ Submission received!", { description: "You can still update or undo." });
    setSubmission(data || { activity_id: item.id, student_id: user.id, submitted_at: new Date().toISOString(), note: payload.note, url: payload.url });
    onChanged?.();
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast.error("File too large (max 20MB)");
    const url = await uploadFile(f);
    if (!url) return;
    if (isSubmitted) {
      // Update existing submission with new URL
      const { error } = await supabase
        .from("activity_submissions")
        .update({ url, note: note.trim() || null })
        .eq("activity_id", item.id)
        .eq("student_id", user!.id);
      if (error) return toast.error(error.message);
      toast.success("Attachment updated!");
      setSubmission({ ...submission, url });
      onChanged?.();
    } else {
      await markSubmitted(url);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const goToQuiz = () => {
    onOpenChange(false);
    navigate(`/learn/${item.ss_id}?tab=quizzes&quiz=${item.id}&return=home`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className={`p-4 ${isActivity ? "bg-gradient-to-br from-accent/30 to-accent/10" : "bg-gradient-to-br from-primary/15 to-primary/5"}`}>
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isActivity ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                {isActivity ? <PenLine className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
              </div>
              <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wide bg-card/70">
                {item.kind}
              </Badge>
              {late && (
                <Badge className="text-[9px] uppercase font-extrabold tracking-wide bg-destructive text-destructive-foreground">
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Late
                </Badge>
              )}
              {!late && urgent && (
                <Badge className="text-[9px] uppercase font-bold tracking-wide bg-warning text-warning-foreground">
                  <Flame className="h-2.5 w-2.5 mr-1" /> Urgent
                </Badge>
              )}
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
                <div className={`flex items-center gap-2 text-[12px] font-bold rounded-lg px-3 py-2 ${
                  late ? "bg-destructive/10 text-destructive" : urgent ? "bg-warning/10 text-warning" : "bg-muted/40 text-foreground"
                }`}>
                  <CalendarClock className="h-3.5 w-3.5" />
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

              {/* Teacher-provided attachment (activities) */}
              {isActivity && details?.attachment_url && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Attachment from teacher</p>
                  <a
                    href={details.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={details.attachment_name || true}
                    className="flex items-center justify-between gap-2 text-[12px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors border border-primary/20"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{details.attachment_name || "Open attachment"}</span>
                    </span>
                    <Download className="h-3.5 w-3.5 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Activity submission area */}
              {isActivity && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Your submission
                  </p>
                  {submission?.url && (
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 text-[11px] font-bold text-success bg-success/10 hover:bg-success/15 rounded-lg px-2.5 py-1.5 transition-colors border border-success/30"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Uploaded file</span>
                      </span>
                      <Download className="h-3 w-3 flex-shrink-0" />
                    </a>
                  )}
                  <Textarea
                    placeholder="Optional note to your teacher…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="text-[11px] min-h-[56px] resize-none rounded-lg"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFilePick}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg text-[11px] h-9 font-bold border-dashed border-primary/40 hover:bg-primary/5"
                    disabled={uploading || !user}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                    {submission?.url ? "Replace file" : "Upload file (max 20MB)"}
                  </Button>
                </div>
              )}

              {!isActivity && submission && (
                <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-4 text-center">
                  <Trophy className="h-6 w-6 text-success mx-auto mb-1" />
                  <p className="text-[10px] font-bold uppercase text-success tracking-wide">Your Result</p>
                  <p className="text-2xl font-extrabold text-success mt-1">
                    {submission.score}<span className="text-base text-success/60">/{submission.total_points}</span>
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
                <Button className="flex-1 rounded-xl text-xs h-10 font-bold" disabled={working || !user} onClick={() => markSubmitted()}>
                  {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Submitted</>}
                </Button>
              </div>
            )
          ) : isSubmitted ? (
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl h-10 text-xs font-bold" variant="outline" onClick={goToSubject}>
                View Subject
              </Button>
              <Button className="flex-1 rounded-xl h-10 text-xs font-bold" onClick={goToQuiz}>
                <Trophy className="h-3.5 w-3.5 mr-1" /> View Result
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold" onClick={goToSubject}>
                View Subject
              </Button>
              <Button className="flex-1 rounded-xl h-10 text-xs font-bold" onClick={goToQuiz}>
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Start Quiz
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;