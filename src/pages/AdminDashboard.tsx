import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Users, Shield, Image, BookOpen,
  Megaphone, FileText, GraduationCap, Plus, Pencil, Trash2, Save, UserCheck, X, School,
  Upload, Loader2, Copy,
} from "lucide-react";

type AdminTab = "users" | "banners" | "subjects" | "assignments" | "sections" | "announcements" | "tasks" | "lessons";

const TABS: { key: AdminTab; label: string; icon: any }[] = [
  { key: "users", label: "Users", icon: Users },
  { key: "banners", label: "Banners", icon: Image },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "assignments", label: "Assign", icon: UserCheck },
  { key: "sections", label: "Sections", icon: School },
  { key: "announcements", label: "Announce", icon: Megaphone },
  { key: "tasks", label: "Tasks", icon: FileText },
  { key: "lessons", label: "Lessons", icon: GraduationCap },
];

const COLOR_OPTIONS = [
  { value: "bg-subject-math", label: "Blue (Math)" },
  { value: "bg-subject-english", label: "Pink (English)" },
  { value: "bg-subject-science", label: "Green (Science)" },
  { value: "bg-subject-filipino", label: "Orange (Filipino)" },
  { value: "bg-subject-ap", label: "Purple (AP)" },
  { value: "bg-subject-mapeh", label: "Red (MAPEH)" },
  { value: "bg-subject-tle", label: "Teal (TLE)" },
];

const ICON_OPTIONS = ["Calculator", "BookText", "FlaskConical", "Languages", "Globe2", "Music", "Wrench", "BookOpen", "Lightbulb", "Palette"];

const ALL_GRADES = Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`);

const gradeToSchoolLevel = (gradeLabel: string): "elementary" | "junior_high_school" => {
  const num = parseInt(gradeLabel.replace(/\D/g, ""), 10);
  return num <= 6 ? "elementary" : "junior_high_school";
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { roles, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(false);
  const isAdmin = roles.includes("admin");

  const [users, setUsers] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionSubjects, setSectionSubjects] = useState<any[]>([]);

  const [editDialog, setEditDialog] = useState<{ open: boolean; type: AdminTab; item: any | null }>({ open: false, type: "banners", item: null });
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState<{ teacher_id: string; subject_id: string }>({ teacher_id: "", subject_id: "" });
  const [bulkCopyGrade, setBulkCopyGrade] = useState("Grade 1");
  const [bulkCopying, setBulkCopying] = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [u, b, s, a, t, l, ts, sec, ss] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("banners").select("*").order("sort_order"),
      supabase.from("subjects").select("*").order("sort_order"),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("lessons").select("*").order("created_at", { ascending: false }),
      supabase.from("teacher_subjects").select("*").order("created_at", { ascending: false }),
      supabase.from("sections").select("*").order("created_at", { ascending: false }),
      supabase.from("section_subjects").select("*"),
    ]);
    setUsers(u.data || []);
    setBanners(b.data || []);
    setSubjects(s.data || []);
    setAnnouncements(a.data || []);
    setTasks(t.data || []);
    setLessons(l.data || []);
    setTeacherSubjects(ts.data || []);
    setSections(sec.data || []);
    setSectionSubjects(ss.data || []);
    setLoading(false);
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected", userType: string) => {
    const { error } = await supabase.from("profiles").update({ approval_status: status, approved_by: user?.id }).eq("user_id", userId);
    if (error) { toast.error("Failed"); return; }
    toast.success(`${userType} ${status}`);
    fetchAll();
  };

  const handleDelete = async (table: "banners" | "subjects" | "announcements" | "tasks" | "lessons", id: string) => {
    const { error } = await (supabase.from(table) as any).delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Deleted");
    fetchAll();
  };

  const handleToggleActive = async (table: "banners" | "subjects" | "announcements" | "tasks" | "lessons", id: string, currentVal: boolean) => {
    const { error } = await (supabase.from(table) as any).update({ is_active: !currentVal }).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    fetchAll();
  };

  const openCreate = (type: AdminTab) => setEditDialog({ open: true, type, item: null });
  const openEdit = (type: AdminTab, item: any) => setEditDialog({ open: true, type, item });

  const teachers = users.filter((u) => u.user_type === "teacher" && u.approval_status === "approved");

  const createAssignment = async () => {
    if (!assignForm.teacher_id || !assignForm.subject_id) {
      toast.error("Pick a teacher and a subject");
      return;
    }
    const { error } = await supabase.from("teacher_subjects").insert(assignForm);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already assigned" : error.message);
      return;
    }
    toast.success("Subject assigned to teacher");
    setAssignForm({ teacher_id: "", subject_id: "" });
    setAssignDialog(false);
    fetchAll();
  };

  const removeAssignment = async (id: string) => {
    const { error } = await supabase.from("teacher_subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Assignment removed");
    fetchAll();
  };

  const bulkCopySubjectsToAllGrades = async () => {
    const sourceSubjects = subjects.filter((s) => s.grade_level === bulkCopyGrade);
    if (sourceSubjects.length === 0) {
      toast.error(`No subjects found for ${bulkCopyGrade}. Add subjects to this grade first.`);
      return;
    }

    setBulkCopying(true);
    const existingKeys = new Set(subjects.map((s) => `${s.name.toLowerCase()}|${s.grade_level}`));
    const toInsert: {
      name: string;
      icon_name: string;
      color: string;
      school_level: "elementary" | "junior_high_school";
      grade_level: string;
      sort_order: number;
      is_active: boolean;
    }[] = [];

    for (const targetGrade of ALL_GRADES) {
      for (const src of sourceSubjects) {
        const key = `${src.name.toLowerCase()}|${targetGrade}`;
        if (existingKeys.has(key)) continue;
        toInsert.push({
          name: src.name,
          icon_name: src.icon_name || "BookOpen",
          color: src.color || "bg-subject-math",
          school_level: gradeToSchoolLevel(targetGrade),
          grade_level: targetGrade,
          sort_order: src.sort_order ?? 0,
          is_active: true,
        });
        existingKeys.add(key);
      }
    }

    if (toInsert.length === 0) {
      setBulkCopying(false);
      toast.info("All subjects from this grade already exist across Grades 1–10.");
      return;
    }

    const { error } = await supabase.from("subjects").insert(toInsert);
    setBulkCopying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Added ${toInsert.length} subject(s) across Grades 1–10 from ${bulkCopyGrade}.`);
    fetchAll();
  };

  const updateSectionSubjectTeacher = async (ssId: string, teacherId: string) => {
    const { error } = await supabase
      .from("section_subjects")
      .update({ teacher_id: teacherId })
      .eq("id", ssId);
    if (error) return toast.error(error.message);
    toast.success("Subject teacher assigned");
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary via-primary to-primary/90 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Shield className="h-5 w-5 text-accent" />
          <div>
            <h1 className="text-lg font-extrabold text-primary-foreground">Admin Dashboard</h1>
            <p className="text-[10px] text-primary-foreground/60">Manage all content & users</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground card-shadow"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : (
          <>
            {/* USERS TAB */}
            {tab === "users" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">All Users ({users.length})</h3>
                {users.map((u) => (
                  <div key={u.id} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{u.last_name}, {u.first_name}</h3>
                        <p className="text-[11px] text-muted-foreground">{u.email} • {u.user_type}</p>
                        {u.subject_taught && <p className="text-[11px] text-muted-foreground">Subject: {u.subject_taught}</p>}
                        {u.school && <p className="text-[11px] text-muted-foreground">School: {u.school} | {u.grade_level}</p>}
                      </div>
                      <Badge variant={u.approval_status === "approved" ? "default" : u.approval_status === "rejected" ? "destructive" : "secondary"} className="text-[9px] capitalize">
                        {u.approval_status}
                      </Badge>
                    </div>
                    {u.approval_status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="rounded-xl text-[11px] h-7" onClick={() => handleApproval(u.user_id, "approved", u.user_type)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-xl text-[11px] h-7" onClick={() => handleApproval(u.user_id, "rejected", u.user_type)}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* BANNERS TAB */}
            {tab === "banners" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Banners ({banners.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => openCreate("banners")}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {banners.map((b) => (
                  <div key={b.id} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between gap-3">
                      {b.image_url ? (
                        <img src={b.image_url} alt={b.title} className="h-14 w-24 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-14 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                        <p className="text-[11px] text-muted-foreground">{b.subtitle}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Order: {b.sort_order}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch checked={b.is_active} onCheckedChange={() => handleToggleActive("banners", b.id, b.is_active)} />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit("banners", b)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete("banners", b.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBJECTS TAB */}
            {tab === "subjects" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Subjects ({subjects.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => openCreate("subjects")}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-2">
                  Tip: assign teachers to subjects in the <span className="font-bold text-primary">Assign</span> tab.
                </p>
                <div className="bg-muted/30 rounded-2xl p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5 text-primary" /> Copy Subjects to All Grades
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Select a grade whose subjects you want to replicate, then copy them to Grades 1–10 (skips duplicates).
                  </p>
                  <div className="flex gap-2">
                    <Select value={bulkCopyGrade} onValueChange={setBulkCopyGrade}>
                      <SelectTrigger className="rounded-xl h-9 text-sm flex-1">
                        <SelectValue placeholder="Source grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_GRADES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="rounded-xl text-xs whitespace-nowrap"
                      onClick={bulkCopySubjectsToAllGrades}
                      disabled={bulkCopying}
                    >
                      {bulkCopying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy All
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {subjects.filter((s) => s.grade_level === bulkCopyGrade).length} subject(s) in {bulkCopyGrade}
                  </p>
                </div>
                {["elementary", "junior_high_school"].map((level) => (
                  <div key={level}>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3">
                      {level === "elementary" ? "📚 Elementary" : "🎓 Junior High School"}
                    </h4>
                    {subjects.filter((s) => s.school_level === level).map((s) => (
                      <div key={s.id} className="bg-card rounded-2xl p-3 card-shadow mb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg ${s.color} flex items-center justify-center`}>
                              <BookOpen className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="text-[13px] font-bold text-foreground">{s.name}</h3>
                              <p className="text-[10px] text-muted-foreground">{s.grade_level}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch checked={s.is_active} onCheckedChange={() => handleToggleActive("subjects", s.id, s.is_active)} />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit("subjects", s)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete("subjects", s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* ASSIGNMENTS TAB */}
            {tab === "assignments" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Teacher → Subject ({teacherSubjects.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => setAssignDialog(true)} disabled={teachers.length === 0 || subjects.length === 0}>
                    <Plus className="h-3 w-3 mr-1" /> Assign
                  </Button>
                </div>
                {teachers.length === 0 && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                    No approved teachers yet. Approve a teacher in the Users tab first.
                  </p>
                )}
                {teachers.map((t) => {
                  const myAssignments = teacherSubjects
                    .filter((ts) => ts.teacher_id === t.user_id)
                    .map((ts) => ({ ...ts, subject: subjects.find((s) => s.id === ts.subject_id) }))
                    .filter((ts) => ts.subject);
                  return (
                    <div key={t.user_id} className="bg-card rounded-2xl p-3 card-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                          <span className="text-xs font-extrabold text-primary">{t.first_name?.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{t.last_name}, {t.first_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{t.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {myAssignments.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground italic">No subjects assigned</p>
                        ) : (
                          myAssignments.map((ts) => (
                            <span key={ts.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                              {ts.subject.name}
                              <button onClick={() => removeAssignment(ts.id)} className="hover:bg-primary/20 rounded-full p-0.5">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SECTIONS TAB - admin assigns subject teachers per section */}
            {tab === "sections" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">Advisory Sections ({sections.length})</h3>
                <p className="text-[10px] text-muted-foreground -mt-2">
                  Only admins can assign subject teachers to a section. Advisers cannot change these.
                </p>
                {sections.length === 0 && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                    No sections have been created by advisers yet.
                  </p>
                )}
                {sections.map((sec) => {
                  const adv = users.find((u) => u.user_id === sec.teacher_id);
                  const items = sectionSubjects
                    .filter((ss) => ss.section_id === sec.id)
                    .map((ss) => ({ ...ss, subject: subjects.find((s) => s.id === ss.subject_id) }))
                    .filter((ss) => ss.subject);
                  return (
                    <div key={sec.id} className="bg-card rounded-2xl p-3 card-shadow space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{sec.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {sec.grade_level} · Adviser: {adv ? `${adv.first_name} ${adv.last_name}` : "—"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px]">{items.length} subj</Badge>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">No subjects in this section.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {items.map((ss: any) => {
                            const currentTeacher = users.find((u) => u.user_id === ss.teacher_id);
                            return (
                              <div key={ss.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40">
                                <div className={`h-7 w-7 rounded-lg ${ss.subject.color} flex items-center justify-center flex-shrink-0`}>
                                  <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate">{ss.subject.name}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">
                                    Teacher: {currentTeacher ? `${currentTeacher.first_name} ${currentTeacher.last_name}` : "Unassigned"}
                                  </p>
                                </div>
                                <Select
                                  value={ss.teacher_id || ""}
                                  onValueChange={(v) => updateSectionSubjectTeacher(ss.id, v)}
                                >
                                  <SelectTrigger className="h-7 text-[10px] w-[120px] rounded-lg">
                                    <SelectValue placeholder="Assign" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.length === 0 ? (
                                      <SelectItem value="__none" disabled>No approved teachers</SelectItem>
                                    ) : (
                                      teachers.map((t) => (
                                        <SelectItem key={t.user_id} value={t.user_id} className="text-xs">
                                          {t.last_name}, {t.first_name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {tab === "announcements" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Announcements ({announcements.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => openCreate("announcements")}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-2">
                  Admin announcements are <span className="font-bold">general</span> and visible to everyone.
                </p>
                {announcements.map((a) => (
                  <div key={a.id} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                          {a.is_new && <Badge className="text-[8px] bg-destructive border-0">NEW</Badge>}
                          <Badge variant="outline" className="text-[8px]">{a.scope || "general"}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{a.from_name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{a.preview_text}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch checked={a.is_active} onCheckedChange={() => handleToggleActive("announcements", a.id, a.is_active)} />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit("announcements", a)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete("announcements", a.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TASKS TAB */}
            {tab === "tasks" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Tasks ({tasks.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => openCreate("tasks")}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {tasks.map((t) => (
                  <div key={t.id} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                        <p className="text-[11px] text-muted-foreground">{t.subject_name} • {t.task_type}</p>
                        <p className="text-[11px] text-muted-foreground">Due: {t.due_date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {t.is_urgent && <Badge variant="destructive" className="text-[8px]">URGENT</Badge>}
                        <Switch checked={t.is_active} onCheckedChange={() => handleToggleActive("tasks", t.id, t.is_active)} />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit("tasks", t)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete("tasks", t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LESSONS TAB */}
            {tab === "lessons" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Lessons ({lessons.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => openCreate("lessons")}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {lessons.map((l) => (
                  <div key={l.id} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{l.lesson_title}</h3>
                        <p className="text-[11px] text-muted-foreground">{l.subject_name} • {l.chapter}</p>
                        <p className="text-[11px] text-muted-foreground">{l.time_left} • {l.progress}%</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch checked={l.is_active} onCheckedChange={() => handleToggleActive("lessons", l.id, l.is_active)} />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit("lessons", l)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete("lessons", l.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <EditDialog dialog={editDialog} onClose={() => setEditDialog({ ...editDialog, open: false })} onSaved={fetchAll} />

      {/* Assignment Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Assign Subject to Teacher</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Teacher</Label>
              <Select value={assignForm.teacher_id} onValueChange={(v) => setAssignForm({ ...assignForm, teacher_id: v })}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Pick a teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.user_id} value={t.user_id}>
                      {t.last_name}, {t.first_name} ({t.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Select value={assignForm.subject_id} onValueChange={(v) => setAssignForm({ ...assignForm, subject_id: v })}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Pick a subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.grade_level || s.school_level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-xl" onClick={createAssignment}>
              <Save className="h-4 w-4 mr-1" /> Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ EDIT DIALOG ============
const EditDialog = ({ dialog, onClose, onSaved }: { dialog: { open: boolean; type: AdminTab; item: any | null }; onClose: () => void; onSaved: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!dialog.item;

  useEffect(() => {
    if (dialog.open) setForm(dialog.item || getDefaults(dialog.type));
  }, [dialog.open, dialog.item, dialog.type]);

  const getDefaults = (type: AdminTab): Record<string, any> => {
    switch (type) {
      case "banners": return { title: "", subtitle: "", image_url: "", gradient: "from-primary/80 to-primary/40", sort_order: 0, is_active: true };
      case "subjects": return { name: "", icon_name: "BookOpen", color: "bg-subject-math", school_level: "elementary", grade_level: "Grade 4", sort_order: 0, is_active: true };
      case "announcements": return { title: "", from_name: "", preview_text: "", full_content: "", is_new: true, is_active: true, scope: "general" };
      case "tasks": return { title: "", subject_name: "", due_date: "", task_type: "Assignment", is_urgent: false, is_active: true };
      case "lessons": return { subject_name: "", lesson_title: "", chapter: "", time_left: "", progress: 0, color: "bg-subject-math", is_active: true };
      default: return {};
    }
  };

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const uploadBannerFile = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, GIF, or WebP)");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    if (!user) {
      toast.error("You must be signed in to upload");
      return;
    }
    setUploading(true);
    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, f, { upsert: true, contentType: f.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    set("image_url", data.publicUrl);
    setUploading(false);
    if (bannerFileRef.current) bannerFileRef.current.value = "";
    toast.success("Banner image ready — save to publish");
  };

  const onBannerFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void uploadBannerFile(f);
  };

  const onBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void uploadBannerFile(f);
  };

  const handleSave = async () => {
    const table = dialog.type as "banners" | "subjects" | "announcements" | "tasks" | "lessons";

    if (table === "banners") {
      if (uploading) {
        toast.error("Please wait for the image upload to finish");
        return;
      }
      if (!form.image_url?.trim()) {
        toast.error("Please upload a banner image");
        return;
      }
    }

    setSaving(true);
    const { id, created_at, updated_at, ...data } = form;

    // Force admin announcements to general scope (RLS lets admins insert anything; keep tidy)
    if (table === "announcements") {
      data.scope = "general";
      data.section_id = null;
    }

    let error;
    if (isEdit) {
      ({ error } = await (supabase.from(table) as any).update(data).eq("id", form.id));
    } else {
      ({ error } = await (supabase.from(table) as any).insert(data));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Updated!" : "Created!");
    onClose();
    onSaved();
  };

  return (
    <Dialog open={dialog.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{isEdit ? "Edit" : "Create"} {dialog.type.slice(0, -1)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {dialog.type === "banners" && (
            <>
              <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
              <Field label="Subtitle" value={form.subtitle} onChange={(v) => set("subtitle", v)} />
              <div className="space-y-1.5">
                <Label className="text-xs">Banner Image *</Label>
                <p className="text-[10px] text-muted-foreground">
                  Upload an image to show in the home page hero carousel (max 5MB).
                </p>
                <input
                  ref={bannerFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={onBannerFileInput}
                />
                <button
                  type="button"
                  onClick={() => !uploading && bannerFileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onBannerDrop}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:opacity-60"
                >
                  {form.image_url ? (
                    <img src={form.image_url} alt="Banner preview" className="w-full h-36 object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-muted-foreground">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-8 w-8" />
                      )}
                      <span className="text-xs font-semibold">
                        {uploading ? "Uploading…" : "Tap or drag an image here"}
                      </span>
                      <span className="text-[10px]">JPG, PNG, GIF, WebP</span>
                    </div>
                  )}
                </button>
                {form.image_url && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl text-xs"
                      onClick={() => bannerFileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      Replace image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-xs text-destructive"
                      onClick={() => set("image_url", "")}
                      disabled={uploading}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              <Field label="Gradient" value={form.gradient} onChange={(v) => set("gradient", v)} placeholder="from-primary/80 via-primary/50 to-primary/30" />
              <NumberField label="Sort Order" value={form.sort_order} onChange={(v) => set("sort_order", v)} />
            </>
          )}

          {dialog.type === "subjects" && (
            <>
              <Field label="Subject Name" value={form.name} onChange={(v) => set("name", v)} />
              <div className="space-y-1.5">
                <Label className="text-xs">School Level</Label>
                <Select value={form.school_level} onValueChange={(v) => set("school_level", v)}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary</SelectItem>
                    <SelectItem value="junior_high_school">Junior High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Grade Level</Label>
                <Select value={form.grade_level} onValueChange={(v) => {
                  set("grade_level", v);
                  set("school_level", gradeToSchoolLevel(v));
                }}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {ALL_GRADES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Icon</Label>
                <Select value={form.icon_name} onValueChange={(v) => set("icon_name", v)}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Select value={form.color} onValueChange={(v) => set("color", v)}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <NumberField label="Sort Order" value={form.sort_order} onChange={(v) => set("sort_order", v)} />
              <p className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg p-2">
                💡 Teacher is assigned via the <span className="font-bold text-primary">Assign</span> tab — no need to type a teacher name here.
              </p>
            </>
          )}

          {dialog.type === "announcements" && (
            <>
              <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
              <Field label="From" value={form.from_name} onChange={(v) => set("from_name", v)} placeholder="e.g. School Admin" />
              <div className="space-y-1.5">
                <Label className="text-xs">Preview Text</Label>
                <Textarea className="rounded-xl text-sm" value={form.preview_text || ""} onChange={(e) => set("preview_text", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Full Content</Label>
                <Textarea className="rounded-xl text-sm" rows={4} value={form.full_content || ""} onChange={(e) => set("full_content", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_new} onCheckedChange={(v) => set("is_new", v)} />
                <Label className="text-xs">Mark as NEW</Label>
              </div>
            </>
          )}

          {dialog.type === "tasks" && (
            <>
              <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
              <Field label="Subject" value={form.subject_name} onChange={(v) => set("subject_name", v)} />
              <Field label="Due Date" value={form.due_date} onChange={(v) => set("due_date", v)} placeholder="e.g. Jan 15, 3:00 PM" />
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={form.task_type} onValueChange={(v) => set("task_type", v)}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_urgent} onCheckedChange={(v) => set("is_urgent", v)} />
                <Label className="text-xs">Mark as Urgent</Label>
              </div>
            </>
          )}

          {dialog.type === "lessons" && (
            <>
              <Field label="Subject Name" value={form.subject_name} onChange={(v) => set("subject_name", v)} />
              <Field label="Lesson Title" value={form.lesson_title} onChange={(v) => set("lesson_title", v)} />
              <Field label="Chapter" value={form.chapter} onChange={(v) => set("chapter", v)} placeholder="e.g. Q2 - Module 3" />
              <Field label="Time Left" value={form.time_left} onChange={(v) => set("time_left", v)} placeholder="e.g. 15 min" />
              <NumberField label="Progress (%)" value={form.progress} onChange={(v) => set("progress", v)} />
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Select value={form.color} onValueChange={(v) => set("color", v)}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            className="w-full rounded-xl"
            onClick={handleSave}
            disabled={saving || uploading || (dialog.type === "banners" && !form.image_url?.trim())}
          >
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============ FIELD HELPERS ============
const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <Input className="rounded-xl h-9 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <Input className="rounded-xl h-9 text-sm" type="number" value={value ?? 0} onChange={(e) => onChange(parseInt(e.target.value) || 0)} />
  </div>
);

export default AdminDashboard;
