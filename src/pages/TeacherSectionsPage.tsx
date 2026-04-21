import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Users, CheckCircle2, XCircle, Clock, Trash2, Pencil,
  School, BookOpen, CalendarClock, Megaphone, Briefcase, ListChecks, X, Save,
} from "lucide-react";
import { toast } from "sonner";
import LMSHeader from "@/components/lms/LMSHeader";

type Section = {
  id: string;
  name: string;
  description: string | null;
  grade_level: string | null;
  school_level: "elementary" | "junior_high_school" | null;
  cover_image_url: string | null;
  color: string | null;
  is_active: boolean;
};

const COLOR_OPTIONS = [
  { value: "from-primary to-primary/70", label: "Orange" },
  { value: "from-subject-math to-subject-math/70", label: "Blue" },
  { value: "from-subject-english to-subject-english/70", label: "Pink" },
  { value: "from-subject-science to-subject-science/70", label: "Green" },
  { value: "from-subject-ap to-subject-ap/70", label: "Purple" },
  { value: "from-subject-mapeh to-subject-mapeh/70", label: "Red" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TeacherSectionsPage = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isTeacher = roles.includes("teacher");

  const [tab, setTab] = useState<"advisory" | "teaching" | "requests" | "members">("advisory");
  const [sections, setSections] = useState<Section[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Section dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<Partial<Section>>({});

  // Curriculum dialog (Subjects + Schedule + Announcements per section)
  const [curOpen, setCurOpen] = useState<Section | null>(null);

  // My teaching data
  const [mySectionSubjects, setMySectionSubjects] = useState<any[]>([]);
  const [mySchedules, setMySchedules] = useState<any[]>([]);

  useEffect(() => {
    if (!isTeacher) { navigate("/"); return; }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, user?.id]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("teacher-dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "section_join_requests" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "section_members" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "section_subjects" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "class_schedules" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data: sectionData } = await supabase
      .from("sections").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
    const list = (sectionData as Section[]) || [];
    setSections(list);

    const sectionIds = list.map((s) => s.id);

    const [reqRes, memRes, mySubsRes] = await Promise.all([
      sectionIds.length
        ? supabase.from("section_join_requests").select("*").in("section_id", sectionIds).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      sectionIds.length
        ? supabase.from("section_members").select("*").in("section_id", sectionIds).order("joined_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("section_subjects").select("*").eq("teacher_id", user.id),
    ]);

    const reqs = (reqRes.data as any[]) || [];
    const mems = (memRes.data as any[]) || [];

    // hydrate students
    const allStudentIds = [...new Set([...reqs.map((r) => r.student_id), ...mems.map((m) => m.student_id)])];
    const { data: students } = allStudentIds.length
      ? await supabase.from("profiles").select("user_id, first_name, last_name, email, grade_level").in("user_id", allStudentIds)
      : { data: [] as any[] };
    const studentMap: Record<string, any> = {};
    (students || []).forEach((s: any) => (studentMap[s.user_id] = s));
    const sectionMap: Record<string, any> = {};
    list.forEach((s) => (sectionMap[s.id] = s));

    setRequests(reqs.map((r) => ({ ...r, student: studentMap[r.student_id], section: sectionMap[r.section_id] })));
    setMembers(mems.map((m) => ({ ...m, student: studentMap[m.student_id], section: sectionMap[m.section_id] })));

    // My teaching: subjects assigned to me across any section
    const mySubs = (mySubsRes.data as any[]) || [];
    const subjectIds = [...new Set(mySubs.map((s) => s.subject_id))];
    const teachingSectionIds = [...new Set(mySubs.map((s) => s.section_id))];
    const [{ data: subjectRows }, { data: teachingSections }, { data: schedules }] = await Promise.all([
      subjectIds.length ? supabase.from("subjects").select("*").in("id", subjectIds) : Promise.resolve({ data: [] as any[] }),
      teachingSectionIds.length ? supabase.from("sections").select("*").in("id", teachingSectionIds) : Promise.resolve({ data: [] as any[] }),
      mySubs.length ? supabase.from("class_schedules").select("*").in("section_subject_id", mySubs.map((s) => s.id)) : Promise.resolve({ data: [] as any[] }),
    ]);
    const subjMap: Record<string, any> = {};
    (subjectRows || []).forEach((s: any) => (subjMap[s.id] = s));
    const secMap: Record<string, any> = {};
    (teachingSections || []).forEach((s: any) => (secMap[s.id] = s));
    setMySectionSubjects(mySubs.map((m) => ({ ...m, subject: subjMap[m.subject_id], section: secMap[m.section_id] })));
    setMySchedules(schedules || []);

    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", grade_level: "", school_level: "junior_high_school", color: "from-primary to-primary/70", is_active: true });
    setDialogOpen(true);
  };
  const openEdit = (s: Section) => { setEditing(s); setForm(s); setDialogOpen(true); };

  const saveSection = async () => {
    if (!form.name?.trim()) { toast.error("Section name is required"); return; }
    if (editing) {
      const { error } = await supabase.from("sections").update({
        name: form.name, description: form.description, grade_level: form.grade_level,
        school_level: form.school_level, cover_image_url: form.cover_image_url, color: form.color, is_active: form.is_active,
      }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Section updated");
    } else {
      const { error } = await supabase.from("sections").insert({
        teacher_id: user!.id, name: form.name!, description: form.description || null,
        grade_level: form.grade_level || null, school_level: (form.school_level as any) || null,
        cover_image_url: form.cover_image_url || null, color: form.color || null,
      });
      if (error) return toast.error(error.message);
      toast.success("Section created");
    }
    setDialogOpen(false);
    fetchAll();
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Delete this section? Members, requests, subjects and schedules will be removed.")) return;
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Section deleted");
    fetchAll();
  };

  const reviewRequest = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("section_join_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Request ${status}`);
    fetchAll();
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this student from the section?")) return;
    const { error } = await supabase.from("section_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    fetchAll();
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage advisory sections and your teaching load</p>
          </div>
          <Button size="sm" className="rounded-xl text-xs font-bold" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Section
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: "advisory", label: "Advisory", icon: School, count: sections.length },
            { key: "teaching", label: "My Teaching", icon: Briefcase, count: mySectionSubjects.length },
            { key: "requests", label: "Requests", icon: Clock, count: pendingCount },
            { key: "members", label: "Members", icon: Users, count: members.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Loading...</div>
        ) : tab === "advisory" ? (
          sections.length === 0 ? (
            <EmptyState icon={<School className="h-10 w-10" />} title="No sections yet" desc="Create your first advisory section to get started" />
          ) : (
            <div className="grid gap-3">
              {sections.map((s) => (
                <div key={s.id} className="bg-card rounded-2xl overflow-hidden card-shadow border border-border/50">
                  <div className={`h-20 bg-gradient-to-br ${s.color || "from-primary to-primary/70"} relative`}>
                    {s.cover_image_url && <img src={s.cover_image_url} alt={s.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-primary-foreground drop-shadow">{s.name}</h3>
                        {s.grade_level && <p className="text-[10px] text-primary-foreground/90 font-medium">{s.grade_level}</p>}
                      </div>
                      {!s.is_active && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="rounded-lg text-[11px] h-8" onClick={() => setCurOpen(s)}>
                        <ListChecks className="h-3 w-3 mr-1" /> Curriculum
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-8 text-destructive hover:text-destructive" onClick={() => deleteSection(s.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "teaching" ? (
          mySectionSubjects.length === 0 ? (
            <EmptyState icon={<Briefcase className="h-10 w-10" />} title="No teaching assignments" desc="Section advisers will add you to their sections for the subjects an admin assigned to you." />
          ) : (
            <div className="space-y-4">
              {/* Group by section */}
              {(Object.entries(
                mySectionSubjects.reduce((acc: Record<string, { section: any; items: any[] }>, ss) => {
                  const k = ss.section_id;
                  if (!acc[k]) acc[k] = { section: ss.section, items: [] };
                  acc[k].items.push(ss);
                  return acc;
                }, {})
              ) as [string, { section: any; items: any[] }][]).map(([sid, group]) => (
                <div key={sid} className="space-y-2">
                  <div className={`bg-gradient-to-br ${group.section?.color || "from-primary to-primary/70"} rounded-2xl p-3 text-primary-foreground`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Section</p>
                    <h3 className="text-base font-extrabold">{group.section?.name}</h3>
                    <p className="text-[10px] opacity-90">{group.items.length} subject{group.items.length === 1 ? "" : "s"} assigned to you</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {group.items.map((ss) => {
                      const slots = mySchedules.filter((sc) => sc.section_subject_id === ss.id).sort((a, b) => a.day_of_week - b.day_of_week || (a.start_time > b.start_time ? 1 : -1));
                      return (
                        <button
                          key={ss.id}
                          onClick={() => navigate(`/teach/${ss.id}`)}
                          className="bg-card rounded-2xl p-3 card-shadow border border-border/50 text-left hover:shadow-lg active:scale-[0.98] transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`h-9 w-9 rounded-lg ${ss.subject?.color || "bg-primary"} flex items-center justify-center`}>
                              <BookOpen className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-extrabold text-foreground line-clamp-1">{ss.subject?.name}</h4>
                              <p className="text-[10px] text-muted-foreground">Tap to manage</p>
                            </div>
                          </div>
                          {slots.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">No schedule yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {slots.slice(0, 3).map((sl) => (
                                <span key={sl.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  <CalendarClock className="h-2 w-2" />
                                  {DAYS[sl.day_of_week]} {sl.start_time?.slice(0, 5)}
                                </span>
                              ))}
                              {slots.length > 3 && <span className="text-[9px] text-muted-foreground">+{slots.length - 3}</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "requests" ? (
          requests.length === 0 ? (
            <EmptyState icon={<Clock className="h-10 w-10" />} title="No requests" desc="Student join requests will appear here" />
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-card rounded-2xl p-4 card-shadow border border-border/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{r.student ? `${r.student.last_name}, ${r.student.first_name}` : "Student"}</h3>
                      <p className="text-[11px] text-muted-foreground">{r.student?.email}</p>
                      <p className="text-[11px] text-muted-foreground">Grade: {r.student?.grade_level || "—"}</p>
                      <p className="text-[11px] text-primary font-semibold mt-1">→ {r.section?.name}</p>
                    </div>
                    <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"} className="text-[9px]">
                      {r.status}
                    </Badge>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="rounded-lg text-[11px] h-8" onClick={() => reviewRequest(r.id, "approved")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg text-[11px] h-8" onClick={() => reviewRequest(r.id, "rejected")}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : members.length === 0 ? (
          <EmptyState icon={<Users className="h-10 w-10" />} title="No members yet" desc="Approved students will appear here" />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="bg-card rounded-xl p-3 card-shadow border border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{m.student ? `${m.student.last_name}, ${m.student.first_name}` : "Student"}</p>
                  <p className="text-[11px] text-muted-foreground">{m.student?.email} · {m.section?.name}</p>
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive hover:text-destructive" onClick={() => removeMember(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Section" : "Create Section"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Section Name *</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 10 - Rizal" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description for students" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Grade Level</Label>
                <Input value={form.grade_level || ""} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} placeholder="Grade 10" />
              </div>
              <div>
                <Label className="text-xs">School Level</Label>
                <Select value={form.school_level || ""} onValueChange={(v) => setForm({ ...form, school_level: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary</SelectItem>
                    <SelectItem value="junior_high_school">Junior High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Cover Image URL (optional)</Label>
              <Input value={form.cover_image_url || ""} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">Color Theme</Label>
              <Select value={form.color || ""} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-xl font-bold" onClick={saveSection}>
              {editing ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Curriculum (Subjects + Schedule + Announcements) */}
      <SectionCurriculumDialog
        section={curOpen}
        onClose={() => setCurOpen(null)}
        onChanged={fetchAll}
      />
    </div>
  );
};

const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
    <div className="text-muted-foreground mx-auto mb-3 flex justify-center">{icon}</div>
    <p className="text-sm font-bold text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
  </div>
);

// =================== Curriculum Dialog ===================
type Teacher = { user_id: string; first_name: string; last_name: string; email: string };
type Subject = { id: string; name: string; grade_level: string | null };

const SectionCurriculumDialog = ({ section, onClose, onChanged }: { section: Section | null; onClose: () => void; onChanged: () => void }) => {
  const { user } = useAuth();
  const [view, setView] = useState<"subjects" | "announcements">("subjects");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [sectionSubjects, setSectionSubjects] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Schedule add
  const [schedFor, setSchedFor] = useState<string | null>(null);
  const [day, setDay] = useState("1");
  const [startT, setStartT] = useState("08:00");
  const [endT, setEndT] = useState("09:00");
  const [room, setRoom] = useState("");

  // Announcement compose
  const [annTitle, setAnnTitle] = useState("");
  const [annText, setAnnText] = useState("");

  useEffect(() => {
    if (!section) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id]);

  const load = async () => {
    if (!section) return;
    const [t, s, ts, ss, ann] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, email").eq("user_type", "teacher").eq("approval_status", "approved"),
      supabase.from("subjects").select("id, name, grade_level").eq("is_active", true).order("sort_order"),
      supabase.from("teacher_subjects").select("*"),
      supabase.from("section_subjects").select("*").eq("section_id", section.id),
      supabase.from("announcements").select("*").eq("section_id", section.id).eq("scope", "section").order("created_at", { ascending: false }),
    ]);
    setTeachers((t.data as Teacher[]) || []);
    setAllSubjects((s.data as Subject[]) || []);
    setTeacherSubjects(ts.data || []);
    setSectionSubjects(ss.data || []);
    setAnnouncements(ann.data || []);

    const ssIds = (ss.data || []).map((x: any) => x.id);
    if (ssIds.length) {
      const { data: sched } = await supabase.from("class_schedules").select("*").in("section_subject_id", ssIds);
      setSchedules(sched || []);
    } else setSchedules([]);
  };

  // Subjects matching this section's grade level (auto-populated from curriculum)
  const curriculumSubjects = useMemo(() => {
    if (!section) return [];
    const gl = (section.grade_level || "").trim().toLowerCase();
    if (!gl) return allSubjects;
    return allSubjects.filter((s) => {
      const sgl = (s.grade_level || "").trim().toLowerCase();
      return !sgl || sgl === gl;
    });
  }, [section, allSubjects]);

  // Teachers admin-assigned to a given subject
  const teachersForSubject = (subjectId: string): Teacher[] => {
    const ids = teacherSubjects.filter((ts) => ts.subject_id === subjectId).map((ts) => ts.teacher_id);
    return teachers.filter((t) => ids.includes(t.user_id));
  };

  const assignTeacherToSubject = async (subjectId: string, teacherId: string) => {
    if (!section) return;
    const existing = sectionSubjects.find((x) => x.subject_id === subjectId);
    if (existing) {
      if (existing.teacher_id === teacherId) return;
      const { error } = await supabase.from("section_subjects").update({ teacher_id: teacherId }).eq("id", existing.id);
      if (error) return toast.error(error.message);
      toast.success("Teacher updated");
    } else {
      const { error } = await supabase.from("section_subjects").insert({
        section_id: section.id, subject_id: subjectId, teacher_id: teacherId,
      });
      if (error) return toast.error(error.message);
      toast.success("Teacher assigned");
    }
    load(); onChanged();
  };

  const removeSectionSubject = async (id: string) => {
    if (!confirm("Remove this subject and its schedule from the section?")) return;
    const { error } = await supabase.from("section_subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load(); onChanged();
  };

  const addSchedule = async (sectionSubjectId: string) => {
    if (startT >= endT) { toast.error("End time must be after start time"); return; }
    const { error } = await supabase.from("class_schedules").insert({
      section_subject_id: sectionSubjectId,
      day_of_week: parseInt(day), start_time: startT, end_time: endT, room: room || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Schedule added");
    setSchedFor(null); setRoom("");
    load(); onChanged();
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from("class_schedules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load(); onChanged();
  };

  const postAnnouncement = async () => {
    if (!section || !user) return;
    if (!annTitle.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("announcements").insert({
      title: annTitle, preview_text: annText.slice(0, 100), full_content: annText,
      from_name: "Section Adviser", scope: "section", section_id: section.id,
      created_by: user.id, is_new: true, is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Announcement posted");
    setAnnTitle(""); setAnnText("");
    load();
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (!section) return null;

  return (
    <Dialog open={!!section} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{section.name} — Curriculum</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          {[
            { key: "subjects", label: "Subjects & Schedule", icon: BookOpen },
            { key: "announcements", label: "Announcements", icon: Megaphone },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key as any)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                view === v.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <v.icon className="h-3 w-3" /> {v.label}
            </button>
          ))}
        </div>

        {view === "subjects" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
              <p className="text-[11px] font-bold text-foreground">
                Auto-loaded curriculum for {section.grade_level || "this section"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Pick an admin-assigned teacher per subject. The list updates dynamically as Admins assign teachers.
              </p>
            </div>

            {curriculumSubjects.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">
                No curriculum subjects found for this grade level. Ask Admin to add subjects.
              </p>
            ) : (
              curriculumSubjects.map((subj) => {
                const ss = sectionSubjects.find((x) => x.subject_id === subj.id);
                const eligibleTeachers = teachersForSubject(subj.id);
                const slots = ss ? schedules.filter((sc) => sc.section_subject_id === ss.id).sort((a, b) => a.day_of_week - b.day_of_week) : [];
                return (
                  <div key={subj.id} className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground line-clamp-1">{subj.name}</p>
                        {subj.grade_level && <p className="text-[10px] text-muted-foreground">{subj.grade_level}</p>}
                      </div>
                      {ss && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive flex-shrink-0" onClick={() => removeSectionSubject(ss.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Teacher picker (admin-assigned, dynamic) */}
                    <div className="mb-2">
                      <Label className="text-[10px] text-muted-foreground">Teacher (admin-assigned)</Label>
                      {eligibleTeachers.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic mt-1">
                          No teacher assigned by admin yet for this subject.
                        </p>
                      ) : (
                        <Select
                          value={ss?.teacher_id || ""}
                          onValueChange={(v) => assignTeacherToSubject(subj.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleTeachers.map((t) => (
                              <SelectItem key={t.user_id} value={t.user_id}>
                                {t.last_name}, {t.first_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Schedule (only after a teacher is assigned) */}
                    {ss && (
                      <>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {slots.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground italic">No schedule</span>
                          ) : slots.map((sl) => (
                            <span key={sl.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {DAYS[sl.day_of_week]} {sl.start_time?.slice(0, 5)}–{sl.end_time?.slice(0, 5)}{sl.room && ` · ${sl.room}`}
                              <button onClick={() => deleteSchedule(sl.id)} className="hover:bg-primary/20 rounded-full p-0.5">
                                <X className="h-2 w-2" />
                              </button>
                            </span>
                          ))}
                        </div>
                        {schedFor === ss.id ? (
                          <div className="grid grid-cols-4 gap-1 items-end">
                            <Select value={day} onValueChange={setDay}>
                              <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input type="time" value={startT} onChange={(e) => setStartT(e.target.value)} className="h-7 text-[10px]" />
                            <Input type="time" value={endT} onChange={(e) => setEndT(e.target.value)} className="h-7 text-[10px]" />
                            <Input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} className="h-7 text-[10px]" />
                            <div className="col-span-4 flex gap-1">
                              <Button size="sm" className="flex-1 h-7 text-[10px] rounded-lg" onClick={() => addSchedule(ss.id)}>
                                <Save className="h-2.5 w-2.5 mr-1" /> Save slot
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setSchedFor(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="rounded-lg h-7 text-[10px] w-full" onClick={() => setSchedFor(ss.id)}>
                            <CalendarClock className="h-3 w-3 mr-1" /> Add schedule slot
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === "announcements" && (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
              <Input placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="h-8 text-xs" />
              <Textarea placeholder="Message to your section…" value={annText} onChange={(e) => setAnnText(e.target.value)} rows={3} className="text-xs" />
              <Button size="sm" className="w-full rounded-lg text-xs h-8" onClick={postAnnouncement}>
                <Megaphone className="h-3 w-3 mr-1" /> Post to section
              </Button>
            </div>
            {announcements.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">No section announcements yet.</p>
            ) : announcements.map((a) => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{a.full_content || a.preview_text}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteAnnouncement(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeacherSectionsPage;
