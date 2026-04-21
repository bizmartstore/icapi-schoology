import { useState } from "react";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Target, Sparkles, ChevronDown, Rocket, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeTerm, setActiveTerm] = useState<"all" | "t1" | "t2" | "t3">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

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

  // Improvement Plan: realistic target = +5 capped at 95
  const target = Math.min(95, lowest.final + 5);
  const weeklyActions = [
    `Spend 30 mins/day reviewing ${lowest.subject} lessons (Mon–Fri)`,
    `Complete 1 practice quiz or activity in ${lowest.subject} every week`,
    `List 3 difficult topics and ask your teacher during consultation`,
    `Form a study buddy pair to discuss weekly lessons`,
  ];

  const terms = [
    { key: "all" as const, label: "All Terms" },
    { key: "t1" as const, label: "Term 1" },
    { key: "t2" as const, label: "Term 2" },
    { key: "t3" as const, label: "Term 3" },
  ];

  const getDisplayValue = (g: typeof enriched[number]) =>
    activeTerm === "all" ? g.final : g[activeTerm];

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4 space-y-4">
          {/* Term Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {terms.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTerm(t.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                  activeTerm === t.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* GWA Card */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 card-shadow text-center">
            <p className="text-primary-foreground/70 text-xs font-medium">
              {activeTerm === "all" ? "Final General Average" : `${terms.find((t) => t.key === activeTerm)?.label} Average`}
            </p>
            <p className="text-4xl font-extrabold text-primary-foreground my-1">
              {activeTerm === "all" ? gwa : termAverages[activeTerm]}
            </p>
            <p className="text-primary-foreground/70 text-sm">Strengthened Curriculum • 3 Terms • 2024–2025</p>
          </div>

          {/* Term Averages */}
          <h3 className="text-sm font-bold text-foreground">Term Averages</h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "t1", label: "Term 1", value: termAverages.t1 },
              { key: "t2", label: "Term 2", value: termAverages.t2 },
              { key: "t3", label: "Term 3", value: termAverages.t3 },
            ] as const).map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTerm(t.key)}
                className={cn(
                  "bg-card rounded-2xl p-4 card-shadow text-center animate-fade-in transition-all border",
                  activeTerm === t.key ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t.label}</p>
                <p className="text-2xl font-extrabold text-foreground my-1">{t.value}</p>
                <p className={`text-[10px] font-semibold ${remarkColor(t.value)}`}>{remark(t.value)}</p>
              </button>
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

          {/* Improvement Plan */}
          <div className="rounded-2xl p-4 card-shadow bg-gradient-to-br from-primary/10 via-card to-success/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Improvement Plan</p>
            </div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground truncate">{lowest.subject}</p>
                <p className="text-[11px] text-muted-foreground">Current {lowest.final} → Target {target}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted-foreground">Target</p>
                <p className="text-2xl font-extrabold text-primary leading-none">{target}</p>
              </div>
            </div>
            <Progress value={(lowest.final / target) * 100} className="h-1.5 mb-3" />
            <p className="text-[11px] font-bold text-foreground mb-2 flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-success" /> Weekly Study Actions
            </p>
            <ul className="space-y-1.5">
              {weeklyActions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
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
            {enriched.map((g, i) => {
              const display = getDisplayValue(g);
              const isOpen = expanded === g.subject;
              const termVals = [g.t1, g.t2, g.t3];
              const max = Math.max(...termVals);
              const min = Math.min(...termVals);
              return (
                <div key={i} className="bg-card rounded-2xl card-shadow animate-fade-in overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : g.subject)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-xl ${g.color} flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-bold text-primary-foreground">{display}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{g.subject}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className={cn(activeTerm === "t1" && "text-primary font-bold")}>T1: <span className="font-semibold text-foreground">{g.t1}</span></span>
                        <span className={cn(activeTerm === "t2" && "text-primary font-bold")}>T2: <span className="font-semibold text-foreground">{g.t2}</span></span>
                        <span className={cn(activeTerm === "t3" && "text-primary font-bold")}>T3: <span className="font-semibold text-foreground">{g.t3}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`text-xs font-bold ${remarkColor(display)} text-right`}>
                        {remark(display)}
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </button>
                  {g.subject === lowest.subject && !isOpen && (
                    <div className="mx-4 mb-3 -mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-destructive bg-destructive/5 rounded-lg px-2 py-1">
                      <TrendingDown className="h-3 w-3" /> Lowest grade — prioritize this subject
                    </div>
                  )}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/20 animate-fade-in">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3 mt-3">Term Trend</p>
                      {/* Mini chart */}
                      <div className="flex items-end justify-between gap-3 h-28 px-2">
                        {([
                          { label: "T1", value: g.t1 },
                          { label: "T2", value: g.t2 },
                          { label: "T3", value: g.t3 },
                        ]).map((t, idx) => {
                          const heightPct = ((t.value - 60) / 40) * 100; // scale 60-100 → 0-100%
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                              <span className={cn("text-[10px] font-bold", remarkColor(t.value))}>{t.value}</span>
                              <div className="w-full bg-muted rounded-t-lg relative" style={{ height: "80px" }}>
                                <div
                                  className={cn(
                                    "absolute bottom-0 left-0 right-0 rounded-t-lg transition-all",
                                    t.value === max ? "bg-success" : t.value === min ? "bg-destructive" : "bg-primary"
                                  )}
                                  style={{ height: `${Math.max(8, Math.min(100, heightPct))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-muted-foreground">{t.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="rounded-lg bg-card p-2">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Highest</p>
                          <p className="text-sm font-bold text-success">{max}</p>
                        </div>
                        <div className="rounded-lg bg-card p-2">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Final</p>
                          <p className="text-sm font-bold text-foreground">{g.final}</p>
                        </div>
                        <div className="rounded-lg bg-card p-2">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Lowest</p>
                          <p className="text-sm font-bold text-destructive">{min}</p>
                        </div>
                      </div>
                      {g.subject === lowest.subject && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-destructive bg-destructive/5 rounded-lg px-2 py-1.5">
                          <TrendingDown className="h-3 w-3" /> Lowest overall — see Improvement Plan above
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
