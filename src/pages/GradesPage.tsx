import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { Progress } from "@/components/ui/progress";

const grades = [
  { subject: "Mathematics", ww: 88, pt: 85, qa: 90, final: 88, color: "bg-subject-math" },
  { subject: "English", ww: 92, pt: 90, qa: 95, final: 92, color: "bg-subject-english" },
  { subject: "Science", ww: 78, pt: 82, qa: 75, final: 79, color: "bg-subject-science" },
  { subject: "Filipino", ww: 85, pt: 88, qa: 82, final: 85, color: "bg-subject-filipino" },
  { subject: "Araling Panlipunan", ww: 80, pt: 78, qa: 85, final: 81, color: "bg-subject-ap" },
  { subject: "MAPEH", ww: 95, pt: 92, qa: 98, final: 95, color: "bg-subject-mapeh" },
  { subject: "TLE", ww: 75, pt: 80, qa: 70, final: 76, color: "bg-subject-tle" },
];

const GradesPage = () => {
  const gwa = Math.round(grades.reduce((s, g) => s + g.final, 0) / grades.length);

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4 space-y-4">
          {/* GWA Card */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 card-shadow text-center">
            <p className="text-primary-foreground/70 text-xs font-medium">General Weighted Average</p>
            <p className="text-4xl font-extrabold text-primary-foreground my-1">{gwa}</p>
            <p className="text-primary-foreground/70 text-sm">Quarter 2 • 2024-2025</p>
          </div>

          {/* Performance Summary - Horizontal */}
          <h3 className="text-sm font-bold text-foreground">Performance Summary</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[
              { label: "Written Works", key: "ww" as const },
              { label: "Performance Tasks", key: "pt" as const },
              { label: "Quarterly Assessment", key: "qa" as const },
            ].map((cat) => (
              <div key={cat.key} className="min-w-[200px] bg-card rounded-2xl p-4 card-shadow">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">{cat.label}</h4>
                <div className="space-y-2">
                  {grades.map((g, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 truncate">{g.subject.slice(0, 4)}</span>
                      <Progress value={g[cat.key]} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-semibold text-foreground w-6 text-right">{g[cat.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Subject Grades */}
          <h3 className="text-sm font-bold text-foreground">Subject Grades</h3>
          <div className="space-y-2">
            {grades.map((g, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 card-shadow flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`h-10 w-10 rounded-xl ${g.color} flex items-center justify-center`}>
                  <span className="text-sm font-bold text-primary-foreground">{g.final}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{g.subject}</p>
                  <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                    <span>WW: {g.ww}</span>
                    <span>PT: {g.pt}</span>
                    <span>QA: {g.qa}</span>
                  </div>
                </div>
                <div className={`text-xs font-bold ${g.final >= 90 ? "text-success" : g.final >= 80 ? "text-primary" : "text-warning"}`}>
                  {g.final >= 90 ? "Outstanding" : g.final >= 85 ? "Very Good" : g.final >= 80 ? "Good" : "Fair"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
