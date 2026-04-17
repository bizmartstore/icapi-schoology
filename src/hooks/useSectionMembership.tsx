import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSectionMembership = () => {
  const { user } = useAuth();
  const [memberSectionIds, setMemberSectionIds] = useState<string[]>([]);
  const [pendingSectionIds, setPendingSectionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setMemberSectionIds([]);
      setPendingSectionIds([]);
      setLoading(false);
      return;
    }
    const [{ data: members }, { data: requests }] = await Promise.all([
      supabase.from("section_members").select("section_id").eq("student_id", user.id),
      supabase.from("section_join_requests").select("section_id, status").eq("student_id", user.id).eq("status", "pending"),
    ]);
    setMemberSectionIds((members || []).map((m: any) => m.section_id));
    setPendingSectionIds((requests || []).map((r: any) => r.section_id));
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isMemberOfAny = memberSectionIds.length > 0;

  return { memberSectionIds, pendingSectionIds, isMemberOfAny, loading, refresh };
};
