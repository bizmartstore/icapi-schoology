import { Search, Bell, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const LMSHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-primary px-4 py-3 card-shadow">
      <div className="container flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-sm font-bold text-accent-foreground">E</span>
          </div>
          <span className="text-lg font-bold text-primary-foreground hidden sm:block">EduLearn</span>
        </div>

        <div className="flex-1 mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search subjects, lessons, tasks..."
              className="w-full rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 px-4 pl-10 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-accent border-2 border-primary" />
          </button>
          <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
            <Bell className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -top-0.5 -right-0.5">
              <Badge className="h-4 min-w-4 px-1 text-[10px] bg-accent border-0 text-accent-foreground">3</Badge>
            </span>
          </button>
          <Avatar className="h-8 w-8 border-2 border-primary-foreground/30">
            <AvatarImage src="" />
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default LMSHeader;
