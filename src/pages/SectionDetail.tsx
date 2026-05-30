import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, GraduationCap, CalendarClock, Users, Megaphone, Lock, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import LMSHeader from "@/components/lms/LMSHeader";
import SectionChat from "@/components/lms/SectionChat";
import SectionJoinPasscodeDialog from "@/components/lms/SectionJoinPasscodeDialog";
import { requestSectionJoin } from "@/lib/section-passcode";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Section = {
  id: string; name: string; description: string | null;
  grade_level: string | null; school_level: string | null;
  cover_image_url: string | null; color: string | null;
  teacher_id: string;
};

const SectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, roles } = useAuth();
  const { pendingSectionIds, refresh: refreshMembership, memberSectionIds } = useSectionMembership();
  const [section, setSection] = useState<Section | null>(null);
  const [adviser, setAdviser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [submittingPasscode, setSubmittingPasscode] = useState(false);

  const isStudent = roles.includes("student");
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isMember = id ? memberSectionIds.includes(id) : false;
  const isPending = id ? pendingSectionIds.includes(id) : false;

  useEffect(() => {
    if (!id) return;
    load();
    const ch = supabase
      .channel(`section-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "section_subjects", filter: `section_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "class_schedules" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements", filter: `section_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: sec } = await supabase.from("sections").select("*").eq("id", id).maybeSingle();
    setSection(sec as Section | null);

    if (sec) {
      const [{ data: adv }, { data: ss }, { count }, { data: ann }] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name, email").eq("user_id", sec.teacher_id).maybeSingle(),
        supabase.from("section_subjects").select("*").eq("section_id", id),
        supabase.from("section_members").select("*", { count: "exact", head: true }).eq("section_id", id),
        Promise.resolve({ data: null }),
        supabase.from("announcements").select("*").eq("section_id", id).eq("scope", "section").eq("is_active", true).order("created_at", { ascending: false }),
      ]);
      setAdviser(adv);
      setMemberCount(count || 0);
      setAnnouncements(ann || []);

      const ssList = ss || [];
      const subjectIds = [...new Set(ssList.map((s: any) => s.subject_id))];
      const teacherIds = [...new Set(ssList.map((s: any) => s.teacher_id))];
      const ssIds = ssList.map((s: any) => s.id);

      const [{ data: subjRows }, { data: teacherRows }, { data: schedRows }] = await Promise.all([
        subjectIds.length ? supabase.from("subjects").select("*").in("id", subjectIds) : Promise.resolve({ data: [] as any[] }),
        teacherIds.length ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", teacherIds) : Promise.resolve({ data: [] as any[] }),
        ssIds.length ? supabase.from("class_schedules").select("*").in("section_subject_id", ssIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const subjMap: Record<string, any> = {};
      (subjRows || []).forEach((s: any) => (subjMap[s.id] = s));
      const tMap: Record<string, any> = {};
      (teacherRows || []).forEach((t: any) => (tMap[t.user_id] = t));
      setSubjects(ssList.map((ss: any) => ({
        ...ss,
        subject: subjMap[ss.subject_id],
        teacher: tMap[ss.teacher_id],
        slots: (schedRows || []).filter((sc: any) => sc.section_subject_id === ss.id).sort((a: any, b: any) => a.day_of_week - b.day_of_week || (a.start_time > b.start_time ? 1 : -1)),
      })));
    }
    setLoading(false);
  };

  const handleRequestJoin = () => {
    if (!isLoggedIn) {
      toast.info("Please login as a student to join a section");
      navigate("/login");
      return;
    }
    if (!isStudent) {
      toast.error("Only students can join sections");
      return;
    }
    if (isPending) {
      toast.info("Join request already sent. Waiting for teacher approval.");
      return;
    }
    setPasscodeOpen(true);
  };

  const submitJoinWithPasscode = async (passcode: string) => {
    if (!id) return;
    setSubmittingPasscode(true);
    const result = await requestSectionJoin(id, passcode);
    setSubmittingPasscode(false);

    if (!result.ok) {
      if (result.reason === "invalid") toast.error("Incorrect passcode. Try again.");
      else if (result.reason === "duplicate") toast.info("Request already sent. Waiting for teacher approval.");
      else toast.error(result.message || "Failed to send request");
      if (result.reason === "duplicate") {
        setPasscodeOpen(false);
        refreshMembership();
      }
      return;
    }

    toast.success("Join request sent! Waiting for teacher approval.");
    setPasscodeOpen(false);
    refreshMembership();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!section) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4">
      <p className="text-sm text-muted-foreground">Section not found.</p>
      <Button onClick={() => navigate("/")}>Back home</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <div className={`relative h-32 bg-gradient-to-br ${section.color || "from-primary to-primary/70"}`}>
          {section.cover_image_url && (
            <img src={section.cover_image_url} alt={section.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Button variant="ghost" size="icon" className="absolute top-3 left-3 rounded-xl text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-xl font-extrabold text-primary-foreground drop-shadow">{section.name}</h1>
            <p className="text-[11px] text-primary-foreground/90">
              {section.grade_level} · <Users className="inline h-3 w-3" /> {memberCount} members
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {section.description && (
            <div className="bg-card rounded-2xl p-3 card-shadow">
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          )}

          {/* Adviser */}
          <div className="bg-card rounded-2xl p-3 card-shadow flex items-center gap-3">
            <div className="h-10 w-10 rounded-full shopee-gradient flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Adviser</p>
              <p className="text-sm font-bold text-foreground">{adviser ? `${adviser.first_name} ${adviser.last_name}` : "—"}</p>
            </div>
          </div>

          {!isMember && (
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground">
                  {isPending
                    ? "Your join request is pending adviser approval."
                    : "Enter your adviser's 4-digit passcode to request joining this section."}
                </p>
              </div>
              {isStudent && isLoggedIn && !isPending && (
                <Button size="sm" className="w-full rounded-xl text-xs font-bold h-9" onClick={handleRequestJoin}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Request to Join
                </Button>
              )}
              {isPending && (
                <div className="flex items-center justify-center gap-1 text-warning text-[11px] font-bold">
                  <Clock className="h-3.5 w-3.5" /> Pending approval
                </div>
              )}
            </div>
          )}

          {/* Subjects */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Subjects ({subjects.length})</h2>
            </div>
            {subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 text-center">
                No subjects configured yet. The adviser hasn't added any.
              </p>
            ) : (
              <div className="space-y-2">
                {subjects.map((ss: any) => (
                  <div
                    key={ss.id}
                    onClick={() => isMember && navigate(`/learn/${ss.id}`)}
                    className={`bg-card rounded-2xl p-3 card-shadow ${isMember ? "cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-lg ${ss.subject?.color || "bg-primary"} flex items-center justify-center`}>
                          <BookOpen className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{ss.subject?.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-2.5 w-2.5" />
                            {ss.teacher ? `${ss.teacher.first_name} ${ss.teacher.last_name}` : "Teacher"}
                          </p>
                        </div>
                      </div>
                      {ss.subject?.grade_level && <Badge variant="outline" className="text-[9px]">{ss.subject.grade_level}</Badge>}
                    </div>
                    {ss.slots.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ss.slots.map((sl: any) => (
                          <span key={sl.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CalendarClock className="h-2.5 w-2.5" />
                            {DAYS[sl.day_of_week]} {sl.start_time?.slice(0, 5)}–{sl.end_time?.slice(0, 5)}
                            {sl.room && ` · ${sl.room}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isMember && (
            <>
              {/* Section Announcements */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Megaphone className="h-4 w-4 text-info" />
                  <h2 className="text-sm font-bold text-foreground">Section Announcements ({announcements.length})</h2>
                </div>
                {announcements.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 text-center">
                    No section announcements yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {announcements.map((a) => (
                      <div key={a.id} className="bg-card rounded-2xl p-3 card-shadow border border-border/50">
                        <div className="flex items-start gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-info to-info/70 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">{a.title}</p>
                            <p className="text-[10px] text-muted-foreground mb-1">{a.from_name || "Adviser"} · {new Date(a.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                              {a.full_content || a.preview_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Realtime Chat */}
              <SectionChat sectionId={section.id} canPost={isMember || section.teacher_id === user?.id} />
            </>
          )}
        </div>
      </div>

      <SectionJoinPasscodeDialog
        open={passcodeOpen}
        onOpenChange={setPasscodeOpen}
        sectionName={section.name}
        submitting={submittingPasscode}
        onSubmit={submitJoinWithPasscode}
      />
    </div>
  );
};

export default SectionDetail;
