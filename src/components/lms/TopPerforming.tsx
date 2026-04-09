import { TrendingUp, Trophy } from "lucide-react";

const topSubjects = [
  { name: "MAPEH", grade: 95, trend: "+3", color: "bg-subject-mapeh" },
  { name: "English", grade: 92, trend: "+5", color: "bg-subject-english" },
  { name: "Mathematics", grade: 88, trend: "+2", color: "bg-subject-math" },
  { name: "Filipino", grade: 87, trend: "+1", color: "bg-subject-filipino" },
];

const TopPerforming = () => {
  return (
    <section className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-accent" />
        <h2 className="text-base font-bold text-foreground">Top Performing Subjects</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {topSubjects.map((subject, i) => (
          <div
            key={i}
            className="min-w-[140px] bg-card rounded-2xl p-4 card-shadow text-center animate-scale-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {i === 0 && <Trophy className="h-5 w-5 text-accent mx-auto mb-2" />}
            <div className={`h-12 w-12 rounded-full ${subject.color} flex items-center justify-center mx-auto mb-2`}>
              <span className="text-sm font-bold text-primary-foreground">{subject.grade}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{subject.name}</h3>
            <div className="flex items-center justify-center gap-0.5 text-success text-[11px] font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>{subject.trend}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopPerforming;
