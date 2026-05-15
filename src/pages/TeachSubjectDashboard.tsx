import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LMSHeader from "@/components/lms/LMSHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileText, BookMarked, ListChecks, Trophy, Trash2, Eye, EyeOff, Save, X, Calendar, Link as LinkIcon, GraduationCap, Upload, Loader2, Download, File as FileIcon } from "lucide-react";
import { toast } from "sonner";

type Tab = "activities" | "quizzes" | "materials" | "results";

const TeachSubjectDashboard = () => {
  const { ssId } = useParams<{ ssId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("activities");
  const [meta, setMeta] = useState<{ subject?: any; section?: any } | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [results, setResults] = useState<{ quiz: any; attempts: any[]; students: Record<string, any> }[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Composer dialogs
  const [actDlg, setActDlg] = useState(false);
  const [actForm, setActForm] = useState<{ title: string; instructions: string; due_date: string }>({ title: "", instructions: "", due_date: "" });
  const [matDlg, setMatDlg] = useState(false);
  const [matForm, setMatForm] = useState<{ title: string; description: string; url: string; file_name: string; file_type: string; file_size: number | null }>({ title: "", description: "", url: "", file_name: "", file_type: "", file_size: null });
  const [matUploading, setMatUploading] = useState(false);
  const matFileRef = useRef<HTMLInputElement>(null);
  const [quizDlg, setQuizDlg] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [quizForm, setQuizForm] = useState<{
    title: string; instructions: string; time_limit_minutes: string; is_published: boolean;
    questions: { id?: string; question_text: string; points: number; choices: { id?: string; choice_text: string; is_correct: boolean }[] }[];
  }>({ title: "", instructions: "", time_limit_minutes: "", is_published: false, questions: [] });

  useEffect(() => {
    if (!ssId || !user) return;
    load();
    const ch = supabase
      .channel(`teach-${ssId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "activities", filter: `section_subject_id=eq.${ssId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "materials", filter: `section_subject_id=eq.${ssId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quizzes", filter: `section_subject_id=eq.${ssId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_attempts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssId, user?.id]);

  const load = async () => {
    if (!ssId) return;
    const { data: ss } = await supabase.from("section_subjects").select("*").eq("id", ssId).maybeSingle();
    if (!ss) { toast.error("Not found"); navigate("/sections"); return; }

    const [{ data: subj }, { data: sec }, { data: acts }, { data: mats }, { data: qs }, { data: mems }] = await Promise.all([
      supabase.from("subjects").select("*").eq("id", ss.subject_id).maybeSingle(),
      supabase.from("sections").select("*").eq("id", ss.section_id).maybeSingle(),
      supabase.from("activities").select("*").eq("section_subject_id", ssId).order("created_at", { ascending: false }),
      supabase.from("materials").select("*").eq("section_subject_id", ssId).order("created_at", { ascending: false }),
      supabase.from("quizzes").select("*").eq("section_subject_id", ssId).order("created_at", { ascending: false }),
      supabase.from("section_members").select("*").eq("section_id", ss.section_id),
    ]);
    setMeta({ subject: subj, section: sec });
    setActivities(acts || []);
    setMaterials(mats || []);
    setQuizzes(qs || []);
    setMembers(mems || []);

    // Results: fetch attempts for each quiz, and student profiles
    const studentIds = [...new Set((mems || []).map((m: any) => m.student_id))];
    const { data: studentRows } = studentIds.length
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", studentIds)
      : { data: [] as any[] };
    const sMap: Record<string, any> = {};
    (studentRows || []).forEach((s: any) => (sMap[s.user_id] = s));

    const quizIds = (qs || []).map((q: any) => q.id);
    const { data: attempts } = quizIds.length
      ? await supabase.from("quiz_attempts").select("*").in("quiz_id", quizIds)
      : { data: [] as any[] };
    setResults(
      (qs || []).map((q: any) => ({
        quiz: q,
        attempts: (attempts || []).filter((a: any) => a.quiz_id === q.id),
        students: sMap,
      }))
    );
  };

  /* ===================== ACTIVITIES ===================== */
  const saveActivity = async () => {
    if (!actForm.title.trim()) return toast.error("Title required");
    const { error } = await supabase.from("activities").insert({
      section_subject_id: ssId!, title: actForm.title, instructions: actForm.instructions || null,
      due_date: actForm.due_date ? new Date(actForm.due_date).toISOString() : null,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Activity posted");
    setActDlg(false); setActForm({ title: "", instructions: "", due_date: "" });
  };
  const deleteActivity = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
  };

  /* ===================== MATERIALS ===================== */
  const saveMaterial = async () => {
    if (!matForm.title.trim()) return toast.error("Title required");
    if (!matForm.url) return toast.error("Upload a file or paste a link");
    const { error } = await supabase.from("materials").insert({
      section_subject_id: ssId!,
      title: matForm.title,
      description: matForm.description || null,
      url: matForm.url || null,
      file_name: matForm.file_name || null,
      file_type: matForm.file_type || null,
      file_size: matForm.file_size || null,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Module published — students can now download");
    setMatDlg(false);
    setMatForm({ title: "", description: "", url: "", file_name: "", file_type: "", file_size: null });
  };
  const uploadMaterialFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) return toast.error("File too large (max 50MB)");
    if (!user) return;
    setMatUploading(true);
    const ext = f.name.split(".").pop() || "bin";
    const path = `${user.id}/${ssId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("materials").upload(path, f, { upsert: true, contentType: f.type });
    if (error) {
      setMatUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("materials").getPublicUrl(path);
    setMatForm((prev) => ({
      ...prev,
      url: data.publicUrl,
      file_name: f.name,
      file_type: f.type || "",
      file_size: f.size,
      title: prev.title || f.name.replace(/\.[^.]+$/, ""),
    }));
    setMatUploading(false);
    if (matFileRef.current) matFileRef.current.value = "";
    toast.success("File uploaded");
  };
  const deleteMaterial = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
  };

  /* ===================== QUIZZES ===================== */
  const openNewQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({
      title: "", instructions: "", time_limit_minutes: "", is_published: false,
      questions: [{ question_text: "", points: 1, choices: [{ choice_text: "", is_correct: true }, { choice_text: "", is_correct: false }] }],
    });
    setQuizDlg(true);
  };
  const openEditQuiz = async (q: any) => {
    setEditingQuiz(q);
    const { data: qq } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("position");
    const qIds = (qq || []).map((x: any) => x.id);
    const { data: cc } = qIds.length
      ? await supabase.from("quiz_choices").select("*").in("question_id", qIds).order("position")
      : { data: [] as any[] };
    setQuizForm({
      title: q.title, instructions: q.instructions || "", time_limit_minutes: q.time_limit_minutes?.toString() || "",
      is_published: q.is_published,
      questions: (qq || []).map((x: any) => ({
        id: x.id, question_text: x.question_text, points: x.points,
        choices: (cc || []).filter((c: any) => c.question_id === x.id).map((c: any) => ({ id: c.id, choice_text: c.choice_text, is_correct: c.is_correct })),
      })),
    });
    setQuizDlg(true);
  };
  const saveQuiz = async () => {
    if (!quizForm.title.trim()) return toast.error("Quiz title required");
    if (quizForm.questions.length === 0) return toast.error("Add at least one question");
    for (const q of quizForm.questions) {
      if (!q.question_text.trim()) return toast.error("All questions need text");
      if (q.choices.length < 2) return toast.error("Each question needs at least 2 choices");
      if (!q.choices.some((c) => c.is_correct)) return toast.error("Each question needs a correct choice");
      if (q.choices.some((c) => !c.choice_text.trim())) return toast.error("Choice text cannot be empty");
    }

    let quizId = editingQuiz?.id as string | undefined;
    if (editingQuiz) {
      const { error } = await supabase.from("quizzes").update({
        title: quizForm.title, instructions: quizForm.instructions || null,
        time_limit_minutes: quizForm.time_limit_minutes ? parseInt(quizForm.time_limit_minutes) : null,
        is_published: quizForm.is_published,
      }).eq("id", editingQuiz.id);
      if (error) return toast.error(error.message);
      // wipe & rewrite questions for simplicity
      await supabase.from("quiz_questions").delete().eq("quiz_id", editingQuiz.id);
    } else {
      const { data, error } = await supabase.from("quizzes").insert({
        section_subject_id: ssId!, title: quizForm.title, instructions: quizForm.instructions || null,
        time_limit_minutes: quizForm.time_limit_minutes ? parseInt(quizForm.time_limit_minutes) : null,
        is_published: quizForm.is_published, created_by: user!.id,
      }).select("id").single();
      if (error || !data) return toast.error(error?.message || "Failed");
      quizId = data.id;
    }

    // Insert questions then choices
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      const { data: qRow, error: qErr } = await supabase.from("quiz_questions").insert({
        quiz_id: quizId!, question_text: q.question_text, position: i, points: q.points || 1,
      }).select("id").single();
      if (qErr || !qRow) return toast.error(qErr?.message || "Failed to save question");
      const choicesPayload = q.choices.map((c, j) => ({ question_id: qRow.id, choice_text: c.choice_text, is_correct: c.is_correct, position: j }));
      const { error: cErr } = await supabase.from("quiz_choices").insert(choicesPayload);
      if (cErr) return toast.error(cErr.message);
    }

    toast.success(editingQuiz ? "Quiz updated" : "Quiz created");
    setQuizDlg(false);
  };
  const togglePublish = async (q: any) => {
    const { error } = await supabase.from("quizzes").update({ is_published: !q.is_published }).eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success(!q.is_published ? "Published" : "Unpublished");
  };
  const deleteQuiz = async (id: string) => {
    if (!confirm("Delete this quiz and all attempts?")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
  };

  if (!meta) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "activities", label: "Activities", icon: FileText, count: activities.length },
    { key: "quizzes", label: "Quizzes", icon: ListChecks, count: quizzes.length },
    { key: "materials", label: "Materials", icon: BookMarked, count: materials.length },
    { key: "results", label: "Results", icon: Trophy, count: 0 },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className={`relative ${meta.subject?.color || "bg-primary"} px-4 py-5`}>
          <Button variant="ghost" size="icon" className="absolute top-3 left-2 rounded-xl text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/sections")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-10">
            <p className="text-[11px] text-primary-foreground/80 font-semibold uppercase tracking-wide">Teaching Dashboard</p>
            <h1 className="text-xl font-extrabold text-primary-foreground">{meta.subject?.name}</h1>
            <p className="text-[11px] text-primary-foreground/90 mt-0.5">
              <GraduationCap className="inline h-3 w-3 mr-1" />
              {meta.section?.name} · {members.length} student{members.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 bg-card border-b border-border flex gap-1.5 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <t.icon className="h-3 w-3" /> {t.label}{t.key !== "results" ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 animate-fade-in">
          {/* ACTIVITIES */}
          {tab === "activities" && (
            <>
              <Button size="sm" className="rounded-xl text-xs font-bold" onClick={() => setActDlg(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Post Activity
              </Button>
              {activities.length === 0 ? (
                <Empty icon={<FileText className="h-10 w-10" />} title="No activities yet" desc="Post the first task for your students." />
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                        {a.instructions && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">{a.instructions}</p>}
                        {a.due_date && (
                          <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" /> Due {new Date(a.due_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteActivity(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* MATERIALS */}
          {tab === "materials" && (
            <>
              <Button size="sm" className="rounded-xl text-xs font-bold" onClick={() => setMatDlg(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
              </Button>
              {materials.length === 0 ? (
                <Empty icon={<BookMarked className="h-10 w-10" />} title="No materials" desc="Share readings, links, or notes." />
              ) : (
                materials.map((m) => (
                  <div key={m.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
                        {m.description && <p className="text-[11px] text-muted-foreground mt-1">{m.description}</p>}
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary font-bold mt-1.5 inline-flex items-center gap-1 hover:underline">
                            <LinkIcon className="h-2.5 w-2.5" /> Open link
                          </a>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMaterial(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* QUIZZES */}
          {tab === "quizzes" && (
            <>
              <Button size="sm" className="rounded-xl text-xs font-bold" onClick={openNewQuiz}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Quiz
              </Button>
              {quizzes.length === 0 ? (
                <Empty icon={<ListChecks className="h-10 w-10" />} title="No quizzes" desc="Create a multiple-choice quiz; students get auto-graded." />
              ) : (
                quizzes.map((q) => (
                  <div key={q.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{q.title}</h3>
                          <Badge variant={q.is_published ? "default" : "secondary"} className="text-[9px]">
                            {q.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        {q.instructions && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{q.instructions}</p>}
                        {q.time_limit_minutes && <p className="text-[10px] text-muted-foreground mt-1">⏱ {q.time_limit_minutes} min limit</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-7" onClick={() => openEditQuiz(q)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-7" onClick={() => togglePublish(q)}>
                        {q.is_published ? <><EyeOff className="h-3 w-3 mr-1" /> Unpublish</> : <><Eye className="h-3 w-3 mr-1" /> Publish</>}
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-7 text-destructive hover:text-destructive" onClick={() => deleteQuiz(q.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* RESULTS */}
          {tab === "results" && (
            results.length === 0 ? (
              <Empty icon={<Trophy className="h-10 w-10" />} title="No quizzes yet" desc="Create a quiz to see student results here." />
            ) : (
              results.map((r) => {
                const avg = r.attempts.length ? Math.round(r.attempts.reduce((s, a) => s + (a.total_points ? a.score / a.total_points : 0), 0) / r.attempts.length * 100) : 0;
                return (
                  <div key={r.quiz.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-foreground">{r.quiz.title}</h3>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-semibold">{r.attempts.length}/{members.length} submitted</p>
                        <p className="text-[11px] font-extrabold text-primary">Avg {avg}%</p>
                      </div>
                    </div>
                    {members.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">No students enrolled yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {members.map((m: any) => {
                          const a = r.attempts.find((x) => x.student_id === m.student_id);
                          const s = r.students[m.student_id];
                          const pct = a && a.total_points ? Math.round((a.score / a.total_points) * 100) : null;
                          return (
                            <div key={m.id} className="flex items-center justify-between text-[11px] py-1 border-b border-border/30 last:border-0">
                              <span className="text-foreground font-medium">{s ? `${s.last_name}, ${s.first_name}` : "Student"}</span>
                              {a ? (
                                <span className={`font-extrabold ${pct! >= 75 ? "text-success" : "text-destructive"}`}>
                                  {a.score}/{a.total_points} · {pct}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic text-[10px]">Not yet</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Activity dialog */}
      <Dialog open={actDlg} onOpenChange={setActDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })} /></div>
            <div><Label>Instructions</Label><Textarea rows={4} value={actForm.instructions} onChange={(e) => setActForm({ ...actForm, instructions: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="datetime-local" value={actForm.due_date} onChange={(e) => setActForm({ ...actForm, due_date: e.target.value })} /></div>
            <Button className="w-full" onClick={saveActivity}><Save className="h-4 w-4 mr-1" /> Post</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material dialog */}
      <Dialog open={matDlg} onOpenChange={setMatDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={matForm.description} onChange={(e) => setMatForm({ ...matForm, description: e.target.value })} /></div>
            <div><Label>URL (optional)</Label><Input placeholder="https://…" value={matForm.url} onChange={(e) => setMatForm({ ...matForm, url: e.target.value })} /></div>
            <Button className="w-full" onClick={saveMaterial}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz dialog */}
      <Dialog open={quizDlg} onOpenChange={setQuizDlg}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} /></div>
            <div><Label>Instructions</Label><Textarea rows={2} value={quizForm.instructions} onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Time limit (min)</Label><Input type="number" value={quizForm.time_limit_minutes} onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: e.target.value })} /></div>
              <div className="flex items-end gap-2">
                <input id="pub" type="checkbox" checked={quizForm.is_published} onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="pub">Published</Label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Questions</p>
                <Button size="sm" variant="outline" className="text-[11px] h-7 rounded-lg" onClick={() => setQuizForm({
                  ...quizForm,
                  questions: [...quizForm.questions, { question_text: "", points: 1, choices: [{ choice_text: "", is_correct: true }, { choice_text: "", is_correct: false }] }],
                })}>
                  <Plus className="h-3 w-3 mr-1" /> Question
                </Button>
              </div>
              {quizForm.questions.map((q, qi) => (
                <div key={qi} className="border border-border rounded-xl p-2.5 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground">Q{qi + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setQuizForm({ ...quizForm, questions: quizForm.questions.filter((_, i) => i !== qi) })}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input placeholder="Question text" value={q.question_text} onChange={(e) => {
                    const qs = [...quizForm.questions]; qs[qi] = { ...q, question_text: e.target.value }; setQuizForm({ ...quizForm, questions: qs });
                  }} />
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px]">Points</Label>
                    <Input type="number" className="h-7 w-20 text-xs" value={q.points} onChange={(e) => {
                      const qs = [...quizForm.questions]; qs[qi] = { ...q, points: parseInt(e.target.value) || 1 }; setQuizForm({ ...quizForm, questions: qs });
                    }} />
                  </div>
                  <div className="space-y-1">
                    {q.choices.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={c.is_correct} onChange={() => {
                          const qs = [...quizForm.questions];
                          qs[qi] = { ...q, choices: q.choices.map((cc, i) => ({ ...cc, is_correct: i === ci })) };
                          setQuizForm({ ...quizForm, questions: qs });
                        }} />
                        <Input placeholder={`Choice ${ci + 1}`} value={c.choice_text} onChange={(e) => {
                          const qs = [...quizForm.questions];
                          qs[qi] = { ...q, choices: q.choices.map((cc, i) => i === ci ? { ...cc, choice_text: e.target.value } : cc) };
                          setQuizForm({ ...quizForm, questions: qs });
                        }} />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                          if (q.choices.length <= 2) return toast.error("At least 2 choices");
                          const qs = [...quizForm.questions];
                          qs[qi] = { ...q, choices: q.choices.filter((_, i) => i !== ci) };
                          setQuizForm({ ...quizForm, questions: qs });
                        }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => {
                      const qs = [...quizForm.questions];
                      qs[qi] = { ...q, choices: [...q.choices, { choice_text: "", is_correct: false }] };
                      setQuizForm({ ...quizForm, questions: qs });
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Choice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={saveQuiz}><Save className="h-4 w-4 mr-1" /> Save Quiz</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Empty = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="text-center py-10 text-muted-foreground">
    <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">{icon}</div>
    <p className="text-sm font-bold text-foreground">{title}</p>
    <p className="text-[11px]">{desc}</p>
  </div>
);

export default TeachSubjectDashboard;
