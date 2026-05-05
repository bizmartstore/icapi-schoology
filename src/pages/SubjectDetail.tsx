import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Calculator, BookText, FlaskConical, Languages, Globe2, Music, Wrench, ChevronRight, FileText, Clock, Upload, CheckCircle2, AlertCircle, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LMSHeader from "@/components/lms/LMSHeader";

const subjectData: Record<string, { name: string; teacher: string; icon: any; color: string; progress: number }> = {
  math: { name: "Mathematics", teacher: "Mrs. Santos", icon: Calculator, color: "bg-subject-math", progress: 72 },
  english: { name: "English", teacher: "Mr. Reyes", icon: BookText, color: "bg-subject-english", progress: 85 },
  science: { name: "Science", teacher: "Ms. Cruz", icon: FlaskConical, color: "bg-subject-science", progress: 60 },
  filipino: { name: "Filipino", teacher: "Gng. Garcia", icon: Languages, color: "bg-subject-filipino", progress: 78 },
  ap: { name: "Araling Panlipunan", teacher: "Mr. Bautista", icon: Globe2, color: "bg-subject-ap", progress: 65 },
  mapeh: { name: "MAPEH", teacher: "Ms. Dela Cruz", icon: Music, color: "bg-subject-mapeh", progress: 90 },
  tle: { name: "TLE", teacher: "Mr. Villanueva", icon: Wrench, color: "bg-subject-tle", progress: 55 },
};

const tabs = ["Lessons", "Assignments", "Quizzes", "Discussions", "Members"];
const quarters = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];

const lessonModules = [
  { title: "Module 1: Introduction", lessons: 5, completed: 5 },
  { title: "Module 2: Core Concepts", lessons: 8, completed: 5 },
  { title: "Module 3: Applications", lessons: 6, completed: 2 },
  { title: "Module 4: Review", lessons: 4, completed: 0 },
];

const assignments = [
  { title: "Worksheet 1: Practice Problems", due: "Jan 15", status: "submitted", grade: "92/100" },
  { title: "Worksheet 2: Advanced Problems", due: "Jan 20", status: "pending", grade: null },
  { title: "Research Paper Draft", due: "Jan 25", status: "missing", grade: null },
];

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Lessons");
  const [activeQuarter, setActiveQuarter] = useState("Quarter 2");

  const subject = subjectData[id || "math"];
  if (!subject) return null;

  const Icon = subject.icon;

  const goBackToSubjects = () => {
    sessionStorage.setItem("home:restoreScroll", "1");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        {/* Subject Header */}
        <div className={`${subject.color} px-4 py-5`}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goBackToSubjects}
              className="flex items-center gap-1.5 text-primary-foreground bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Subjects
            </button>
            <button
              onClick={goBackToSubjects}
              className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-[11px] font-semibold transition-colors"
              aria-label="Home"
            >
              <Home className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">{subject.name}</h1>
              <p className="text-sm text-primary-foreground/70">{subject.teacher}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={subject.progress} className="h-2 flex-1 bg-primary-foreground/20" />
            <span className="text-sm font-bold text-primary-foreground">{subject.progress}%</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4 animate-fade-in">
          {activeTab === "Lessons" && (
            <>
              {/* Quarter chips */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {quarters.map((q) => (
                  <button
                    key={q}
                    onClick={() => setActiveQuarter(q)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeQuarter === q
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Modules */}
              <div className="space-y-3">
                {lessonModules.map((mod, i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-foreground">{mod.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(mod.completed / mod.lessons) * 100} className="h-1.5 flex-1" />
                      <span className="text-[11px] text-muted-foreground">{mod.completed}/{mod.lessons}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "Assignments" && (
            <div className="space-y-3">
              {assignments.map((a, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 card-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                    </div>
                    <Badge
                      variant={a.status === "submitted" ? "default" : a.status === "missing" ? "destructive" : "secondary"}
                      className="text-[10px] capitalize"
                    >
                      {a.status === "submitted" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {a.status === "missing" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {a.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due: {a.due}</span>
                    {a.grade && <span className="font-semibold text-success">Grade: {a.grade}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs rounded-xl">View Task</Button>
                    {a.status !== "submitted" && (
                      <Button size="sm" className="text-xs rounded-xl">
                        <Upload className="h-3 w-3 mr-1" /> Submit Work
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Quizzes" && (
            <div className="space-y-3">
              {[
                { title: "Quiz 1: Basic Concepts", questions: 20, time: "30 min", status: "completed", score: "18/20" },
                { title: "Quiz 2: Mid-Quarter", questions: 30, time: "45 min", status: "upcoming", score: null },
              ].map((q, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 card-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{q.title}</h3>
                    <Badge variant={q.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">{q.status}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">{q.questions} questions • {q.time}</p>
                  {q.score && <p className="text-sm font-bold text-success">Score: {q.score}</p>}
                  {!q.score && <Button size="sm" className="text-xs rounded-xl">Take Quiz</Button>}
                </div>
              ))}
            </div>
          )}

          {activeTab === "Discussions" && (
            <div className="text-center py-10">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No discussions yet</h3>
              <p className="text-xs text-muted-foreground">Start a conversation with your classmates</p>
            </div>
          )}

          {activeTab === "Members" && (
            <div className="space-y-2">
              {["Mrs. Santos (Teacher)", "Juan Dela Cruz", "Maria Clara", "Jose Rizal", "Andres Bonifacio"].map((name, i) => (
                <div key={i} className="bg-card rounded-2xl p-3 px-4 card-shadow flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-[11px] text-muted-foreground">{i === 0 ? "Instructor" : "Student"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
