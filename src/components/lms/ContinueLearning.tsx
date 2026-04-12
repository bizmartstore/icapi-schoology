import { useEffect, useState } from "react";
import { Play, Clock, BookOpen } from "lucide-react";
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
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[13px] font-bold text-foreground">Continue Learning</h3>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {lessons.map((item, i) => {
          const color = item.color || "bg-subject-math";
          return (
            <div
              key={item.id}
              className="min-w-[240px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in group cursor-pointer"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`${color} px-3.5 py-3 flex items-center justify-between relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-primary-foreground/10" />
                <div className="relative">
                  <p className="text-[9px] text-primary-foreground/80 font-semibold uppercase tracking-wider">{item.subject_name}</p>
                  <h4 className="text-[13px] font-bold text-primary-foreground mt-0.5 leading-tight">{item.lesson_title}</h4>
                </div>
                <button className="relative h-9 w-9 rounded-full bg-primary-foreground/25 backdrop-blur-sm flex items-center justify-center hover:bg-primary-foreground/40 transition-all group-hover:scale-110 duration-300 flex-shrink-0">
                  <Play className="h-3.5 w-3.5 text-primary-foreground ml-0.5" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span className="font-medium">{item.chapter}</span>
                  <span className="flex items-center gap-1 font-semibold"><Clock className="h-2.5 w-2.5" />{item.time_left}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${item.progress || 0}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1 text-right font-semibold">{item.progress || 0}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueLearning;
