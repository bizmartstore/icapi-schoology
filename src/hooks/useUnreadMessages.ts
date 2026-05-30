import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import {
  getPrivateLastRead,
  getSectionLastRead,
  markPrivateRead,
  markSectionRead,
  privateThreadKey,
} from "@/lib/chat-read";

export type ActiveChat = {
  sectionId: string;
  peerId: string | null;
} | null;

type MsgRow = {
  section_id: string;
  user_id: string;
  recipient_id: string | null;
  reply_to_id: string | null;
  created_at: string;
};

export type UnreadMessagesState = {
  totalUnread: number;
  unreadBySection: Record<string, number>;
  unreadByPrivate: Record<string, number>;
  loading: boolean;
  markSectionRead: (sectionId: string) => void;
  markPrivateRead: (sectionId: string, peerId: string) => void;
  refreshUnread: () => void;
};

export function useUnreadMessages(activeChat?: ActiveChat | null): UnreadMessagesState {
  const { user, roles, profile } = useAuth();
  const { memberSectionIds } = useSectionMembership();
  const isTeacher = roles.includes("teacher");
  const approved = profile?.approval_status === "approved";

  const [teacherSectionIds, setTeacherSectionIds] = useState<string[]>([]);
  const [unreadBySection, setUnreadBySection] = useState<Record<string, number>>({});
  const [unreadByPrivate, setUnreadByPrivate] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const sectionIdsRef = useRef<string[]>([]);
  const activeChatRef = useRef(activeChat);
  activeChatRef.current = activeChat;

  useEffect(() => {
    const loadTeacherSections = async () => {
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
    loadTeacherSections();
  }, [user?.id, isTeacher]);

  const sectionIds = isTeacher ? teacherSectionIds : memberSectionIds;
  sectionIdsRef.current = sectionIds;

  const isViewingChat = useCallback((m: MsgRow) => {
    const active = activeChatRef.current;
    if (!active || active.sectionId !== m.section_id) return false;
    if (active.peerId === null) return !m.recipient_id;
    if (!m.recipient_id) return false;
    const peer = active.peerId;
    return (
      (m.user_id === user!.id && m.recipient_id === peer) ||
      (m.user_id === peer && m.recipient_id === user!.id)
    );
  }, [user]);

  const countUnread = useCallback(
    async (msgs: MsgRow[]) => {
      if (!user) return { section: {}, priv: {} };

      const sectionCounts: Record<string, number> = {};
      const privCounts: Record<string, number> = {};
      const replyIds = msgs.filter((m) => m.reply_to_id).map((m) => m.reply_to_id!);
      const parentMap: Record<string, { user_id: string }> = {};

      if (replyIds.length > 0) {
        const { data: parents } = await supabase
          .from("section_messages")
          .select("id, user_id")
          .in("id", [...new Set(replyIds)]);
        (parents || []).forEach((p: { id: string; user_id: string }) => {
          parentMap[p.id] = { user_id: p.user_id };
        });
      }

      for (const m of msgs) {
        if (m.user_id === user.id) continue;

        if (m.recipient_id === user.id) {
          const peerId = m.user_id;
          const lastRead = getPrivateLastRead(user.id, m.section_id, peerId);
          if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
            const key = privateThreadKey(m.section_id, peerId);
            privCounts[key] = (privCounts[key] || 0) + 1;
          }
          continue;
        }

        if (m.reply_to_id && parentMap[m.reply_to_id]?.user_id === user.id) {
          if (m.recipient_id) {
            const peerId = m.user_id === user.id ? m.recipient_id : m.user_id;
            const lastRead = getPrivateLastRead(user.id, m.section_id, peerId);
            if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
              const key = privateThreadKey(m.section_id, peerId);
              privCounts[key] = (privCounts[key] || 0) + 1;
            }
          } else {
            const lastRead = getSectionLastRead(user.id, m.section_id);
            if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
              sectionCounts[m.section_id] = (sectionCounts[m.section_id] || 0) + 1;
            }
          }
          continue;
        }

        if (!m.recipient_id && !m.reply_to_id) {
          const lastRead = getSectionLastRead(user.id, m.section_id);
          if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
            sectionCounts[m.section_id] = (sectionCounts[m.section_id] || 0) + 1;
          }
        }
      }

      return { section: sectionCounts, priv: privCounts };
    },
    [user],
  );

  const refreshUnread = useCallback(async () => {
    const ids = sectionIdsRef.current;
    if (!user || !approved || ids.length === 0) {
      setUnreadBySection({});
      setUnreadByPrivate({});
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("section_messages")
      .select("section_id, user_id, recipient_id, reply_to_id, created_at")
      .in("section_id", ids)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(400);

    const { section, priv } = await countUnread((data as MsgRow[]) || []);
    setUnreadBySection(section);
    setUnreadByPrivate(priv);
    setLoading(false);
  }, [user, approved, countUnread]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, sectionIds.join(",")]);

  const bumpFromMessage = useCallback(
    async (m: MsgRow) => {
      if (!user || m.user_id === user.id) return;
      if (isViewingChat(m)) {
        if (!m.recipient_id) markSectionRead(user.id, m.section_id, m.created_at);
        else markPrivateRead(user.id, m.section_id, m.user_id, m.created_at);
        return;
      }

      if (m.recipient_id === user.id) {
        const lastRead = getPrivateLastRead(user.id, m.section_id, m.user_id);
        if (new Date(m.created_at).getTime() <= new Date(lastRead).getTime()) return;
        const key = privateThreadKey(m.section_id, m.user_id);
        setUnreadByPrivate((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        return;
      }

      let countsAsReplyToMe = false;
      if (m.reply_to_id) {
        const { data: parent } = await supabase
          .from("section_messages")
          .select("user_id")
          .eq("id", m.reply_to_id)
          .maybeSingle();
        countsAsReplyToMe = parent?.user_id === user.id;
      }

      if (countsAsReplyToMe) {
        if (m.recipient_id) {
          const key = privateThreadKey(m.section_id, m.user_id);
          setUnreadByPrivate((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        } else {
          setUnreadBySection((prev) => ({
            ...prev,
            [m.section_id]: (prev[m.section_id] || 0) + 1,
          }));
        }
        return;
      }

      if (!m.recipient_id && !m.reply_to_id) {
        const lastRead = getSectionLastRead(user.id, m.section_id);
        if (new Date(m.created_at).getTime() <= new Date(lastRead).getTime()) return;
        setUnreadBySection((prev) => ({
          ...prev,
          [m.section_id]: (prev[m.section_id] || 0) + 1,
        }));
      }
    },
    [user, isViewingChat],
  );

  useEffect(() => {
    if (!user || !approved || sectionIds.length === 0) return;

    const ch = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "section_messages" },
        (payload) => {
          const m = payload.new as MsgRow;
          if (!sectionIdsRef.current.includes(m.section_id)) return;
          void bumpFromMessage(m);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, approved, sectionIds.join(","), bumpFromMessage]);

  const markSection = useCallback(
    (sectionId: string) => {
      if (!user) return;
      markSectionRead(user.id, sectionId);
      setUnreadBySection((prev) => {
        if (!prev[sectionId]) return prev;
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    },
    [user],
  );

  const markPrivate = useCallback(
    (sectionId: string, peerId: string) => {
      if (!user) return;
      markPrivateRead(user.id, sectionId, peerId);
      const key = privateThreadKey(sectionId, peerId);
      setUnreadByPrivate((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [user],
  );

  const totalUnread =
    Object.values(unreadBySection).reduce((a, b) => a + b, 0) +
    Object.values(unreadByPrivate).reduce((a, b) => a + b, 0);

  return {
    totalUnread,
    unreadBySection,
    unreadByPrivate,
    loading,
    markSectionRead: markSection,
    markPrivateRead: markPrivate,
    refreshUnread,
  };
}
