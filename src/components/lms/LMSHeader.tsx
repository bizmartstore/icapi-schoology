import { Search, Bell, MessageSquare, LogIn, BookMarked } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LMSHeader = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user && profile?.approval_status === "approved";

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
    : "?";

  return (
    <header className="sticky top-0 z-50 sacred-gradient px-4 pt-3 pb-2.5 shadow-md border-b border-accent/30">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
            <BookMarked className="h-4 w-4 text-accent" />
          </div>
          <div className="leading-none">
            <span className="block font-serif-display text-[17px] font-bold text-primary-foreground tracking-tight">EduLumen</span>
            <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-accent">Catholic LMS</span>
          </div>
        </div>
        <div className="flex-1" />
        {isLoggedIn ? (
          <div className="flex items-center gap-0.5">
            <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors" onClick={() => navigate("/messages")}>
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-foreground border border-primary" />
            </button>
            <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors" onClick={() => navigate("/notifications")}>
              <Bell className="h-5 w-5 text-primary-foreground" />
              <span className="absolute top-0.5 right-0.5">
                <Badge className="h-4 min-w-4 px-1 text-[8px] bg-primary-foreground text-primary border-0 font-extrabold">3</Badge>
              </span>
            </button>
            <Avatar className="h-7 w-7 border-2 border-primary-foreground/30 ml-1 cursor-pointer">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary-foreground text-primary text-[10px] font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button size="sm" className="rounded-full text-[11px] h-7 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-3 shadow-none" onClick={() => navigate("/login")}>
            <LogIn className="h-3.5 w-3.5 mr-1" /> Login
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search subjects, lessons..."
          className="w-full rounded-md bg-primary-foreground border-0 px-4 pl-9 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>
    </header>
  );
};

export default LMSHeader;
