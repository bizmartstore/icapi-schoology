import { TrendingUp, Trophy, Medal, Star } from "lucide-react";

const topSubjects = [
  { name: "MAPEH", grade: 95, trend: "+3", color: "bg-subject-mapeh", rank: 1 },
  { name: "English", grade: 92, trend: "+5", color: "bg-subject-english", rank: 2 },
  { name: "Mathematics", grade: 88, trend: "+2", color: "bg-subject-math", rank: 3 },
  { name: "Filipino", grade: 87, trend: "+1", color: "bg-subject-filipino", rank: 4 },
];

const rankIcons = [
  <Trophy className="h-4 w-4 text-accent" />,
  <Medal className="h-4 w-4 text-muted-foreground" />,
  <Medal className="h-4 w-4 text-subject-mapeh" />,
  <Star className="h-3.5 w-3.5 text-muted-foreground" />,
];

const TopPerforming = () => {
  return (
    <div className="px-4">
      <div className="bg-card rounded-2xl card-shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center">
            <Trophy className="h-3.5 w-3.5 text-accent" />
          </div>
          <h3 className="text-[13px] font-bold text-foreground">Top Performing Subjects</h3>
        </div>
        <div className="space-y-2.5">
          {topSubjects.map((subject, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-muted/50 ${
                i === 0 ? "bg-accent/5 ring-1 ring-accent/20" : ""
              }`}
            >
              <div className="flex-shrink-0 w-6 text-center">{rankIcons[i]}</div>
              <div className={`h-10 w-10 rounded-xl ${subject.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-xs font-extrabold text-primary-foreground">{subject.grade}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[12px] font-bold text-foreground">{subject.name}</h4>
                <p className="text-[9px] text-muted-foreground">#{subject.rank} in class</p>
              </div>
              <div className="flex items-center gap-0.5 bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                <TrendingUp className="h-3 w-3" />
                <span>{subject.trend}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopPerforming;
