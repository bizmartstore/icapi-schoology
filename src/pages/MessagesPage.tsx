import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import ChatMessageBubble, { type ChatMessage, type ChatProfile } from "@/components/lms/ChatMessageBubble";
import ChatListScrollControls from "@/components/lms/ChatListScrollControls";
import { Send, Inbox, Lock, Users, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessagesContext } from "@/contexts/UnreadMessagesContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { privateThreadKey } from "@/lib/chat-read";

type InboxRow = {
  key: string;
  sectionId: string;
  sectionName: string;
  peerId: string | null;
  peerName: string;
  subtitle: string;
  isGroup: boolean;
  isAdviser: boolean;
  unread: number;
};

type SelectedChat = {
  sectionId: string;
  sectionName: string;
  peerId: string | null;
  peerName: string;
};

const displayName = (message: ChatMessage, p?: ChatProfile) => {
  if (message.sender_name?.trim()) return message.sender_name.trim();
  if (p) return `${p.first_name} ${p.last_name}`.trim();
  return "Member";
};

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, roles } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const {
    unreadBySection,
    unreadByPrivate,
    setActiveChat,
    markSectionRead,
    markPrivateRead,
  } = useUnreadMessagesContext();
  const isTeacher = roles.includes("teacher");

  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [selected, setSelected] = useState<SelectedChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ChatProfile>>({});
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherSectionIds, setTeacherSectionIds] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inboxScrollRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTeacherSections = async () => {
      if (!user || !isTeacher) return;
      const [{ data: advisory }, { data: teaching }] = await Promise.all([
        supabase.from("sections").select("id").eq("teacher_id", user.id),
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

  const replyMap = useMemo(() => {
    const map: Record<string, ChatMessage> = {};
    messages.forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [messages]);

  const loadInbox = async () => {
    if (!user || !hasSections) {
      setInbox([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const rows: InboxRow[] = [];

    const { data: sections } = await supabase
      .from("sections")
      .select("id, name, teacher_id")
      .in("id", sectionIds);

    for (const sec of sections || []) {
      const sectionId = sec.id as string;
      const sectionName = sec.name as string;
      const adviserId = sec.teacher_id as string;

      const { data: lastGroup } = await supabase
        .from("section_messages")
        .select("content, created_at")
        .eq("section_id", sectionId)
        .is("recipient_id", null)
        .order("created_at", { ascending: false })
        .limit(1);

      rows.push({
        key: `group:${sectionId}`,
        sectionId,
        sectionName,
        peerId: null,
        peerName: sectionName,
        subtitle: lastGroup?.[0]?.content || "Section group chat",
        isGroup: true,
        isAdviser: false,
        unread: unreadBySection[sectionId] || 0,
      });

      const peerIds = new Set<string>();
      if (adviserId && adviserId !== user.id) peerIds.add(adviserId);

      const { data: members } = await supabase
        .from("section_members")
        .select("student_id")
        .eq("section_id", sectionId);
      (members || []).forEach((m: { student_id: string }) => {
        if (m.student_id !== user.id) peerIds.add(m.student_id);
      });

      if (peerIds.size > 0) {
        const { data: peerProfiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_data")
          .in("user_id", [...peerIds]);

        const profileBatch = (peerProfiles || []) as ChatProfile[];
        setProfiles((prev) => {
          const next = { ...prev };
          profileBatch.forEach((p) => (next[p.user_id] = p));
          return next;
        });

        for (const p of profileBatch) {
          const peerId = p.user_id;
          const peerName = `${p.first_name} ${p.last_name}`.trim();
          const { data: lastPriv } = await supabase
            .from("section_messages")
            .select("content, created_at")
            .eq("section_id", sectionId)
            .not("recipient_id", "is", null)
            .or(
              `and(user_id.eq.${user.id},recipient_id.eq.${peerId}),and(user_id.eq.${peerId},recipient_id.eq.${user.id})`,
            )
            .order("created_at", { ascending: false })
            .limit(1);

          rows.push({
            key: `priv:${sectionId}:${peerId}`,
            sectionId,
            sectionName,
            peerId,
            peerName,
            subtitle: lastPriv?.[0]?.content || "Private chat",
            isGroup: false,
            isAdviser: peerId === adviserId,
            unread: unreadByPrivate[privateThreadKey(sectionId, peerId)] || 0,
          });
        }
      }
    }

    rows.sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return a.sectionName.localeCompare(b.sectionName);
    });

    setInbox(rows);
    setLoading(false);
  };

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, sectionIds.join(","), hasSections]);

  useEffect(() => {
    setInbox((prev) =>
      prev
        .map((r) => ({
          ...r,
          unread: r.peerId
            ? unreadByPrivate[privateThreadKey(r.sectionId, r.peerId)] || 0
            : unreadBySection[r.sectionId] || 0,
        }))
        .sort((a, b) => {
          if (a.unread !== b.unread) return b.unread - a.unread;
          return 0;
        }),
    );
  }, [unreadBySection, unreadByPrivate]);

  useEffect(() => {
    const sectionParam = searchParams.get("section");
    const peerParam = searchParams.get("peer");
    if (!sectionParam || !hasSections) return;
    const row = inbox.find(
      (r) =>
        r.sectionId === sectionParam &&
        (peerParam ? r.peerId === peerParam : r.peerId === null),
    );
    if (row) {
      openChat({
        sectionId: row.sectionId,
        sectionName: row.sectionName,
        peerId: row.peerId,
        peerName: row.peerName,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, inbox.length, hasSections]);

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

  const loadMessages = async (chat: SelectedChat) => {
    let query = supabase
      .from("section_messages")
      .select("*")
      .eq("section_id", chat.sectionId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (chat.peerId) {
      query = query
        .not("recipient_id", "is", null)
        .or(
          `and(user_id.eq.${user!.id},recipient_id.eq.${chat.peerId}),and(user_id.eq.${chat.peerId},recipient_id.eq.${user!.id})`,
        );
    } else {
      query = query.is("recipient_id", null);
    }

    const { data } = await query;
    const list = (data as ChatMessage[]) || [];
    setMessages(list);
    const ids = new Set(list.map((m) => m.user_id));
    const replyIds = [...new Set(list.map((m) => m.reply_to_id).filter(Boolean))] as string[];
    if (replyIds.length > 0) {
      const { data: parents } = await supabase
        .from("section_messages")
        .select("id, user_id")
        .in("id", replyIds);
      (parents || []).forEach((p: { user_id: string }) => ids.add(p.user_id));
    }
    fetchProfiles([...ids]);
  };

  useEffect(() => {
    if (!selected || !user) {
      setActiveChat(null);
      return;
    }

    setActiveChat({ sectionId: selected.sectionId, peerId: selected.peerId });
    if (selected.peerId) markPrivateRead(selected.sectionId, selected.peerId);
    else markSectionRead(selected.sectionId);

    loadMessages(selected);

    const filter = `section_id=eq.${selected.sectionId}`;
    const ch = supabase
      .channel(`messages-${selected.sectionId}-${selected.peerId || "group"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "section_messages", filter },
        (payload) => {
          const m = payload.new as ChatMessage;
          const isPrivate = Boolean(m.recipient_id);
          const inThread =
            !selected.peerId
              ? !isPrivate
              : isPrivate &&
                ((m.user_id === user.id && m.recipient_id === selected.peerId) ||
                  (m.user_id === selected.peerId && m.recipient_id === user.id));

          if (!inThread) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          fetchProfiles([m.user_id]);
          if (m.user_id !== user.id) {
            if (selected.peerId) markPrivateRead(selected.sectionId, selected.peerId);
            else markSectionRead(selected.sectionId);
          }
        },
      )
      .subscribe();

    return () => {
      setActiveChat(null);
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.sectionId, selected?.peerId, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, replyingTo?.id]);

  const openChat = (chat: SelectedChat) => {
    setSelected(chat);
    setReplyingTo(null);
    if (chat.peerId) markPrivateRead(chat.sectionId, chat.peerId);
    else markSectionRead(chat.sectionId);
  };

  const send = async () => {
    const content = text.trim();
    if (!content || !user || !selected) return;
    setSending(true);
    const senderName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Member";
    const { error } = await supabase.from("section_messages").insert({
      section_id: selected.sectionId,
      user_id: user.id,
      content,
      sender_name: senderName,
      recipient_id: selected.peerId,
      reply_to_id: replyingTo?.id || null,
    });
    if (!error) {
      setText("");
      setReplyingTo(null);
    }
    setSending(false);
  };

  const fmtTime = (s: string) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const replyPreviewFor = (msg: ChatMessage) => {
    if (!msg.reply_to_id) return null;
    const parent = replyMap[msg.reply_to_id] || messages.find((m) => m.id === msg.reply_to_id);
    if (!parent) return { author: "Message", content: "…" };
    return {
      author: displayName(parent, profiles[parent.user_id]),
      content: parent.content,
    };
  };

  if (!hasSections) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">
              {isTeacher ? "Create or advise a section to use messages" : "Join a section to chat with your class"}
            </p>
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

  if (selected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LMSHeader />
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setMessages([]);
                setReplyingTo(null);
                navigate("/messages", { replace: true });
              }}
              className="text-sm text-primary font-medium"
            >
              ← Back
            </button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {selected.peerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{selected.peerName}</p>
              <p className="text-[10px] text-muted-foreground">
                {selected.peerId ? `Private · ${selected.sectionName}` : "Section group chat · Live"}
              </p>
            </div>
          </div>
          <div className="relative flex-1 min-h-0">
            <div ref={messagesScrollRef} className="absolute inset-0 p-4 space-y-3 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground mt-8">No messages yet. Say hello! 👋</p>
              ) : (
                messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    profile={profiles[msg.user_id]}
                    isMine={msg.user_id === user?.id}
                    fmtTime={fmtTime}
                    replyPreview={replyPreviewFor(msg)}
                    onReply={() => setReplyingTo(msg)}
                  />
                ))
              )}
              <div ref={endRef} />
            </div>
            <ChatListScrollControls scrollRef={messagesScrollRef} className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
          </div>
          {replyingTo && (
            <div className="bg-muted/50 border-t border-border px-4 py-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground flex-1 truncate">
                Replying to <span className="font-bold">{displayName(replyingTo, profiles[replyingTo.user_id])}</span>:{" "}
                {replyingTo.content.slice(0, 60)}
              </span>
              <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="bg-card border-t border-border p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm allow-select"
                placeholder={replyingTo ? "Write a reply…" : "Type a message…"}
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

  const grouped = inbox.reduce<Record<string, InboxRow[]>>((acc, row) => {
    if (!acc[row.sectionName]) acc[row.sectionName] = [];
    acc[row.sectionName].push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4">
          <h2 className="text-base font-bold text-foreground mb-1">Messages</h2>
          <p className="text-[11px] text-muted-foreground mb-3">
            Section group chat, private messages with your adviser, and classmates.
          </p>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading conversations…</div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No chats available</p>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={inboxScrollRef}
                className="max-h-[min(62vh,520px)] overflow-y-auto pr-10 space-y-4 pb-4"
              >
                {Object.entries(grouped).map(([sectionName, rows]) => (
                  <div key={sectionName}>
                    <p className="text-[11px] font-extrabold text-primary mb-2 uppercase tracking-wide sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-[1]">
                      {sectionName}
                    </p>
                    <div className="space-y-2">
                      {rows.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() =>
                            openChat({
                              sectionId: c.sectionId,
                              sectionName: c.sectionName,
                              peerId: c.peerId,
                              peerName: c.peerName,
                            })
                          }
                          className="w-full bg-card rounded-2xl p-3 px-4 card-shadow flex items-center gap-3 text-left hover:card-shadow-hover transition-all"
                        >
                          <Avatar className="h-10 w-10">
                            {c.isGroup ? (
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <Users className="h-5 w-5" />
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={profiles[c.peerId!]?.avatar_data || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {c.isGroup ? "Section Chat" : c.peerName}
                                {c.isAdviser && !c.isGroup && (
                                  <span className="ml-1 text-[9px] font-bold text-primary">· Adviser</span>
                                )}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{c.subtitle}</p>
                          </div>
                          {c.unread > 0 && (
                            <span className="h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                              {c.unread > 9 ? "9+" : c.unread}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <ChatListScrollControls scrollRef={inboxScrollRef} className="absolute right-0 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
