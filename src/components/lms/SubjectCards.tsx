import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, BookText, FlaskConical, Languages, Globe2, Music, Wrench, BookOpen, Lightbulb, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Calculator, BookText, FlaskConical, Languages, Globe2, Music, Wrench, BookOpen, Lightbulb, Palette,
};

type Subject = {
  id: string;
  name: string;
  teacher_name: string | null;
  icon_name: string | null;
  color: string | null;
  progress: number | null;
};

const SubjectCards = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    supabase.from("subjects").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setSubjects((data as Subject[]) || []);
    });
  }, []);

  const handleClick = (subjectId: string) => {
    if (!isLoggedIn) {
      toast.info("Please login to view subject details");
      navigate("/login");
      return;
    }
    navigate(`/subject/${subjectId}`);
  };

  const textColorMap: Record<string, string> = {
    "bg-subject-math": "text-subject-math",
    "bg-subject-english": "text-subject-english",
    "bg-subject-science": "text-subject-science",
    "bg-subject-filipino": "text-subject-filipino",
    "bg-subject-ap": "text-subject-ap",
    "bg-subject-mapeh": "text-subject-mapeh",
    "bg-subject-tle": "text-subject-tle",
  };

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">My Subjects</h2>
          <p className="text-[11px] text-muted-foreground">Tap a subject to view lessons</p>
        </div>
        <button className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" onClick={() => navigate("/subjects")}>
          See All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {subjects.map((subject, i) => {
          const Icon = iconMap[subject.icon_name || "BookOpen"] || BookOpen;
          const color = subject.color || "bg-subject-math";
          const textColor = textColorMap[color] || "text-primary";
          return (
            <button
              key={subject.id}
              onClick={() => handleClick(subject.id)}
              className="min-w-[150px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 text-left animate-slide-in-right group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`${color} h-1.5 w-full`} />
              <div className="p-3.5 pt-3">
                <div className={`h-10 w-10 rounded-xl ${color}/15 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-5 w-5 ${textColor}`} />
                </div>
                <h3 className="text-[13px] font-bold text-foreground leading-tight mb-0.5">{subject.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-3">{subject.teacher_name}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-foreground">{subject.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className={`${color} h-2 rounded-full transition-all duration-700 ease-out`} style={{ width: `${subject.progress || 0}%` }} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SubjectCards;
