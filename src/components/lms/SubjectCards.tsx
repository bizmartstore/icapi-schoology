import { useNavigate } from "react-router-dom";
import { Calculator, BookText, FlaskConical, Languages, Globe2, Music, Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const subjects = [
  { id: "math", name: "Mathematics", teacher: "Mrs. Santos", icon: Calculator, color: "bg-subject-math", textColor: "text-subject-math", progress: 72 },
  { id: "english", name: "English", teacher: "Mr. Reyes", icon: BookText, color: "bg-subject-english", textColor: "text-subject-english", progress: 85 },
  { id: "science", name: "Science", teacher: "Ms. Cruz", icon: FlaskConical, color: "bg-subject-science", textColor: "text-subject-science", progress: 60 },
  { id: "filipino", name: "Filipino", teacher: "Gng. Garcia", icon: Languages, color: "bg-subject-filipino", textColor: "text-subject-filipino", progress: 78 },
  { id: "ap", name: "Araling Panlipunan", teacher: "Mr. Bautista", icon: Globe2, color: "bg-subject-ap", textColor: "text-subject-ap", progress: 65 },
  { id: "mapeh", name: "MAPEH", teacher: "Ms. Dela Cruz", icon: Music, color: "bg-subject-mapeh", textColor: "text-subject-mapeh", progress: 90 },
  { id: "tle", name: "TLE", teacher: "Mr. Villanueva", icon: Wrench, color: "bg-subject-tle", textColor: "text-subject-tle", progress: 55 },
];

const SubjectCards = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isLoggedIn = !!user && profile?.approval_status === "approved";

  const handleClick = (subjectId: string) => {
    if (!isLoggedIn) {
      toast.info("Please login to view subject details");
      navigate("/login");
      return;
    }
    navigate(`/subject/${subjectId}`);
  };

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">My Subjects</h2>
          <p className="text-[11px] text-muted-foreground">Tap a subject to view lessons</p>
        </div>
        <button className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" onClick={() => navigate("/subjects")}>
          See All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {subjects.map((subject, i) => (
          <button
            key={subject.id}
            onClick={() => handleClick(subject.id)}
            className="min-w-[150px] bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 text-left animate-slide-in-right group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Color strip top */}
            <div className={`${subject.color} h-1.5 w-full`} />
            <div className="p-3.5 pt-3">
              <div className={`h-10 w-10 rounded-xl ${subject.color}/15 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300`}>
                <subject.icon className={`h-5 w-5 ${subject.textColor}`} />
              </div>
              <h3 className="text-[13px] font-bold text-foreground leading-tight mb-0.5">{subject.name}</h3>
              <p className="text-[10px] text-muted-foreground mb-3">{subject.teacher}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-bold text-foreground">{subject.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`${subject.color} h-2 rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SubjectCards;
export { subjects };
