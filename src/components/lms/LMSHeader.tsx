import { MessageSquare, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationsPopover from "./NotificationsPopover";
import ProfilePopover from "./ProfilePopover";
import { useUnreadMessagesContext } from "@/contexts/UnreadMessagesContext";

const LMSHeader = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadMessagesContext();
  const isLoggedIn = !!user && profile?.approval_status === "approved";

  return (
    <header className="sticky top-0 z-50 sacred-gradient px-4 pt-3 pb-3 shadow-md border-b border-accent/30">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors -ml-1 px-1 py-0.5"
          aria-label="Go to dashboard"
        >
          <img
            src="/icapi-logo.png"
            alt=""
            className="h-8 w-8 object-contain shrink-0 pointer-events-none"
          />
          <div className="leading-none text-left">
            <span className="block font-serif-display text-[17px] font-bold text-primary-foreground tracking-tight">iCAPI</span>
            <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-accent">LMS</span>
          </div>
        </button>
        <div className="flex-1" />
        {isLoggedIn ? (
          <div className="flex items-center gap-0.5">
            <button
              className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors"
              onClick={() => navigate("/messages")}
              aria-label="Messages"
            >
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-extrabold flex items-center justify-center border-2 border-primary shadow-sm">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
            <NotificationsPopover />
            <ProfilePopover />
          </div>
        ) : (
          <Button size="sm" className="rounded-full text-[11px] h-7 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-3 shadow-none" onClick={() => navigate("/login")}>
            <LogIn className="h-3.5 w-3.5 mr-1" /> Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default LMSHeader;
