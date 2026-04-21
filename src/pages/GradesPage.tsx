import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Target, Sparkles } from "lucide-react";

// Strengthened DepEd Curriculum: 3 terms (semesters/quarters) only
const grades = [
  { subject: "Mathematics", t1: 87, t2: 89, t3: 88, color: "bg-subject-math" },
  { subject: "English", t1: 91, t2: 93, t3: 92, color: "bg-subject-english" },
  { subject: "Science", t1: 76, t2: 80, t3: 78, color: "bg-subject-science" },
  { subject: "Filipino", t1: 84, t2: 86, t3: 85, color: "bg-subject-filipino" },
  { subject: "Araling Panlipunan", t1: 79, t2: 82, t3: 81, color: "bg-subject-ap" },
  { subject: "MAPEH", t1: 94, t2: 95, t3: 96, color: "bg-subject-mapeh" },
  { subject: "TLE", t1: 74, t2: 77, t3: 76, color: "bg-subject-tle" },
];

const remark = (g: number) =>
  g >= 90 ? "Outstanding" : g >= 85 ? "Very Good" : g >= 80 ? "Good" : g >= 75 ? "Fair" : "Needs Improvement";

const remarkColor = (g: number) =>
  g >= 90 ? "text-success" : g >= 80 ? "text-primary" : g >= 75 ? "text-warning" : "text-destructive";

const GradesPage = () => {
  const enriched = grades.map((g) => ({
    ...g,
    final: Math.round((g.t1 + g.t2 + g.t3) / 3),
  }));

  const gwa = Math.round(enriched.reduce((s, g) => s + g.final, 0) / enriched.length);
  const termAverages = {
    t1: Math.round(enriched.reduce((s, g) => s + g.t1, 0) / enriched.length),
    t2: Math.round(enriched.reduce((s, g) => s + g.t2, 0) / enriched.length),
    t3: Math.round(enriched.reduce((s, g) => s + g.t3, 0) / enriched.length),
  };

  const sorted = [...enriched].sort((a, b) => a.final - b.final);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const focusList = sorted.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4 space-y-4">
          {/* GWA Card */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 card-shadow text-center">
            <p className="text-primary-foreground/70 text-xs font-medium">Final General Average</p>
            <p className="text-4xl font-extrabold text-primary-foreground my-1">{gwa}</p>
            <p className="text-primary-foreground/70 text-sm">Strengthened Curriculum • 3 Terms • 2024–2025</p>
          </div>

          {/* Term Averages */}
          <h3 className="text-sm font-bold text-foreground">Term Averages</h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: "Term 1", value: termAverages.t1 },
              { label: "Term 2", value: termAverages.t2 },
              { label: "Term 3", value: termAverages.t3 },
            ]).map((t, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 card-shadow text-center animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t.label}</p>
                <p className="text-2xl font-extrabold text-foreground my-1">{t.value}</p>
                <p className={`text-[10px] font-semibold ${remarkColor(t.value)}`}>{remark(t.value)}</p>
              </div>
            ))}
          </div>

          {/* Focus Insights */}
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Focus Insights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 card-shadow bg-gradient-to-br from-destructive/10 to-warning/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <p className="text-[11px] font-bold uppercase tracking-wide text-destructive">Needs Most Focus</p>
              </div>
              <p className="text-base font-bold text-foreground">{lowest.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Final average <span className="font-bold text-foreground">{lowest.final}</span> — {remark(lowest.final)}.
                Review weak terms and ask your teacher for support.
              </p>
            </div>
            <div className="rounded-2xl p-4 card-shadow bg-gradient-to-br from-success/10 to-primary/10 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-success" />
                <p className="text-[11px] font-bold uppercase tracking-wide text-success">Strongest Subject</p>
              </div>
              <p className="text-base font-bold text-foreground">{highest.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Final average <span className="font-bold text-foreground">{highest.final}</span> — {remark(highest.final)}. Keep it up!
              </p>
            </div>
          </div>

          {/* Top 3 to Focus On */}
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <p className="text-xs font-bold text-foreground mb-3">Subjects to Focus On</p>
            <div className="space-y-2">
              {focusList.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs font-semibold text-foreground flex-1 truncate">{g.subject}</span>
                  <Progress value={g.final} className="h-1.5 w-20" />
                  <span className={`text-xs font-bold w-8 text-right ${remarkColor(g.final)}`}>{g.final}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Grades — by term */}
          <h3 className="text-sm font-bold text-foreground">Subject Grades</h3>
          <div className="space-y-2">
            {enriched.map((g, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 card-shadow animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${g.color} flex items-center justify-center shrink-0`}>
                    <span className="text-sm font-bold text-primary-foreground">{g.final}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{g.subject}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>T1: <span className="font-semibold text-foreground">{g.t1}</span></span>
                      <span>T2: <span className="font-semibold text-foreground">{g.t2}</span></span>
                      <span>T3: <span className="font-semibold text-foreground">{g.t3}</span></span>
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${remarkColor(g.final)} text-right`}>
                    {remark(g.final)}
                  </div>
                </div>
                {g.subject === lowest.subject && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-destructive bg-destructive/5 rounded-lg px-2 py-1">
                    <TrendingDown className="h-3 w-3" /> Lowest grade — prioritize this subject
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
