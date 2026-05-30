import { useEffect, useState } from "react";
import { Bell, Megaphone, FileText, ClipboardList, BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type Notif = {
  id: string;
  kind: "announcement" | "activity" | "quiz" | "material";
  title: string;
  subtitle?: string;
  created_at: string;
};

const iconFor = (k: Notif["kind"]) => {
  switch (k) {
    case "announcement": return <Megaphone className="h-3.5 w-3.5 text-info" />;
    case "activity": return <ClipboardList className="h-3.5 w-3.5 text-destructive" />;
    case "quiz": return <FileText className="h-3.5 w-3.5 text-accent" />;
    case "material": return <BookOpen className="h-3.5 w-3.5 text-success" />;
  }
};

const NotificationsPopover = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [ann, act, qz, mat] = await Promise.all([
      supabase.from("announcements").select("id,title,preview_text,created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("activities").select("id,title,due_date,created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("quizzes").select("id,title,created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("materials").select("id,title,created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    const merged: Notif[] = [
      ...((ann.data as any[]) || []).map((a) => ({ id: `ann-${a.id}`, kind: "announcement" as const, title: a.title, subtitle: a.preview_text || undefined, created_at: a.created_at })),
      ...((act.data as any[]) || []).map((a) => ({ id: `act-${a.id}`, kind: "activity" as const, title: a.title, subtitle: a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : undefined, created_at: a.created_at })),
      ...((qz.data as any[]) || []).map((q) => ({ id: `qz-${q.id}`, kind: "quiz" as const, title: q.title, subtitle: "New quiz published", created_at: q.created_at })),
      ...((mat.data as any[]) || []).map((m) => ({ id: `mat-${m.id}`, kind: "material" as const, title: m.title, subtitle: "New module uploaded", created_at: m.created_at })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = api
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activities" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quizzes" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "materials" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-primary-foreground" />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5">
              <Badge className="h-4 min-w-4 px-1 text-[8px] bg-accent text-accent-foreground border-0 font-extrabold">
                {count > 9 ? "9+" : count}
              </Badge>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[320px] p-0 overflow-hidden">
        <div className="sacred-gradient px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-accent" />
            <span className="font-serif-display text-sm font-bold text-primary-foreground">Notifications</span>
          </div>
          <span className="text-[10px] text-primary-foreground/80">{count} updates</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-7 w-7 mx-auto text-muted-foreground/40 mb-1.5" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="px-3 py-2.5 hover:bg-muted/50 transition-colors flex gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {iconFor(n.kind)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{n.title}</p>
                  {n.subtitle && <p className="text-[10px] text-muted-foreground truncate">{n.subtitle}</p>}
                  <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;