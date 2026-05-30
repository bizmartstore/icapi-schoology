import { useEffect, useState } from "react";
import { Users, GraduationCap, Check, Clock, Sparkles, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Section = {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  grade_level: string | null;
  school_level: string | null;
  cover_image_url: string | null;
  color: string | null;
};

type TeacherInfo = { user_id: string; first_name: string; last_name: string };

const SectionsList = () => {
  const { user, profile, roles } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Record<string, TeacherInfo>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { memberSectionIds, pendingSectionIds, refresh } = useSectionMembership();

  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isStudent = roles.includes("student");

  const fetchAll = async () => {
    setLoading(true);
    const { data: sectionData } = await api
      .from("sections")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    const list = (sectionData as Section[]) || [];
    setSections(list);

    if (list.length) {
      const teacherIds = [...new Set(list.map((s) => s.teacher_id))];
      const { data: teacherData } = await api
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", teacherIds);
      const map: Record<string, TeacherInfo> = {};
      (teacherData || []).forEach((t: any) => (map[t.user_id] = t));
      setTeachers(map);

      // Fetch member counts (RLS may restrict, but section owners + members can see)
      const counts: Record<string, number> = {};
      await Promise.all(
        list.map(async (s) => {
          const { count } = await api
            .from("section_members")
            .select("*", { count: "exact", head: true })
            .eq("section_id", s.id);
          counts[s.id] = count || 0;
        })
      );
      setMemberCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRequest = async (sectionId: string) => {
    if (!isLoggedIn) {
      toast.info("Please login as a student to join a section");
      navigate("/login");
      return;
    }
    if (!isStudent) {
      toast.error("Only students can join sections");
      return;
    }
    const { error } = await api
      .from("section_join_requests")
      .insert({ section_id: sectionId, student_id: user!.id });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Request already sent" : "Failed to send request");
      return;
    }
    toast.success("Join request sent! Waiting for teacher approval.");
    refresh();
  };

  if (loading) {
    return <div className="px-4 pb-3 text-center text-xs text-muted-foreground py-4">Loading sections...</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-muted/40 to-muted/10 rounded-2xl p-6 text-center border border-dashed border-border">
          <School className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-bold text-foreground">No sections yet</p>
          <p className="text-[10px] text-muted-foreground mt-1">Teachers can create advisory sections from their dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
        {sections.map((s) => {
          const isMember = memberSectionIds.includes(s.id);
          const isPending = pendingSectionIds.includes(s.id);
          const teacher = teachers[s.teacher_id];
          const gradient = s.color || "from-primary to-primary/70";
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/section/${s.id}`)}
              className="min-w-[180px] max-w-[180px] bg-card rounded-xl border border-border/60 overflow-hidden card-shadow hover:shadow-md transition-all snap-start flex-shrink-0 group cursor-pointer"
            >
              {/* Cover */}
              <div className={`relative h-16 bg-gradient-to-br ${gradient} overflow-hidden`}>
                {s.cover_image_url && (
                  <img src={s.cover_image_url} alt={s.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-1.5 left-1.5 flex gap-1">
                  {s.grade_level && (
                    <span className="text-[8px] font-bold text-primary bg-primary-foreground/95 backdrop-blur-sm px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      {s.grade_level}
                    </span>
                  )}
                </div>
                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-primary-foreground/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                  <Users className="h-2 w-2 text-primary-foreground" />
                  <span className="text-[8px] font-bold text-primary-foreground">{memberCounts[s.id] ?? 0}</span>
                </div>
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <h3 className="text-[11px] font-extrabold text-primary-foreground leading-tight line-clamp-1 drop-shadow">{s.name}</h3>
                </div>
              </div>
              {/* Body */}
              <div className="p-2">
                {teacher && (
                  <p className="text-[9px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5 line-clamp-1">
                    <GraduationCap className="h-2.5 w-2.5 flex-shrink-0" /> {teacher.first_name} {teacher.last_name}
                  </p>
                )}
                {isMember ? (
                  <button disabled className="w-full bg-success/15 text-success rounded-md py-1 text-[10px] font-bold flex items-center justify-center gap-1">
                    <Check className="h-2.5 w-2.5" /> Joined
                  </button>
                ) : isPending ? (
                  <button disabled className="w-full bg-warning/15 text-warning rounded-md py-1 text-[10px] font-bold flex items-center justify-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> Pending
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRequest(s.id); }}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-md py-1 text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm hover:shadow-md"
                  >
                    <Sparkles className="h-2.5 w-2.5" /> Request Join
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionsList;
