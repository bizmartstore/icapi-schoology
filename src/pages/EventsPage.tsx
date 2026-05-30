import LMSHeader from "@/components/lms/LMSHeader";
import LMSFooter from "@/components/lms/LMSFooter";
import EventCarousel from "@/components/lms/EventCarousel";
import Announcements from "@/components/lms/Announcements";
import { Sparkles, PartyPopper } from "lucide-react";

const EventsPage = () => (
  <div className="min-h-screen bg-background">
    <LMSHeader />
    <div className="max-w-3xl mx-auto">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">School Events</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Photos and updates from your school</p>
      </div>

      <div className="px-4 py-3 bg-card border-b border-border">
        <EventCarousel variant="full" />
      </div>

      <div className="bg-card mt-2 border-y border-border">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-info" />
            <h2 className="text-[13px] font-bold text-foreground">Announcements</h2>
          </div>
        </div>
        <Announcements />
      </div>

      <LMSFooter />
    </div>
  </div>
);

export default EventsPage;
