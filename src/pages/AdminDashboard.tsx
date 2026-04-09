import { useEffect, useState } from "react";
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
  ArrowLeft, CheckCircle2, XCircle, Clock, Users, Shield, Image, BookOpen,
  Megaphone, FileText, GraduationCap, Plus, Pencil, Trash2, Save
} from "lucide-react";

type AdminTab = "users" | "banners" | "subjects" | "announcements" | "tasks" | "lessons";

const TABS: { key: AdminTab; label: string; icon: any }[] = [
  { key: "users", label: "Users", icon: Users },
  { key: "banners", label: "Banners", icon: Image },
  { key: "subjects", label: "Subjects", icon: BookOpen },
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { roles, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(false);
  const isAdmin = roles.includes("admin");

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  // Dialog states
  const [editDialog, setEditDialog] = useState<{ open: boolean; type: AdminTab; item: any | null }>({ open: false, type: "banners", item: null });

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [u, b, s, a, t, l] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("banners").select("*").order("sort_order"),
      supabase.from("subjects").select("*").order("sort_order"),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("lessons").select("*").order("created_at", { ascending: false }),
    ]);
    setUsers(u.data || []);
    setBanners(b.data || []);
    setSubjects(s.data || []);
    setAnnouncements(a.data || []);
    setTasks(t.data || []);
    setLessons(l.data || []);
    setLoading(false);
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected", userType: string) => {
    const { error } = await supabase.from("profiles").update({ approval_status: status, approved_by: user?.id }).eq("user_id", userId);
    if (error) { toast.error("Failed"); return; }
    toast.success(`${userType} ${status}`);
    fetchAll();
  };

  const handleDelete = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Deleted");
    fetchAll();
  };

  const handleToggleActive = async (table: string, id: string, currentVal: boolean) => {
    const { error } = await supabase.from(table).update({ is_active: !currentVal }).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    fetchAll();
  };

  const openCreate = (type: AdminTab) => setEditDialog({ open: true, type, item: null });
  const openEdit = (type: AdminTab, item: any) => setEditDialog({ open: true, type, item });

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
                    <div className="flex items-start justify-between">
                      <div>
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
                              <p className="text-[10px] text-muted-foreground">{s.teacher_name} • {s.grade_level}</p>
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

            {/* ANNOUNCEMENTS TAB */}
            {tab === "announcements" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Announcements ({announcements.length})</h3>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => openCreate("announcements")}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {announcements.map((a) => (
                  <div key={a.id} className="bg-card rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                          {a.is_new && <Badge className="text-[8px] bg-destructive border-0">NEW</Badge>}
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
    </div>
  );
};

// ============ EDIT DIALOG ============
const EditDialog = ({ dialog, onClose, onSaved }: { dialog: { open: boolean; type: AdminTab; item: any | null }; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!dialog.item;

  useEffect(() => {
    if (dialog.open) {
      setForm(dialog.item || getDefaults(dialog.type));
    }
  }, [dialog.open, dialog.item]);

  const getDefaults = (type: AdminTab): Record<string, any> => {
    switch (type) {
      case "banners": return { title: "", subtitle: "", image_url: "", gradient: "from-primary/80 to-primary/40", sort_order: 0, is_active: true };
      case "subjects": return { name: "", teacher_name: "", icon_name: "BookOpen", color: "bg-subject-math", school_level: "elementary", grade_level: "Grade 4", progress: 0, sort_order: 0, is_active: true };
      case "announcements": return { title: "", from_name: "", preview_text: "", full_content: "", is_new: true, is_active: true };
      case "tasks": return { title: "", subject_name: "", due_date: "", task_type: "Assignment", is_urgent: false, is_active: true };
      case "lessons": return { subject_name: "", lesson_title: "", chapter: "", time_left: "", progress: 0, color: "bg-subject-math", is_active: true };
      default: return {};
    }
  };

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const table = dialog.type;
    const { id, created_at, updated_at, ...data } = form;

    let error;
    if (isEdit) {
      ({ error } = await supabase.from(table).update(data).eq("id", form.id));
    } else {
      ({ error } = await supabase.from(table).insert(data));
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
              <Field label="Image URL" value={form.image_url} onChange={(v) => set("image_url", v)} placeholder="https://..." />
              <Field label="Gradient" value={form.gradient} onChange={(v) => set("gradient", v)} />
              <NumberField label="Sort Order" value={form.sort_order} onChange={(v) => set("sort_order", v)} />
            </>
          )}

          {dialog.type === "subjects" && (
            <>
              <Field label="Subject Name" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Teacher Name" value={form.teacher_name} onChange={(v) => set("teacher_name", v)} />
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
              <Field label="Grade Level" value={form.grade_level} onChange={(v) => set("grade_level", v)} placeholder="e.g. Grade 4" />
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
              <NumberField label="Progress (%)" value={form.progress} onChange={(v) => set("progress", v)} />
              <NumberField label="Sort Order" value={form.sort_order} onChange={(v) => set("sort_order", v)} />
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

          <Button className="w-full rounded-xl" onClick={handleSave} disabled={saving}>
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
