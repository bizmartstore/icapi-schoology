import { useEffect, useState } from "react";
import { Play, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Lesson = {
  id: string;
  subject_name: string;
  lesson_title: string;
  chapter: string | null;
  time_left: string | null;
  progress: number | null;
  color: string | null;
};

const colorMap: Record<string, string> = {
  "bg-subject-math": "from-subject-math to-subject-math/70",
  "bg-subject-english": "from-subject-english to-subject-english/70",
  "bg-subject-science": "from-subject-science to-subject-science/70",
  "bg-subject-filipino": "from-subject-filipino to-subject-filipino/70",
  "bg-subject-ap": "from-subject-ap to-subject-ap/70",
  "bg-subject-mapeh": "from-subject-mapeh to-subject-mapeh/70",
  "bg-subject-tle": "from-subject-tle to-subject-tle/70",
};

const ContinueLearning = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    supabase.from("lessons").select("*").eq("is_active", true).order("created_at", { ascending: false }).then(({ data }) => {
      setLessons((data as Lesson[]) || []);
    });
  }, []);

  if (lessons.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {lessons.map((item) => {
          const gradient = colorMap[item.color || "bg-subject-math"] || "from-primary to-primary/70";
          return (
            <div
              key={item.id}
              className="min-w-[200px] max-w-[200px] bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200 active:scale-[0.97] cursor-pointer card-shadow hover:shadow-md flex-shrink-0"
            >
              <div className={`bg-gradient-to-br ${gradient} p-3 flex items-center gap-3 relative`}>
                <div className="h-11 w-11 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-primary-foreground/80 font-bold uppercase tracking-wider">{item.subject_name}</p>
                  <h4 className="text-[11px] font-bold text-primary-foreground leading-tight line-clamp-2">{item.lesson_title}</h4>
                </div>
                <div className="absolute top-1.5 right-1.5 bg-primary-foreground/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5 text-primary-foreground" />
                  <span className="text-[8px] font-bold text-primary-foreground">{item.time_left}</span>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-[9px] text-muted-foreground">{item.chapter}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className={`bg-gradient-to-r ${gradient} h-1.5 rounded-full`} style={{ width: `${item.progress || 0}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground">{item.progress || 0}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueLearning;
