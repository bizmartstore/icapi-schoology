import { useEffect, useMemo, useState } from "react";
import { Bell, Megaphone, FileText, ClipboardList, BookOpen, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type Notif = {
  id: string;
  kind: "announcement" | "activity" | "quiz" | "material" | "message";
  title: string;
  subtitle?: string;
  created_at: string;
  href?: string;
};

const DISMISSED_KEY = "icapi_dismissed_notifications";

const loadDismissed = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const saveDismissed = (ids: Set<string>) => {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
};

const iconFor = (k: Notif["kind"]) => {
  switch (k) {
    case "announcement": return <Megaphone className="h-3.5 w-3.5 text-info" />;
    case "activity": return <ClipboardList className="h-3.5 w-3.5 text-destructive" />;
    case "quiz": return <FileText className="h-3.5 w-3.5 text-accent" />;
    case "material": return <BookOpen className="h-3.5 w-3.5 text-success" />;
    case "message": return <MessageSquare className="h-3.5 w-3.5 text-primary" />;
  }
};

const NotificationsPopover = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const { memberSectionIds } = useSectionMembership();
  const isTeacher = roles.includes("teacher");
  const [items, setItems] = useState<Notif[]>([]);
  const [teacherSectionIds, setTeacherSectionIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user || !isTeacher) {
        setTeacherSectionIds([]);
        return;
      }
      const [{ data: advisory }, { data: teaching }] = await Promise.all([
        supabase.from("sections").select("id").eq("teacher_id", user.id),
        supabase.from("section_subjects").select("section_id").eq("teacher_id", user.id),
      ]);
      const ids = new Set<string>();
      (advisory || []).forEach((s: { id: string }) => ids.add(s.id));
      (teaching || []).forEach((s: { section_id: string }) => ids.add(s.section_id));
      setTeacherSectionIds([...ids]);
    };
    load();
  }, [user?.id, isTeacher]);

  const mySectionIds = isTeacher ? teacherSectionIds : memberSectionIds;
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const load = async () => {
    setLoading(true);
    const [ann, act, qz, mat] = await Promise.all([
      supabase.from("announcements").select("id,title,preview_text,created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("activities").select("id,title,due_date,created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("quizzes").select("id,title,created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("materials").select("id,title,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const merged: Notif[] = [
      ...((ann.data as any[]) || []).map((a) => ({ id: `ann-${a.id}`, kind: "announcement" as const, title: a.title, subtitle: a.preview_text || undefined, created_at: a.created_at })),
      ...((act.data as any[]) || []).map((a) => ({ id: `act-${a.id}`, kind: "activity" as const, title: a.title, subtitle: a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : undefined, created_at: a.created_at })),
      ...((qz.data as any[]) || []).map((q) => ({ id: `qz-${q.id}`, kind: "quiz" as const, title: q.title, subtitle: "New quiz published", created_at: q.created_at })),
      ...((mat.data as any[]) || []).map((m) => ({ id: `mat-${m.id}`, kind: "material" as const, title: m.title, subtitle: "New module uploaded", created_at: m.created_at })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);
    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const prepend = (n: Notif) => {
      setItems((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 15);
      });
      setLoading(false);
    };

    const ch = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const a = payload.new as { id: string; title: string; preview_text?: string; created_at: string; is_active?: boolean };
          if (a.is_active === false) return;
          prepend({
            id: `ann-${a.id}`,
            kind: "announcement",
            title: a.title,
            subtitle: a.preview_text || undefined,
            created_at: a.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          const a = payload.new as { id: string; title: string; due_date?: string; created_at: string; is_active?: boolean };
          if (a.is_active === false) return;
          prepend({
            id: `act-${a.id}`,
            kind: "activity",
            title: a.title,
            subtitle: a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : undefined,
            created_at: a.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quizzes" },
        (payload) => {
          const q = payload.new as { id: string; title: string; created_at: string; is_published?: boolean };
          if (q.is_published === false) return;
          prepend({
            id: `qz-${q.id}`,
            kind: "quiz",
            title: q.title,
            subtitle: "New quiz published",
            created_at: q.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "materials" },
        (payload) => {
          const m = payload.new as { id: string; title: string; created_at: string };
          prepend({
            id: `mat-${m.id}`,
            kind: "material",
            title: m.title,
            subtitle: "New module uploaded",
            created_at: m.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "section_messages" },
        async (payload) => {
          const m = payload.new as {
            id: string;
            section_id: string;
            user_id: string;
            recipient_id: string | null;
            reply_to_id: string | null;
            content: string;
            sender_name: string | null;
            created_at: string;
          };
          if (!user || m.user_id === user.id) return;
          if (!mySectionIds.includes(m.section_id)) return;

          let title = m.sender_name?.trim() || "New message";
          let subtitle = m.content.slice(0, 80);
          let href = "/messages";

          if (m.recipient_id === user.id) {
            title = `Private message from ${title}`;
            subtitle = m.content.slice(0, 80);
            href = `/messages?section=${m.section_id}&peer=${m.user_id}`;
          } else if (m.reply_to_id) {
            const { data: parent } = await supabase
              .from("section_messages")
              .select("user_id")
              .eq("id", m.reply_to_id)
              .maybeSingle();
            if (parent?.user_id !== user.id) return;
            title = `${title} replied to you`;
            subtitle = m.content.slice(0, 80);
            if (m.recipient_id) {
              href = `/messages?section=${m.section_id}&peer=${m.user_id}`;
            } else {
              href = `/messages?section=${m.section_id}`;
            }
          } else if (!m.recipient_id) {
            title = `Section chat: ${title}`;
            href = `/messages?section=${m.section_id}`;
          } else {
            return;
          }

          prepend({
            id: `msg-${m.id}`,
            kind: "message",
            title,
            subtitle,
            created_at: m.created_at,
            href,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mySectionIds.join(",")]);

  const visible = useMemo(
    () => items.filter((n) => !dismissed.has(n.id)),
    [items, dismissed]
  );

  const unreadCount = visible.length;

  const clearAll = () => {
    const next = new Set(dismissed);
    items.forEach((n) => next.add(n.id));
    setDismissed(next);
    saveDismissed(next);
  };

  const dismissOne = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-primary-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5">
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px] font-extrabold border-0">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[320px] p-0 overflow-hidden">
        <div className="sacred-gradient px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bell className="h-4 w-4 text-accent shrink-0" />
            <span className="font-serif-display text-sm font-bold text-primary-foreground truncate">Notifications</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-primary-foreground/80">{unreadCount} new</span>
            {items.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] text-primary-foreground hover:bg-primary-foreground/10"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3 mr-0.5" /> Clear
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-7 w-7 mx-auto text-muted-foreground/40 mb-1.5" />
              <p className="text-xs text-muted-foreground">
                {items.length > 0 ? "All caught up — check back for new updates" : "No notifications yet"}
              </p>
            </div>
          ) : (
            visible.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  dismissOne(n.id);
                  if (n.href) navigate(n.href);
                }}
                className="w-full px-3 py-2.5 hover:bg-muted/50 transition-colors flex gap-2 group text-left"
              >
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
                <span
                  role="button"
                  tabIndex={0}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 self-start transition-opacity"
                  aria-label="Dismiss"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissOne(n.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      dismissOne(n.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
