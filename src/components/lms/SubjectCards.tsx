import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, BookText, FlaskConical, Languages, Globe2, Music, Wrench, BookOpen, Lightbulb, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import subjectMath from "@/assets/subject-math.jpg";
import subjectEnglish from "@/assets/subject-english.jpg";
import subjectScience from "@/assets/subject-science.jpg";
import subjectFilipino from "@/assets/subject-filipino.jpg";
import subjectAp from "@/assets/subject-ap.jpg";
import subjectMapeh from "@/assets/subject-mapeh.jpg";
import subjectTle from "@/assets/subject-tle.jpg";

const subjectImages: Record<string, string> = {
  "bg-subject-math": subjectMath,
  "bg-subject-english": subjectEnglish,
  "bg-subject-science": subjectScience,
  "bg-subject-filipino": subjectFilipino,
  "bg-subject-ap": subjectAp,
  "bg-subject-mapeh": subjectMapeh,
  "bg-subject-tle": subjectTle,
};

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
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    supabase.from("subjects").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setSubjects((data as Subject[]) || []);
    });
  }, []);

  const handleClick = (subjectId: string) => {
    // Save current scroll so we can restore on back
    sessionStorage.setItem("home:scrollY", String(window.scrollY));
    navigate(`/subject/${subjectId}`);
  };

  if (subjects.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {subjects.map((subject) => {
          const Icon = iconMap[subject.icon_name || "BookOpen"] || BookOpen;
          const color = subject.color || "bg-subject-math";
          const img = subjectImages[color] || subjectMath;
          return (
            <button
              key={subject.id}
              onClick={() => handleClick(subject.id)}
              className="min-w-[140px] max-w-[140px] bg-card rounded-xl overflow-hidden transition-all duration-200 active:scale-95 hover:shadow-md border border-border/50 card-shadow flex-shrink-0"
            >
              <div className="relative h-[90px] overflow-hidden">
                <img src={img} alt={subject.name} className="w-full h-full object-cover" loading="lazy" width={140} height={90} />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <div className="h-7 w-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="text-[12px] font-bold text-foreground leading-tight line-clamp-1">{subject.name}</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{subject.teacher_name}</p>
                {(subject.progress || 0) > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${subject.progress}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-muted-foreground">{subject.progress}%</span>
                  </div>
                )}
              </div>
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
