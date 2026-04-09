import { FileText, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tasks = [
  { title: "Essay on Philippine History", subject: "Araling Panlipunan", due: "Tomorrow, 11:59 PM", type: "Assignment", urgent: true },
  { title: "Quadratic Equations Quiz", subject: "Mathematics", due: "Jan 15, 3:00 PM", type: "Quiz", urgent: false },
  { title: "Lab Report: Photosynthesis", subject: "Science", due: "Jan 16, 5:00 PM", type: "Assignment", urgent: false },
  { title: "Book Review: Noli Me Tangere", subject: "Filipino", due: "Jan 18, 11:59 PM", type: "Assignment", urgent: false },
];

const UpcomingTasks = () => {
  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">Upcoming Tasks</h2>
        <Badge variant="secondary" className="text-[10px] font-semibold">{tasks.length} pending</Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {tasks.map((task, i) => (
          <div
            key={i}
            className={`min-w-[220px] bg-card rounded-2xl p-4 card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in ${
              task.urgent ? "border-l-4 border-l-destructive" : ""
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <Badge variant={task.type === "Quiz" ? "default" : "secondary"} className="text-[10px]">
                {task.type}
              </Badge>
              {task.urgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1 leading-tight">{task.title}</h3>
            <p className="text-[11px] text-muted-foreground mb-3">{task.subject}</p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{task.due}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingTasks;
