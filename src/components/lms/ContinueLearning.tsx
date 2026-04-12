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
      <div className="space-y-2">
        {lessons.map((item, i) => {
          const color = item.color || "bg-subject-math";
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 bg-background rounded-lg border border-border/50 transition-all duration-150 active:scale-[0.99] cursor-pointer"
            >
              <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center flex-shrink-0 relative`}>
                <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wide">{item.subject_name}</p>
                <h4 className="text-[12px] font-bold text-foreground leading-tight truncate">{item.lesson_title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-muted-foreground">{item.chapter}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{item.time_left}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                    <div className={`${color} h-1 rounded-full`} style={{ width: `${item.progress || 0}%` }} />
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
