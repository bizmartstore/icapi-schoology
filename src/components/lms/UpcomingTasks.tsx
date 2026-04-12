import { useEffect, useState } from "react";
import { FileText, Clock, AlertTriangle, ClipboardCheck, PenLine } from "lucide-react";
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

const typeIcon: Record<string, React.ReactNode> = {
  Quiz: <ClipboardCheck className="h-5 w-5" />,
  Assignment: <PenLine className="h-5 w-5" />,
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
      <div className="grid grid-cols-2 gap-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-xl border overflow-hidden transition-all cursor-pointer active:scale-[0.97] card-shadow hover:shadow-md ${
              task.is_urgent ? "bg-destructive/5 border-destructive/20" : "bg-card border-border/50"
            }`}
          >
            <div className={`p-3 flex items-center justify-between ${task.is_urgent ? "bg-destructive/10" : "bg-muted/50"}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${task.is_urgent ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"}`}>
                {typeIcon[task.task_type || ""] || <FileText className="h-5 w-5" />}
              </div>
              {task.is_urgent && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
            </div>
            <div className="p-2.5">
              <h4 className="text-[11px] font-bold text-foreground leading-tight line-clamp-2">{task.title}</h4>
              <p className="text-[9px] text-muted-foreground mt-1">{task.subject_name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />{task.due_date}
                </span>
                <Badge variant={task.task_type === "Quiz" ? "default" : "secondary"} className="text-[7px] font-bold px-1.5 py-0 rounded-sm">
                  {task.task_type}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingTasks;
