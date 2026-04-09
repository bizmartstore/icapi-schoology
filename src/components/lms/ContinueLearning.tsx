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
    <section className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">Continue Learning</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {lessons.map((item, i) => {
          const color = item.color || "bg-subject-math";
          return (
            <div
              key={item.id}
              className="min-w-[260px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in group cursor-pointer"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`${color} px-4 py-3.5 flex items-center justify-between relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary-foreground/10" />
                <div className="absolute -right-2 -bottom-6 h-12 w-12 rounded-full bg-primary-foreground/5" />
                <div className="relative">
                  <p className="text-[10px] text-primary-foreground/80 font-semibold uppercase tracking-wider">{item.subject_name}</p>
                  <h3 className="text-sm font-bold text-primary-foreground mt-0.5">{item.lesson_title}</h3>
                </div>
                <button className="relative h-10 w-10 rounded-full bg-primary-foreground/25 backdrop-blur-sm flex items-center justify-center hover:bg-primary-foreground/40 transition-all group-hover:scale-110 duration-300">
                  <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                </button>
              </div>
              <div className="p-3.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2.5">
                  <span className="font-medium">{item.chapter}</span>
                  <span className="flex items-center gap-1 font-semibold"><Clock className="h-3 w-3" />{item.time_left} left</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${item.progress || 0}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-right font-semibold">{item.progress || 0}% complete</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueLearning;
