import { TrendingUp, Trophy, Medal, Star, Crown } from "lucide-react";

const topSubjects = [
  { name: "MAPEH", grade: 95, trend: "+3", color: "from-subject-mapeh to-subject-mapeh/70", rank: 1 },
  { name: "English", grade: 92, trend: "+5", color: "from-subject-english to-subject-english/70", rank: 2 },
  { name: "Mathematics", grade: 88, trend: "+2", color: "from-subject-math to-subject-math/70", rank: 3 },
  { name: "Filipino", grade: 87, trend: "+1", color: "from-subject-filipino to-subject-filipino/70", rank: 4 },
];

const rankConfig: Record<number, { icon: React.ReactNode; badge: string }> = {
  1: { icon: <Crown className="h-5 w-5 text-warning" />, badge: "bg-warning/15 text-warning border-warning/30" },
  2: { icon: <Medal className="h-4.5 w-4.5 text-muted-foreground" />, badge: "bg-muted text-muted-foreground border-border" },
  3: { icon: <Medal className="h-4.5 w-4.5 text-subject-mapeh" />, badge: "bg-subject-mapeh/10 text-subject-mapeh border-subject-mapeh/20" },
  4: { icon: <Star className="h-4 w-4 text-muted-foreground" />, badge: "bg-muted text-muted-foreground border-border" },
};

const TopPerforming = () => (
  <div className="px-4 pb-3">
    <div className="grid grid-cols-2 gap-2.5">
      {topSubjects.map((subject) => {
        const config = rankConfig[subject.rank];
        return (
          <div
            key={subject.rank}
            className={`rounded-xl border overflow-hidden card-shadow transition-all hover:shadow-md ${
              subject.rank === 1 ? "bg-warning/5 border-warning/20" : "bg-card border-border/50"
            }`}
          >
            <div className={`bg-gradient-to-br ${subject.color} p-3 flex items-center justify-between`}>
              <span className="text-2xl font-black text-primary-foreground/90">{subject.grade}</span>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                {config.icon}
              </div>
            </div>
            <div className="p-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-bold text-foreground">{subject.name}</h4>
                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${config.badge}`}>
                  #{subject.rank}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1.5 bg-success/10 text-success text-[9px] font-bold px-2 py-1 rounded-md w-fit">
                <TrendingUp className="h-3 w-3" />
                <span>{subject.trend}% this week</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default TopPerforming;
