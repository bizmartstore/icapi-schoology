import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { getSectionLastRead, markSectionRead } from "@/lib/chat-read";

export type UnreadMessagesState = {
  totalUnread: number;
  unreadBySection: Record<string, number>;
  loading: boolean;
  markSectionRead: (sectionId: string) => void;
  refreshUnread: () => void;
};

/** Tracks unread section chat counts via localStorage + lightweight realtime (no full reloads). */
export function useUnreadMessages(activeSectionId?: string | null): UnreadMessagesState {
  const { user, roles, profile } = useAuth();
  const { memberSectionIds } = useSectionMembership();
  const isTeacher = roles.includes("teacher");
  const approved = profile?.approval_status === "approved";

  const [teacherSectionIds, setTeacherSectionIds] = useState<string[]>([]);
  const [unreadBySection, setUnreadBySection] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const sectionIdsRef = useRef<string[]>([]);
  const activeSectionRef = useRef(activeSectionId);
  activeSectionRef.current = activeSectionId;

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

  const countUnread = useCallback(
    (msgs: { section_id: string; user_id: string; created_at: string }[]) => {
      if (!user) return {};
      const counts: Record<string, number> = {};
      for (const m of msgs) {
        if (m.user_id === user.id) continue;
        const lastRead = getSectionLastRead(user.id, m.section_id);
        if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
          counts[m.section_id] = (counts[m.section_id] || 0) + 1;
        }
      }
      return counts;
    },
    [user]
  );

  const refreshUnread = useCallback(async () => {
    const ids = sectionIdsRef.current;
    if (!user || !approved || ids.length === 0) {
      setUnreadBySection({});
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("section_messages")
      .select("section_id, user_id, created_at")
      .in("section_id", ids)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(300);

    setUnreadBySection(countUnread((data as typeof data) || []));
    setLoading(false);
  }, [user, approved, countUnread]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, sectionIds.join(",")]);

  useEffect(() => {
    if (!user || !approved || sectionIds.length === 0) return;

    const bumpUnread = (sectionId: string, senderId: string, createdAt: string) => {
      if (senderId === user.id) return;
      if (activeSectionRef.current === sectionId) {
        markSectionRead(user.id, sectionId, createdAt);
        return;
      }
      const lastRead = getSectionLastRead(user.id, sectionId);
      if (new Date(createdAt).getTime() <= new Date(lastRead).getTime()) return;
      setUnreadBySection((prev) => ({
        ...prev,
        [sectionId]: (prev[sectionId] || 0) + 1,
      }));
    };

    const ch = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "section_messages" },
        (payload) => {
          const m = payload.new as {
            section_id: string;
            user_id: string;
            created_at: string;
          };
          if (!sectionIdsRef.current.includes(m.section_id)) return;
          bumpUnread(m.section_id, m.user_id, m.created_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, approved, sectionIds.join(",")]);

  const markRead = useCallback(
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
    [user]
  );

  const totalUnread = Object.values(unreadBySection).reduce((a, b) => a + b, 0);

  return {
    totalUnread,
    unreadBySection,
    loading,
    markSectionRead: markRead,
    refreshUnread,
  };
}
