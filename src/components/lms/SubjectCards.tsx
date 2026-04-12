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

const colorToBg: Record<string, string> = {
  "bg-subject-math": "bg-subject-math/10 text-subject-math",
  "bg-subject-english": "bg-subject-english/10 text-subject-english",
  "bg-subject-science": "bg-subject-science/10 text-subject-science",
  "bg-subject-filipino": "bg-subject-filipino/10 text-subject-filipino",
  "bg-subject-ap": "bg-subject-ap/10 text-subject-ap",
  "bg-subject-mapeh": "bg-subject-mapeh/10 text-subject-mapeh",
  "bg-subject-tle": "bg-subject-tle/10 text-subject-tle",
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

  if (subjects.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <div className="grid grid-cols-3 gap-2">
        {subjects.slice(0, 6).map((subject, i) => {
          const Icon = iconMap[subject.icon_name || "BookOpen"] || BookOpen;
          const color = subject.color || "bg-subject-math";
          const styles = colorToBg[color] || "bg-primary/10 text-primary";
          return (
            <button
              key={subject.id}
              onClick={() => handleClick(subject.id)}
              className="bg-background rounded-lg p-2.5 text-center transition-all duration-150 active:scale-95 hover:shadow-sm border border-border/50"
            >
              <div className={`h-10 w-10 rounded-lg ${styles} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-[11px] font-bold text-foreground leading-tight line-clamp-1">{subject.name}</h3>
              <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{subject.teacher_name}</p>
              {(subject.progress || 0) > 0 && (
                <div className="mt-1.5">
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div className={`${color} h-1 rounded-full`} style={{ width: `${subject.progress}%` }} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {subjects.length > 6 && (
        <button onClick={() => navigate("/subjects")} className="w-full mt-2 py-2 text-[11px] font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
          View All {subjects.length} Subjects &gt;
        </button>
      )}
    </div>
  );
};

export default SubjectCards;
