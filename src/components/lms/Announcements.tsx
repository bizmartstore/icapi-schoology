import { useEffect, useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id: string;
  title: string;
  from_name: string | null;
  preview_text: string | null;
  full_content: string | null;
  is_new: boolean | null;
  created_at: string | null;
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState<Announcement | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("announcements").select("*").eq("is_active", true)
        .order("created_at", { ascending: false });
      setAnnouncements((data as Announcement[]) || []);
    };
    load();
    const ch = supabase
      .channel("announcements-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (announcements.length === 0) {
    return (
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">No announcements yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {announcements.map((item) => (
          <button
            key={item.id}
            onClick={() => setOpen(item)}
            className="min-w-[200px] max-w-[200px] bg-card rounded-xl overflow-hidden transition-all duration-200 active:scale-95 hover:shadow-md border border-border/50 card-shadow flex-shrink-0 text-left"
          >
            <div className={`relative h-[60px] flex items-center justify-center ${
              item.is_new ? "bg-gradient-to-br from-info to-info/70" : "bg-gradient-to-br from-muted to-muted/60"
            }`}>
              {item.is_new
                ? <Sparkles className="h-6 w-6 text-primary-foreground drop-shadow" />
                : <Megaphone className="h-6 w-6 text-info" />
              }
              {item.is_new && (
                <Badge className="absolute top-1.5 right-1.5 text-[7px] font-bold px-1.5 py-0 rounded-full bg-destructive text-destructive-foreground border-0 animate-pulse">
                  NEW
                </Badge>
              )}
            </div>
            <div className="p-2.5">
              <h3 className="text-[12px] font-bold text-foreground leading-tight line-clamp-2 min-h-[28px]">{item.title}</h3>
              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-1">{item.from_name}</p>
              <p className="text-[8px] text-muted-foreground/70 mt-0.5">{timeAgo(item.created_at)}</p>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-2 text-base text-left">
                  <Megaphone className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                  <span>{open.title}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-left">
                  {open.from_name} • {timeAgo(open.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {open.full_content || open.preview_text || "No additional details."}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
