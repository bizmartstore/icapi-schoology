import { useEffect, useState } from "react";
import { FileText, Clock, AlertTriangle, ClipboardCheck, PenLine, Flame } from "lucide-react";
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
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-2xl overflow-hidden transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg ${
              task.is_urgent
                ? "bg-gradient-to-r from-destructive/10 via-card to-card border-l-4 border-destructive shadow-md shadow-destructive/10"
                : "bg-card border border-border/60 card-shadow"
            }`}
          >
            <div className="flex items-center gap-3 p-3.5">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                task.is_urgent
                  ? "bg-gradient-to-br from-destructive to-destructive/70 text-primary-foreground"
                  : "bg-gradient-to-br from-primary/15 to-primary/5 text-primary"
              }`}>
                {typeIcon[task.task_type || ""] || <FileText className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[13px] font-bold text-foreground truncate">{task.title}</h4>
                  {task.is_urgent && <Flame className="h-3.5 w-3.5 text-destructive flex-shrink-0 animate-pulse" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{task.subject_name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1 bg-muted/80 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />{task.due_date}
                  </span>
                  <Badge variant={task.task_type === "Quiz" ? "default" : "secondary"} className="text-[8px] font-bold px-2 py-0 rounded-full">
                    {task.task_type}
                  </Badge>
                  {task.is_urgent && (
                    <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">URGENT</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingTasks;
