import { Search, Bell, MessageSquare, LogIn, GraduationCap } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary via-primary to-primary/90 px-4 py-3 shadow-lg">
      <div className="container flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shadow-md">
            <GraduationCap className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-extrabold text-primary-foreground tracking-tight">EduLearn</span>
            <p className="text-[9px] text-primary-foreground/50 font-medium -mt-0.5">Learning Management</p>
          </div>
        </div>

        <div className="flex-1 mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/40" />
            <input
              placeholder="Search subjects, lessons..."
              className="w-full rounded-xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/15 px-4 pl-10 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-primary-foreground/15 transition-all"
            />
          </div>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-1.5">
            <button className="relative p-2 rounded-xl hover:bg-primary-foreground/10 transition-colors" onClick={() => navigate("/messages")}>
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <button className="relative p-2 rounded-xl hover:bg-primary-foreground/10 transition-colors" onClick={() => navigate("/notifications")}>
              <Bell className="h-5 w-5 text-primary-foreground" />
              <span className="absolute top-0.5 right-0.5">
                <Badge className="h-4 min-w-4 px-1 text-[9px] bg-accent border-0 text-accent-foreground font-bold">3</Badge>
              </span>
            </button>
            <Avatar className="h-8 w-8 border-2 border-accent/50 ring-2 ring-primary-foreground/10 cursor-pointer">
              <AvatarImage src="" />
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button size="sm" className="rounded-xl text-xs bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-md" onClick={() => navigate("/login")}>
            <LogIn className="h-4 w-4 mr-1" /> Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default LMSHeader;
