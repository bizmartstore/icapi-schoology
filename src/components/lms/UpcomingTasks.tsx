import { useEffect, useState } from "react";
import { FileText, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Task = {
  id: string;
  title: string;
  subject_name: string | null;
  due_date: string | null;
  task_type: string | null;
  is_urgent: boolean | null;
};

const UpcomingTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    supabase.from("tasks").select("*").eq("is_active", true).order("created_at", { ascending: false }).then(({ data }) => {
      setTasks((data as Task[]) || []);
    });
  }, []);

  if (tasks.length === 0) return null;

  return (
    <div className="px-4">
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-destructive/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-destructive" />
            </div>
            <h3 className="text-[13px] font-bold text-foreground">Upcoming Tasks</h3>
          </div>
          <Badge variant="destructive" className="text-[9px] font-bold px-2 rounded-full">{tasks.length} pending</Badge>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-muted/50 cursor-pointer animate-fade-in ${
                task.is_urgent ? "bg-destructive/5 ring-1 ring-destructive/15" : "bg-muted/30"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                task.is_urgent ? "bg-destructive/15" : "bg-subject-ap/15"
              }`}>
                <FileText className={`h-4 w-4 ${task.is_urgent ? "text-destructive" : "text-subject-ap"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-[12px] font-bold text-foreground truncate">{task.title}</h4>
                  {task.is_urgent && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <span className="font-medium">{task.subject_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{task.due_date}</span>
                </div>
              </div>
              <Badge variant={task.task_type === "Quiz" ? "default" : "secondary"} className="text-[8px] font-bold px-1.5 rounded-full flex-shrink-0">
                {task.task_type}
              </Badge>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingTasks;
