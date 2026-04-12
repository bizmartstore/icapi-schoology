import { useEffect, useState } from "react";
import { Megaphone, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id: string;
  title: string;
  from_name: string | null;
  preview_text: string | null;
  is_new: boolean | null;
  created_at: string | null;
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).then(({ data }) => {
      setAnnouncements((data as Announcement[]) || []);
    });
  }, []);

  if (announcements.length === 0) return null;

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="px-4">
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-info/10 flex items-center justify-center">
              <Megaphone className="h-3.5 w-3.5 text-info" />
            </div>
            <h3 className="text-[13px] font-bold text-foreground">Announcements</h3>
          </div>
          <button className="text-[11px] font-semibold text-primary">View All</button>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {announcements.map((item, i) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 text-left animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
                <Megaphone className="h-4 w-4 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-[12px] font-bold text-foreground truncate">{item.title}</h4>
                  {item.is_new && <Badge className="text-[7px] font-bold px-1 py-0 rounded-full bg-destructive text-destructive-foreground border-0 shrink-0">NEW</Badge>}
                </div>
                <p className="text-[9px] text-muted-foreground font-medium">{item.from_name} • {timeAgo(item.created_at)}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
