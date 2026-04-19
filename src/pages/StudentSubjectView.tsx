import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LMSHeader from "@/components/lms/LMSHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, BookMarked, ListChecks, Trophy, Calendar, Link as LinkIcon, GraduationCap, CheckCircle2, Lock, Sparkles, PartyPopper } from "lucide-react";
import { toast } from "sonner";

type Tab = "activities" | "quizzes" | "materials";

const StudentSubjectView = () => {
  const { ssId } = useParams<{ ssId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("activities");
  const [meta, setMeta] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<Record<string, any>>({});
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quiz player state
  const [playing, setPlaying] = useState<any | null>(null); // quiz row
  const [questions, setQuestions] = useState<any[]>([]);
  const [choicesMap, setChoicesMap] = useState<Record<string, any[]>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resultDialog, setResultDialog] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    if (!ssId) return;
    load();
    const ch = supabase
      .channel(`learn-${ssId}`)
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
    setLoading(true);
    const { data: ss } = await supabase.from("section_subjects").select("*").eq("id", ssId).maybeSingle();
    if (!ss) { toast.error("Subject not found"); navigate("/"); return; }

    const [{ data: subj }, { data: sec }, { data: teacher }, mem] = await Promise.all([
      supabase.from("subjects").select("*").eq("id", ss.subject_id).maybeSingle(),
      supabase.from("sections").select("*").eq("id", ss.section_id).maybeSingle(),
      supabase.from("profiles").select("first_name, last_name").eq("user_id", ss.teacher_id).maybeSingle(),
      user ? supabase.from("section_members").select("id").eq("section_id", ss.section_id).eq("student_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setMeta({ ss, subject: subj, section: sec, teacher });
    setIsMember(!!mem.data);

    const [{ data: acts }, { data: mats }, { data: qs }] = await Promise.all([
      supabase.from("activities").select("*").eq("section_subject_id", ssId).order("created_at", { ascending: false }),
      supabase.from("materials").select("*").eq("section_subject_id", ssId).order("created_at", { ascending: false }),
      supabase.from("quizzes").select("*").eq("section_subject_id", ssId).eq("is_published", true).order("created_at", { ascending: false }),
    ]);
    setActivities(acts || []);
    setMaterials(mats || []);
    setQuizzes(qs || []);

    if (user && (qs || []).length) {
      const { data: att } = await supabase.from("quiz_attempts").select("*").in("quiz_id", (qs || []).map((q: any) => q.id)).eq("student_id", user.id);
      const m: Record<string, any> = {};
      (att || []).forEach((a: any) => (m[a.quiz_id] = a));
      setAttempts(m);
    }
    setLoading(false);
  };

  const startQuiz = async (q: any) => {
    if (!isMember) return toast.error("Join the section first");
    if (attempts[q.id]) return toast.info("You've already attempted this quiz");
    const { data: qq } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("position");
    const qIds = (qq || []).map((x: any) => x.id);
    const { data: cc } = qIds.length
      ? await supabase.from("quiz_choices").select("id, choice_text, position, question_id").in("question_id", qIds).order("position")
      : { data: [] as any[] };
    const map: Record<string, any[]> = {};
    (cc || []).forEach((c: any) => {
      if (!map[c.question_id]) map[c.question_id] = [];
      map[c.question_id].push(c);
    });
    setQuestions(qq || []);
    setChoicesMap(map);
    setAnswers({});
    setPlaying(q);
  };

  const submitQuiz = async () => {
    if (!playing) return;
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0 && !confirm(`${unanswered.length} unanswered. Submit anyway?`)) return;
    setSubmitting(true);
    const payload = questions.map((q) => ({ question_id: q.id, choice_id: answers[q.id] || null }));
    const { data, error } = await supabase.rpc("submit_quiz", { _quiz_id: playing.id, _answers: payload });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const r = data as any;
    setResultDialog({ score: r.score, total: r.total });
    setPlaying(null);
    load();
  };

  if (loading || !meta) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "activities", label: "Activities", icon: FileText, count: activities.length },
    { key: "quizzes", label: "Quizzes", icon: ListChecks, count: quizzes.length },
    { key: "materials", label: "Materials", icon: BookMarked, count: materials.length },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <div className={`relative ${meta.subject?.color || "bg-primary"} px-4 py-5`}>
          <Button variant="ghost" size="icon" className="absolute top-3 left-2 rounded-xl text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-10">
            <p className="text-[11px] text-primary-foreground/80 font-semibold uppercase tracking-wide">My Subject</p>
            <h1 className="text-xl font-extrabold text-primary-foreground">{meta.subject?.name}</h1>
            <p className="text-[11px] text-primary-foreground/90 mt-0.5 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {meta.teacher ? `${meta.teacher.first_name} ${meta.teacher.last_name}` : "Teacher"} · {meta.section?.name}
            </p>
          </div>
        </div>

        {!isMember && (
          <div className="mx-4 mt-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-[11px] text-foreground">
              You're not a member of <b>{meta.section?.name}</b>. You can browse but cannot take quizzes.
            </p>
          </div>
        )}

        <div className="px-4 py-3 bg-card border-b border-border flex gap-1.5 overflow-x-auto scrollbar-hide mt-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <t.icon className="h-3 w-3" /> {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 animate-fade-in">
          {tab === "activities" && (
            activities.length === 0 ? <Empty icon={<FileText className="h-10 w-10" />} title="No activities" desc="Your teacher hasn't posted any yet." /> :
            activities.map((a) => (
              <div key={a.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                {a.instructions && <p className="text-[11px] text-muted-foreground mt-1">{a.instructions}</p>}
                {a.due_date && (
                  <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> Due {new Date(a.due_date).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          )}

          {tab === "materials" && (
            materials.length === 0 ? <Empty icon={<BookMarked className="h-10 w-10" />} title="No materials" desc="No resources yet." /> :
            materials.map((m) => (
              <div key={m.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
                {m.description && <p className="text-[11px] text-muted-foreground mt-1">{m.description}</p>}
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary font-bold mt-1.5 inline-flex items-center gap-1 hover:underline">
                    <LinkIcon className="h-2.5 w-2.5" /> Open
                  </a>
                )}
              </div>
            ))
          )}

          {tab === "quizzes" && (
            quizzes.length === 0 ? <Empty icon={<ListChecks className="h-10 w-10" />} title="No quizzes" desc="No quizzes published yet." /> :
            quizzes.map((q) => {
              const a = attempts[q.id];
              const pct = a && a.total_points ? Math.round((a.score / a.total_points) * 100) : null;
              return (
                <div key={q.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{q.title}</h3>
                      {q.instructions && <p className="text-[11px] text-muted-foreground mt-1">{q.instructions}</p>}
                      {q.time_limit_minutes && <p className="text-[10px] text-muted-foreground mt-1">⏱ {q.time_limit_minutes} min</p>}
                    </div>
                    {a && (
                      <Badge className={`text-[9px] ${pct! >= 75 ? "bg-success" : "bg-destructive"} text-primary-foreground`}>
                        {a.score}/{a.total_points}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    {a ? (
                      <div className="text-[11px] text-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Submitted · {pct}%
                      </div>
                    ) : isMember ? (
                      <Button size="sm" className="rounded-lg text-[11px] h-7" onClick={() => startQuiz(q)}>
                        <Sparkles className="h-3 w-3 mr-1" /> Take Quiz
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-7" disabled>
                        <Lock className="h-3 w-3 mr-1" /> Join section first
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quiz player overlay */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-background py-2">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Quiz</p>
                <h2 className="text-lg font-extrabold text-foreground">{playing.title}</h2>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { if (confirm("Leave quiz? Your progress will be lost.")) setPlaying(null); }}>
                Cancel
              </Button>
            </div>
            {playing.instructions && (
              <div className="bg-muted/30 rounded-xl p-3 mb-3 text-xs text-muted-foreground">{playing.instructions}</div>
            )}
            <div className="space-y-3">
              {questions.map((q, qi) => (
                <div key={q.id} className="bg-card rounded-2xl p-4 card-shadow border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold flex items-center justify-center">{qi + 1}</span>
                    <p className="text-sm font-bold text-foreground flex-1">{q.question_text}</p>
                    <Badge variant="outline" className="text-[9px]">{q.points} pt</Badge>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {(choicesMap[q.id] || []).map((c) => (
                      <label key={c.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        answers[q.id] === c.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      }`}>
                        <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === c.id} onChange={() => setAnswers({ ...answers, [q.id]: c.id })} />
                        <span className="text-[13px] text-foreground">{c.choice_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 h-11 rounded-xl text-sm font-bold" onClick={submitQuiz} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Quiz"}
            </Button>
          </div>
        </div>
      )}

      {/* Result celebration */}
      {resultDialog && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4" onClick={() => setResultDialog(null)}>
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full text-center card-shadow border border-border/50 animate-fade-in">
            <div className="mx-auto h-20 w-20 rounded-full shopee-gradient flex items-center justify-center mb-3">
              <PartyPopper className="h-10 w-10 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground">Submitted!</h3>
            <p className="text-sm text-muted-foreground mt-1">Your score</p>
            <p className="text-5xl font-extrabold text-primary mt-2">{resultDialog.score}<span className="text-2xl text-muted-foreground">/{resultDialog.total}</span></p>
            <p className="text-xs text-muted-foreground mt-1">
              {resultDialog.total ? Math.round((resultDialog.score / resultDialog.total) * 100) : 0}%
            </p>
            <Button className="w-full mt-4 rounded-xl" onClick={() => setResultDialog(null)}>Done</Button>
          </div>
        </div>
      )}
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

export default StudentSubjectView;
