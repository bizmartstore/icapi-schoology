import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { Send, Inbox, Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";

type SectionConv = {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
};

type Msg = { id: string; user_id: string; content: string; created_at: string };
type Prof = { user_id: string; first_name: string; last_name: string };

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const isTeacher = roles.includes("teacher");

  const [conversations, setConversations] = useState<SectionConv[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Prof>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherSectionIds, setTeacherSectionIds] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTeacherSections = async () => {
      if (!user || !isTeacher) return;
      const [{ data: advisory }, { data: teaching }] = await Promise.all([
        supabase.from("sections").select("id").eq("adviser_id", user.id),
        supabase.from("section_subjects").select("section_id").eq("teacher_id", user.id),
      ]);
      const ids = new Set<string>();
      (advisory || []).forEach((s: { id: string }) => ids.add(s.id));
      (teaching || []).forEach((s: { section_id: string }) => ids.add(s.section_id));
      setTeacherSectionIds([...ids]);
    };
    loadTeacherSections();
  }, [user?.id, isTeacher]);

  const sectionIds = isTeacher ? teacherSectionIds : memberSectionIds;
  const hasSections = sectionIds.length > 0;

  useEffect(() => {
    const loadConversations = async () => {
      if (!user || !hasSections) {
        setConversations([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: sections } = await supabase.from("sections").select("id, name").in("id", sectionIds);
      const { data: allMsgs } = await api
        .from("section_messages")
        .select("section_id, content, created_at, user_id")
        .in("section_id", sectionIds)
        .order("created_at", { ascending: false });

      const lastBySection: Record<string, { content: string; created_at: string; user_id: string }> = {};
      (allMsgs || []).forEach((m: { section_id: string; content: string; created_at: string; user_id: string }) => {
        if (!lastBySection[m.section_id]) {
          lastBySection[m.section_id] = { content: m.content, created_at: m.created_at, user_id: m.user_id };
        }
      });

      const convs: SectionConv[] = (sections || []).map((s: { id: string; name: string }) => {
        const last = lastBySection[s.id];
        return {
          id: s.id,
          name: s.name,
          lastMsg: last?.content || "No messages yet",
          time: last ? fmtRelative(last.created_at) : "",
          unread: last && last.user_id !== user.id ? 1 : 0,
        };
      });

      convs.sort((a, b) => {
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
        return 0;
      });

      setConversations(convs);
      setLoading(false);
    };

    loadConversations();
  }, [user?.id, sectionIds.join(",")]);

  const fetchProfiles = async (ids: string[]) => {
    const missing = ids.filter((i) => !profiles[i]);
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", missing);
    if (data) {
      setProfiles((prev) => {
        const map = { ...prev };
        (data as Prof[]).forEach((p) => (map[p.user_id] = p));
        return map;
      });
    }
  };

  const loadMessages = async (sectionId: string) => {
    const { data } = await api
      .from("section_messages")
      .select("*")
      .eq("section_id", sectionId)
      .order("created_at", { ascending: true })
      .limit(200);
    const list = (data as Msg[]) || [];
    setMessages(list);
    fetchProfiles([...new Set(list.map((m) => m.user_id))]);
  };

  useEffect(() => {
    if (!selectedSection) return;
    loadMessages(selectedSection);

    const ch = api
      .channel(`messages-${selectedSection}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "section_messages", filter: `section_id=eq.${selectedSection}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          fetchProfiles([m.user_id]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const openChat = (conv: SectionConv) => {
    setSelectedSection(conv.id);
    setSelectedName(conv.name);
  };

  const send = async () => {
    const content = text.trim();
    if (!content || !user || !selectedSection) return;
    setSending(true);
    const { error } = await supabase.from("section_messages").insert({
      section_id: selectedSection,
      user_id: user.id,
      content,
    });
    if (!error) setText("");
    setSending(false);
  };

  const fmtTime = (s: string) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!hasSections) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">
              {isTeacher ? "Create or join a section to use messages" : "Join a section to chat with classmates"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Section chat lets you communicate with your class in real time.</p>
            {isTeacher && (
              <Button size="sm" className="mt-4 rounded-xl" onClick={() => navigate("/sections")}>
                Go to Sections
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedSection) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LMSHeader />
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <button type="button" onClick={() => { setSelectedSection(null); setMessages([]); }} className="text-sm text-primary font-medium">
              ← Back
            </button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{selectedName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-foreground">{selectedName}</p>
              <p className="text-[10px] text-muted-foreground">Section Chat · Realtime</p>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-8">No messages yet. Say hello! 👋</p>
            ) : (
              messages.map((msg) => {
                const mine = msg.user_id === user?.id;
                const p = profiles[msg.user_id];
                const name = p ? `${p.first_name} ${p.last_name}` : "Member";
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card card-shadow text-foreground rounded-bl-md"
                    }`}>
                      {!mine && <p className="text-[9px] font-bold opacity-80 mb-0.5">{name}</p>}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{fmtTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="bg-card border-t border-border p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm"
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button type="submit" size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={sending || !text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4">
          <h2 className="text-base font-bold text-foreground mb-3">Messages</h2>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No section chats available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openChat(c)}
                  className="w-full bg-card rounded-2xl p-3 px-4 card-shadow flex items-center gap-3 text-left hover:card-shadow-hover transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{c.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      {c.time && <span className="text-[10px] text-muted-foreground">{c.time}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="h-5 min-w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1.5">{c.unread}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
