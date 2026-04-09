import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import SubjectCards from "@/components/lms/SubjectCards";
import ContinueLearning from "@/components/lms/ContinueLearning";
import UpcomingTasks from "@/components/lms/UpcomingTasks";
import Announcements from "@/components/lms/Announcements";
import TopPerforming from "@/components/lms/TopPerforming";
import LMSFooter from "@/components/lms/LMSFooter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const isTeacher = roles.includes("teacher");

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto space-y-5 pt-2">
        <QuickAccessMenu />
        
        {/* Welcome banner */}
        <div className="px-4">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 card-shadow">
            <p className="text-primary-foreground/70 text-xs font-medium">{greeting()},</p>
            <h1 className="text-xl font-bold text-primary-foreground mb-1">
              {profile ? `${profile.first_name} ${profile.last_name}` : "User"} 👋
            </h1>
            <p className="text-primary-foreground/70 text-sm capitalize">
              {profile?.user_type === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
            </p>
            <div className="flex gap-2 mt-3">
              {isTeacher && (
                <Button size="sm" variant="secondary" className="rounded-xl text-xs" onClick={() => navigate("/approvals")}>
                  <UserCheck className="h-3 w-3 mr-1" /> Student Approvals
                </Button>
              )}
              <Button size="sm" variant="secondary" className="rounded-xl text-xs" onClick={signOut}>
                <LogOut className="h-3 w-3 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        <SubjectCards />
        <ContinueLearning />
        <UpcomingTasks />
        <TopPerforming />
        <Announcements />

        <LMSFooter />
      </div>
    </div>
  );
};

export default Index;
