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
import { LogOut, LogIn, Sparkles, BookOpen, Target, Users, GraduationCap, Zap, CheckCircle2, Flame, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { profile, roles, signOut, user } = useAuth();
  const navigate = useNavigate();
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

      <div className="max-w-3xl mx-auto">
        {/* Banner */}
        <BannerCarousel />

        {/* Welcome strip */}
        <div className="bg-card border-b border-border px-4 py-3">
          {isLoggedIn ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full shopee-gradient flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-primary-foreground">
                    {profile ? profile.first_name.charAt(0) : "?"}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{greeting()}</p>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {profile ? `${profile.first_name} ${profile.last_name}` : "User"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { icon: BookOpen, value: "7", label: "Subjects" },
                  { icon: Target, value: "4", label: "Tasks" },
                  { icon: Star, value: "#3", label: "Rank" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-sm font-extrabold text-primary">{s.value}</p>
                    <p className="text-[8px] text-muted-foreground font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Welcome to EduLearn 🎓</p>
                <p className="text-[11px] text-muted-foreground">Sign in to start learning</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="rounded-md text-[11px] h-8 font-bold shadow-none" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button size="sm" variant="outline" className="rounded-md text-[11px] h-8 font-bold shadow-none border-primary text-primary hover:bg-primary/5" onClick={() => navigate("/signup/student")}>
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Access Icons - Shopee category style */}
        <QuickAccessMenu />

        {/* How It Works - for guests */}
        {!isLoggedIn && (
          <div className="bg-card mt-2 border-y border-border">
            <div className="px-4 pt-3 pb-1">
              <SectionHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="How It Works" />
            </div>
            <div className="flex px-4 pb-3 gap-2">
              {[
                { step: "1", title: "Sign Up", desc: "Create account", emoji: "📝" },
                { step: "2", title: "Get Approved", desc: "Wait for teacher", emoji: "✅" },
                { step: "3", title: "Start Learning", desc: "Access subjects", emoji: "🚀" },
              ].map((item, i) => (
                <div key={item.step} className="flex-1 bg-background rounded-lg p-2.5 text-center">
                  <span className="text-xl">{item.emoji}</span>
                  <h3 className="text-[11px] font-bold text-foreground mt-1">{item.title}</h3>
                  <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flash Deal style: Subjects */}
        <div className="bg-card mt-2 border-y border-border">
          <div className="px-4 pt-3">
            <SectionHeader icon={<Flame className="h-3.5 w-3.5 text-primary" />} title="My Subjects" actionLabel="See All" onAction={() => navigate("/subjects")} />
          </div>
          <SubjectCards />
        </div>

        {/* Continue Learning */}
        <div className="bg-card mt-2 border-y border-border">
          <div className="px-4 pt-3">
            <SectionHeader icon={<Zap className="h-3.5 w-3.5 text-primary" />} title="Continue Learning" />
          </div>
          <ContinueLearning />
        </div>

        {/* Tasks */}
        <div className="bg-card mt-2 border-y border-border">
          <div className="px-4 pt-3">
            <SectionHeader icon={<Target className="h-3.5 w-3.5 text-destructive" />} title="Upcoming Tasks" />
          </div>
          <UpcomingTasks />
        </div>

        {/* Top Performing */}
        <div className="bg-card mt-2 border-y border-border">
          <div className="px-4 pt-3">
            <SectionHeader icon={<Star className="h-3.5 w-3.5 text-accent" />} title="Top Performing" />
          </div>
          <TopPerforming />
        </div>

        {/* Announcements */}
        <div className="bg-card mt-2 border-y border-border">
          <div className="px-4 pt-3">
            <SectionHeader icon={<Sparkles className="h-3.5 w-3.5 text-info" />} title="Announcements" actionLabel="View All" />
          </div>
          <Announcements />
        </div>

        {isLoggedIn && (
          <div className="px-4 py-3 bg-card mt-2 border-t border-border">
            <Button variant="outline" size="sm" className="w-full rounded-md text-xs font-bold border-primary text-primary hover:bg-primary/5" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        )}

        <LMSFooter />
      </div>
    </div>
  );
};

/* Shopee-style section header */
const SectionHeader = ({ icon, title, actionLabel, onAction }: { icon: React.ReactNode; title: string; actionLabel?: string; onAction?: () => void }) => (
  <div className="flex items-center justify-between mb-2.5">
    <div className="flex items-center gap-1.5">
      {icon}
      <h2 className="text-[13px] font-bold text-foreground">{title}</h2>
    </div>
    {actionLabel && (
      <button onClick={onAction} className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
        {actionLabel} &gt;
      </button>
    )}
  </div>
);

export default Index;
