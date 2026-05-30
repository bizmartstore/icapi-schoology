import { useEffect, useState } from "react";
import { Megaphone, Sparkles, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSectionMembership } from "@/hooks/useSectionMembership";

type Announcement = {
  id: string;
  title: string;
  from_name: string | null;
  preview_text: string | null;
  full_content: string | null;
  image_url?: string | null;
  is_new: boolean | null;
  created_at: string | null;
  scope?: string | null;
  section_id?: string | null;
};

const Announcements = () => {
  const { memberSectionIds } = useSectionMembership();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState<Announcement | null>(null);

  const load = async () => {
    // RLS handles visibility: general (everyone) + section (members + adviser)
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("announcements-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const row = payload.new as Announcement;
          if (!row.is_active) return;
          setAnnouncements((prev) => {
            if (prev.some((a) => a.id === row.id)) return prev;
            return [row, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "announcements" },
        (payload) => {
          const row = payload.new as Announcement;
          setAnnouncements((prev) => {
            if (!row.is_active) return prev.filter((a) => a.id !== row.id);
            const idx = prev.findIndex((a) => a.id === row.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = row;
              return next;
            }
            return [row, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "announcements" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSectionIds.join(",")]);

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
        {announcements.map((item) => {
          const isSection = item.scope === "section";
          return (
            <button
              key={item.id}
              onClick={() => setOpen(item)}
              className="min-w-[200px] max-w-[200px] bg-card rounded-xl overflow-hidden transition-all duration-200 active:scale-95 hover:shadow-md border border-border/50 card-shadow flex-shrink-0 text-left"
            >
              <div className={`relative h-[60px] flex items-center justify-center overflow-hidden ${
                item.image_url
                  ? ""
                  : isSection
                    ? "bg-gradient-to-br from-accent to-accent/70"
                    : item.is_new ? "bg-gradient-to-br from-info to-info/70" : "bg-gradient-to-br from-muted to-muted/60"
              }`}>
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : isSection ? (
                  <School className="h-6 w-6 text-primary-foreground drop-shadow relative z-10" />
                ) : item.is_new ? (
                  <Sparkles className="h-6 w-6 text-primary-foreground drop-shadow relative z-10" />
                ) : (
                  <Megaphone className="h-6 w-6 text-info relative z-10" />
                )}
                {isSection && (
                  <Badge className="absolute top-1.5 right-1.5 text-[7px] font-bold px-1.5 py-0 rounded-full bg-primary text-primary-foreground border-0">
                    SECTION
                  </Badge>
                )}
                {!isSection && item.is_new && (
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
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-[280px] sm:max-w-xs rounded-2xl max-h-[80vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-2 text-base text-left">
                  {open.scope === "section"
                    ? <School className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    : <Megaphone className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />}
                  <span>{open.title}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-left">
                  {open.from_name} • {timeAgo(open.created_at)}
                  {open.scope === "section" && <span className="ml-1 text-primary font-semibold">· Section</span>}
                </DialogDescription>
              </DialogHeader>
              {open.image_url && (
                <img src={open.image_url} alt="" className="w-full rounded-xl object-cover max-h-40 mb-3" loading="lazy" />
              )}
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
