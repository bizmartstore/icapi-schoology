import { useEffect, useState } from "react";
import { Megaphone, ChevronRight, Sparkles } from "lucide-react";
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
    <div className="px-4 pb-3">
      <div className="space-y-2.5">
        {announcements.map((item, idx) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all text-left active:scale-[0.98] card-shadow"
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              item.is_new ? "bg-gradient-to-br from-info to-info/70" : "bg-info/10"
            }`}>
              {item.is_new
                ? <Sparkles className="h-5 w-5 text-primary-foreground" />
                : <Megaphone className="h-5 w-5 text-info" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[12px] font-bold text-foreground truncate">{item.title}</h4>
                {item.is_new && (
                  <Badge className="text-[7px] font-bold px-1.5 py-0 rounded-full bg-destructive text-destructive-foreground border-0 shrink-0 animate-pulse">
                    NEW
                  </Badge>
                )}
              </div>
              {item.preview_text && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.preview_text}</p>
              )}
              <p className="text-[9px] text-muted-foreground/70 mt-0.5">{item.from_name} • {timeAgo(item.created_at)}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
