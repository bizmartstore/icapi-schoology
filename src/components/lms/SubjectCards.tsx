import { useNavigate } from "react-router-dom";
import { Calculator, BookText, FlaskConical, Languages, Globe2, Music, Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const subjects = [
  { id: "math", name: "Mathematics", teacher: "Mrs. Santos", icon: Calculator, color: "bg-subject-math", progress: 72 },
  { id: "english", name: "English", teacher: "Mr. Reyes", icon: BookText, color: "bg-subject-english", progress: 85 },
  { id: "science", name: "Science", teacher: "Ms. Cruz", icon: FlaskConical, color: "bg-subject-science", progress: 60 },
  { id: "filipino", name: "Filipino", teacher: "Gng. Garcia", icon: Languages, color: "bg-subject-filipino", progress: 78 },
  { id: "ap", name: "Araling Panlipunan", teacher: "Mr. Bautista", icon: Globe2, color: "bg-subject-ap", progress: 65 },
  { id: "mapeh", name: "MAPEH", teacher: "Ms. Dela Cruz", icon: Music, color: "bg-subject-mapeh", progress: 90 },
  { id: "tle", name: "TLE", teacher: "Mr. Villanueva", icon: Wrench, color: "bg-subject-tle", progress: 55 },
];

const SubjectCards = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">My Subjects</h2>
        <button className="text-xs font-semibold text-primary" onClick={() => navigate("/subjects")}>See All</button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {subjects.map((subject, i) => (
          <button
            key={subject.id}
            onClick={() => navigate(`/subject/${subject.id}`)}
            className="min-w-[160px] bg-card rounded-2xl p-4 card-shadow hover:card-shadow-hover transition-all duration-200 hover:-translate-y-0.5 text-left animate-slide-in-right"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`h-10 w-10 rounded-xl ${subject.color} flex items-center justify-center mb-3`}>
              <subject.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground leading-tight mb-0.5">{subject.name}</h3>
            <p className="text-[11px] text-muted-foreground mb-3">{subject.teacher}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{subject.progress}%</span>
              </div>
              <Progress value={subject.progress} className="h-1.5" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SubjectCards;
export { subjects };
