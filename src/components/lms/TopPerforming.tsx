import { TrendingUp, Trophy, Medal, Star } from "lucide-react";

const topSubjects = [
  { name: "MAPEH", grade: 95, trend: "+3", color: "bg-subject-mapeh", rank: 1 },
  { name: "English", grade: 92, trend: "+5", color: "bg-subject-english", rank: 2 },
  { name: "Mathematics", grade: 88, trend: "+2", color: "bg-subject-math", rank: 3 },
  { name: "Filipino", grade: 87, trend: "+1", color: "bg-subject-filipino", rank: 4 },
];

const rankIcons: Record<number, React.ReactNode> = {
  1: <Trophy className="h-4 w-4 text-accent" />,
  2: <Medal className="h-4 w-4 text-muted-foreground" />,
  3: <Medal className="h-4 w-4 text-subject-mapeh" />,
  4: <Star className="h-3.5 w-3.5 text-muted-foreground" />,
};

const TopPerforming = () => (
  <div className="px-4 pb-3">
    <div className="space-y-2">
      {topSubjects.map((subject) => (
        <div
          key={subject.rank}
          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
            subject.rank === 1 ? "bg-accent/5 border-accent/20" : "bg-background border-border/50"
          }`}
        >
          <div className="w-5 flex justify-center flex-shrink-0">{rankIcons[subject.rank]}</div>
          <div className={`h-9 w-9 rounded-lg ${subject.color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-[11px] font-extrabold text-primary-foreground">{subject.grade}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[12px] font-bold text-foreground">{subject.name}</h4>
            <p className="text-[9px] text-muted-foreground">#{subject.rank} in class</p>
          </div>
          <div className="flex items-center gap-0.5 bg-success/10 text-success text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0">
            <TrendingUp className="h-2.5 w-2.5" />
            <span>{subject.trend}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TopPerforming;
