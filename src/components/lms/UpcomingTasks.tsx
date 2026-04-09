import { FileText, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tasks = [
  { title: "Essay on Philippine History", subject: "Araling Panlipunan", due: "Tomorrow, 11:59 PM", type: "Assignment", urgent: true, color: "bg-subject-ap" },
  { title: "Quadratic Equations Quiz", subject: "Mathematics", due: "Jan 15, 3:00 PM", type: "Quiz", urgent: false, color: "bg-subject-math" },
  { title: "Lab Report: Photosynthesis", subject: "Science", due: "Jan 16, 5:00 PM", type: "Assignment", urgent: false, color: "bg-subject-science" },
  { title: "Book Review: Noli Me Tangere", subject: "Filipino", due: "Jan 18, 11:59 PM", type: "Assignment", urgent: false, color: "bg-subject-filipino" },
];

const UpcomingTasks = () => {
  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-destructive/10 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-destructive" />
          </div>
          <h2 className="text-base font-bold text-foreground">Upcoming Tasks</h2>
        </div>
        <Badge variant="destructive" className="text-[10px] font-bold px-2.5 rounded-full">{tasks.length} pending</Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {tasks.map((task, i) => (
          <div
            key={i}
            className={`min-w-[210px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in cursor-pointer`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Color indicator */}
            <div className={`h-1.5 ${task.color} ${task.urgent ? "animate-pulse" : ""}`} />
            <div className="p-3.5">
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant={task.type === "Quiz" ? "default" : "secondary"}
                  className="text-[9px] font-bold px-2 rounded-full"
                >
                  {task.type}
                </Badge>
                {task.urgent && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-bold">URGENT</span>
                  </div>
                )}
              </div>
              <h3 className="text-[13px] font-bold text-foreground mb-1 leading-tight">{task.title}</h3>
              <p className="text-[10px] text-muted-foreground mb-3 font-medium">{task.subject}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
                <Clock className="h-3 w-3" />
                <span className="font-semibold">{task.due}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingTasks;
