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
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-info/10 flex items-center justify-center">
            <Megaphone className="h-3.5 w-3.5 text-info" />
          </div>
          <h2 className="text-base font-bold text-foreground">Announcements</h2>
        </div>
        <button className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">View All</button>
      </div>
      <div className="space-y-2.5">
        {announcements.map((item, i) => (
          <button
            key={item.id}
            className="w-full bg-card rounded-2xl p-4 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-0.5 text-left flex gap-3 items-start animate-fade-in group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-info/20 to-info/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Megaphone className="h-5 w-5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-[13px] font-bold text-foreground truncate">{item.title}</h3>
                {item.is_new && <Badge className="text-[8px] font-bold px-1.5 py-0 rounded-full bg-destructive text-destructive-foreground border-0 shrink-0">NEW</Badge>}
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold mb-1">{item.from_name} • {timeAgo(item.created_at)}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{item.preview_text}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default Announcements;
