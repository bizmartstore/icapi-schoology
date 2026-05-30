import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessagesContext } from "@/contexts/UnreadMessagesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import ChatMessageBubble, { type ChatMessage, type ChatProfile } from "@/components/lms/ChatMessageBubble";

const SectionChat = ({ sectionId, canPost }: { sectionId: string; canPost: boolean }) => {
  const { user, profile } = useAuth();
  const { setActiveSectionId, markSectionRead } = useUnreadMessagesContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ChatProfile>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = async (ids: string[]) => {
    const missing = ids.filter((i) => !profiles[i]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_data")
      .in("user_id", missing);
    if (data) {
      setProfiles((prev) => {
        const map = { ...prev };
        (data as ChatProfile[]).forEach((p) => (map[p.user_id] = p));
        return map;
      });
    }
  };

  const load = async () => {
    const { data } = await supabase
      .from("section_messages")
      .select("*")
      .eq("section_id", sectionId)
      .order("created_at", { ascending: true })
      .limit(200);
    const list = (data as ChatMessage[]) || [];
    setMessages(list);
    fetchProfiles([...new Set(list.map((m) => m.user_id))]);
  };

  useEffect(() => {
    setActiveSectionId(sectionId);
    markSectionRead(sectionId);
    load();
    const ch = supabase
      .channel(`section-chat-${sectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "section_messages", filter: `section_id=eq.${sectionId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          fetchProfiles([m.user_id]);
          if (m.user_id !== user?.id) markSectionRead(sectionId);
        }
      )
      .subscribe();
    return () => {
      setActiveSectionId(null);
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || !user) return;
    setSending(true);
    const senderName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Member";
    const { error } = await supabase.from("section_messages").insert({
      section_id: sectionId,
      user_id: user.id,
      content,
      sender_name: senderName,
    });
    if (!error) setText("");
    setSending(false);
  };

  const fmtTime = (s: string) => {
    const d = new Date(s);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-card rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50 bg-muted/30">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Section Chat</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">Live</span>
      </div>
      <div className="h-72 overflow-y-auto p-3 space-y-3 bg-muted/10">
        {messages.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center mt-8">No messages yet. Say hello! 👋</p>
        ) : (
          messages.map((m) => (
            <ChatMessageBubble
              key={m.id}
              message={m}
              profile={profiles[m.user_id]}
              isMine={m.user_id === user?.id}
              fmtTime={fmtTime}
              compact
            />
          ))
        )}
        <div ref={endRef} />
      </div>
      {canPost ? (
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 p-2 border-t border-border/50 bg-background"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            className="text-xs h-9"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="h-9 w-9 rounded-xl" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="p-2 border-t border-border/50 text-center text-[11px] text-muted-foreground">
          Join this section to chat.
        </div>
      )}
    </div>
  );
};

export default SectionChat;
