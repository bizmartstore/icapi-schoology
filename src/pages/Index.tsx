import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import SubjectCards from "@/components/lms/SubjectCards";
import ContinueLearning from "@/components/lms/ContinueLearning";
import UpcomingTasks from "@/components/lms/UpcomingTasks";
import Announcements from "@/components/lms/Announcements";
import TopPerforming from "@/components/lms/TopPerforming";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto space-y-5 pt-2">
        <QuickAccessMenu />
        
        {/* Welcome banner */}
        <div className="px-4">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 card-shadow">
            <p className="text-primary-foreground/70 text-xs font-medium">Good morning,</p>
            <h1 className="text-xl font-bold text-primary-foreground mb-1">Juan Dela Cruz 👋</h1>
            <p className="text-primary-foreground/70 text-sm">You have 4 pending tasks and 2 quizzes this week.</p>
          </div>
        </div>

        <SubjectCards />
        <ContinueLearning />
        <UpcomingTasks />
        <TopPerforming />
        <Announcements />
      </div>
    </div>
  );
};

export default Index;
