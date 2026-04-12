import LMSHeader from "@/components/lms/LMSHeader";
import BannerCarousel from "@/components/lms/BannerCarousel";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import SubjectCards from "@/components/lms/SubjectCards";
import ContinueLearning from "@/components/lms/ContinueLearning";
import UpcomingTasks from "@/components/lms/UpcomingTasks";
import Announcements from "@/components/lms/Announcements";
import TopPerforming from "@/components/lms/TopPerforming";
import LMSFooter from "@/components/lms/LMSFooter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, Sparkles, BookOpen, Target, Users, ArrowRight, GraduationCap, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { profile, roles, signOut, user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = roles.includes("teacher");
  const isLoggedIn = !!user && profile?.approval_status === "approved";

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      <LMSHeader />

      <div className="max-w-3xl mx-auto pb-8">
        {/* Hero Section: Banner + Welcome */}
        <section className="pt-3 space-y-4">
          <BannerCarousel />

          {/* Welcome Card */}
          <div className="px-4">
            {isLoggedIn ? (
              <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-5 overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary-foreground/5 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-accent/20 translate-y-6 -translate-x-6" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <p className="text-primary-foreground/70 text-xs font-semibold">{greeting()},</p>
                  </div>
                  <h1 className="text-xl font-extrabold text-primary-foreground mb-0.5">
                    {profile ? `${profile.first_name} ${profile.last_name}` : "User"} 👋
                  </h1>
                  <p className="text-primary-foreground/60 text-sm font-medium capitalize mb-4">
                    {profile?.user_type === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
                  </p>
                  <div className="flex gap-3 mb-4">
                    {[
                      { icon: BookOpen, label: "Subjects", value: "7" },
                      { icon: Target, label: "Tasks", value: "4" },
                      { icon: Users, label: "Rank", value: "#3" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-3 py-2 flex-1 text-center">
                        <stat.icon className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                        <p className="text-base font-extrabold text-primary-foreground">{stat.value}</p>
                        <p className="text-[9px] text-primary-foreground/60 font-semibold">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-xl text-xs font-bold shadow-md" onClick={signOut}>
                    <LogOut className="h-3 w-3 mr-1" /> Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-primary via-primary to-info/60 rounded-2xl p-5 overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-accent/20 -translate-y-6 translate-x-6" />
                <div className="absolute bottom-0 left-8 h-16 w-16 rounded-full bg-primary-foreground/5 translate-y-4" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Start your journey</span>
                  </div>
                  <h1 className="text-xl font-extrabold text-primary-foreground mb-1">Welcome to EduLearn 🎓</h1>
                  <p className="text-primary-foreground/70 text-sm mb-4">
                    Your complete learning platform. Access subjects, quizzes, and track your progress.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl text-xs font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md" onClick={() => navigate("/login")}>
                      <LogIn className="h-3 w-3 mr-1" /> Login
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-xl text-xs font-bold shadow-md" onClick={() => navigate("/signup/student")}>
                      Create Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="mt-5">
          <div className="px-4 mb-2">
            <SectionLabel icon={<Zap className="h-3.5 w-3.5" />} title="Quick Access" subtitle="Navigate to any section" />
          </div>
          <QuickAccessMenu />
        </section>

        {/* How It Works - for guests */}
        {!isLoggedIn && (
          <section className="mt-6 px-4">
            <SectionLabel icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="How It Works" subtitle="Get started in 3 easy steps" />
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {[
                { step: "1", title: "Sign Up", desc: "Create your account", color: "from-primary to-primary/70" },
                { step: "2", title: "Get Approved", desc: "Wait for approval", color: "from-success to-success/70" },
                { step: "3", title: "Start Learning", desc: "Access all subjects", color: "from-accent to-accent/70" },
              ].map((item) => (
                <div key={item.step} className="bg-card rounded-2xl p-3 card-shadow text-center animate-fade-in">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                    <span className="text-sm font-extrabold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Academic Content */}
        <section className="mt-6 space-y-5">
          <div className="px-4">
            <SectionLabel icon={<GraduationCap className="h-3.5 w-3.5" />} title="Academics" subtitle="Your subjects and lessons" />
          </div>
          <SubjectCards />
          <ContinueLearning />
        </section>

        {/* Activity & Progress */}
        <section className="mt-6 space-y-5">
          <div className="px-4">
            <SectionLabel icon={<Target className="h-3.5 w-3.5" />} title="Activity & Progress" subtitle="Stay on track with your tasks" />
          </div>
          <UpcomingTasks />
          <TopPerforming />
        </section>

        {/* Updates */}
        <section className="mt-6 space-y-5">
          <div className="px-4">
            <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />} title="Updates" subtitle="Latest announcements and news" />
          </div>
          <Announcements />
        </section>

        <LMSFooter />
      </div>
    </div>
  );
};

/* Reusable section label */
const SectionLabel = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
  <div className="flex items-center gap-2.5">
    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <h2 className="text-sm font-bold text-foreground leading-tight">{title}</h2>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

export default Index;
