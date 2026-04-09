import { Play, Clock } from "lucide-react";

const lessons = [
  { subject: "Mathematics", lesson: "Linear Equations", chapter: "Q2 - Module 3", timeLeft: "15 min", progress: 65, color: "bg-subject-math" },
  { subject: "Science", lesson: "Cell Division", chapter: "Q2 - Module 1", timeLeft: "20 min", progress: 40, color: "bg-subject-science" },
  { subject: "English", lesson: "Essay Writing", chapter: "Q2 - Module 4", timeLeft: "10 min", progress: 80, color: "bg-subject-english" },
];

const ContinueLearning = () => {
  return (
    <section className="px-4">
      <h2 className="text-base font-bold text-foreground mb-3">Continue Learning</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {lessons.map((item, i) => (
          <div
            key={i}
            className="min-w-[260px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`${item.color} px-4 py-3 flex items-center justify-between`}>
              <div>
                <p className="text-[10px] text-primary-foreground/70 font-medium">{item.subject}</p>
                <h3 className="text-sm font-bold text-primary-foreground">{item.lesson}</h3>
              </div>
              <button className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors">
                <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
              </button>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                <span>{item.chapter}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.timeLeft}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContinueLearning;
