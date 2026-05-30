import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PendingBadges = {
  sectionJoinRequests: number;
  studentApprovals: number;
  adminApprovals: number;
  loading: boolean;
};

/** Lightweight counts for red badges on Quick Access — head-only queries + realtime. */
export function usePendingBadges(): PendingBadges {
  const { user, roles, profile } = useAuth();
  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.includes("admin");
  const approved = profile?.approval_status === "approved";

  const [sectionJoinRequests, setSectionJoinRequests] = useState(0);
  const [studentApprovals, setStudentApprovals] = useState(0);
  const [adminApprovals, setAdminApprovals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !approved) {
      setSectionJoinRequests(0);
      setStudentApprovals(0);
      setAdminApprovals(0);
      setLoading(false);
      return;
    }

    const load = async () => {
      const tasks: Promise<void>[] = [];

      if (isTeacher) {
        tasks.push(
          (async () => {
            const { data: secs } = await supabase
              .from("sections")
              .select("id")
              .eq("teacher_id", user.id);
            const ids = (secs || []).map((s) => s.id);
            if (ids.length === 0) {
              setSectionJoinRequests(0);
              return;
            }
            const { count } = await supabase
              .from("section_join_requests")
              .select("id", { count: "exact", head: true })
              .in("section_id", ids)
              .eq("status", "pending");
            setSectionJoinRequests(count ?? 0);
          })()
        );
        tasks.push(
          (async () => {
            const { count } = await supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("user_type", "student")
              .eq("approval_status", "pending");
            setStudentApprovals(count ?? 0);
          })()
        );
      }

      if (isAdmin) {
        tasks.push(
          (async () => {
            const { count } = await supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("approval_status", "pending");
            setAdminApprovals(count ?? 0);
          })()
        );
      }

      await Promise.all(tasks);
      setLoading(false);
    };

    load();

    const ch = supabase
      .channel("pending-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "section_join_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, approved, isTeacher, isAdmin]);

  return { sectionJoinRequests, studentApprovals, adminApprovals, loading };
}
