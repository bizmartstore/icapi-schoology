import { TrendingUp, Trophy, Medal, Star } from "lucide-react";

const topSubjects = [
  { name: "MAPEH", grade: 95, trend: "+3", color: "bg-subject-mapeh", rank: 1 },
  { name: "English", grade: 92, trend: "+5", color: "bg-subject-english", rank: 2 },
  { name: "Mathematics", grade: 88, trend: "+2", color: "bg-subject-math", rank: 3 },
  { name: "Filipino", grade: 87, trend: "+1", color: "bg-subject-filipino", rank: 4 },
];

const rankIcons = [
  <Trophy className="h-5 w-5 text-accent" />,
  <Medal className="h-5 w-5 text-muted-foreground" />,
  <Medal className="h-5 w-5 text-subject-mapeh" />,
  <Star className="h-4 w-4 text-muted-foreground" />,
];

const TopPerforming = () => {
  return (
    <section className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center">
          <Trophy className="h-3.5 w-3.5 text-accent" />
        </div>
        <h2 className="text-base font-bold text-foreground">Top Performing</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {topSubjects.map((subject, i) => (
          <div
            key={i}
            className={`min-w-[130px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-scale-in ${
              i === 0 ? "ring-2 ring-accent/30" : ""
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {i === 0 && <div className="bg-gradient-to-r from-accent to-accent/70 h-1.5" />}
            <div className="p-3.5 text-center">
              <div className="mb-2">{rankIcons[i]}</div>
              <div className={`h-14 w-14 rounded-full ${subject.color} flex items-center justify-center mx-auto mb-2 ring-4 ring-background shadow-lg`}>
                <span className="text-base font-extrabold text-primary-foreground">{subject.grade}</span>
              </div>
              <h3 className="text-[13px] font-bold text-foreground mb-1">{subject.name}</h3>
              <div className="inline-flex items-center gap-0.5 bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>{subject.trend}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopPerforming;
