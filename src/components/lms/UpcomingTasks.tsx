import { useEffect, useState } from "react";
import { FileText, Clock, AlertTriangle } from "lucide-react";
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
    <div className="px-4 pb-3">
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer active:scale-[0.99] ${
              task.is_urgent ? "bg-destructive/5 border-destructive/20" : "bg-background border-border/50"
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              task.is_urgent ? "bg-destructive/10" : "bg-muted"
            }`}>
              <FileText className={`h-4 w-4 ${task.is_urgent ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[12px] font-bold text-foreground truncate">{task.title}</h4>
                {task.is_urgent && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                <span>{task.subject_name}</span>
                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{task.due_date}</span>
              </div>
            </div>
            <Badge variant={task.task_type === "Quiz" ? "default" : "secondary"} className="text-[8px] font-bold px-1.5 rounded-sm flex-shrink-0">
              {task.task_type}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingTasks;
