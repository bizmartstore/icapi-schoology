import { useEffect, useState } from "react";
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
import { ArrowLeft, Plus, Users, CheckCircle2, XCircle, Clock, Trash2, Pencil, GraduationCap, School } from "lucide-react";
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

type JoinRequest = {
  id: string;
  section_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  created_at: string;
  student?: { first_name: string; last_name: string; email: string; grade_level: string | null };
  section?: { name: string };
};

const COLOR_OPTIONS = [
  { value: "from-primary to-primary/70", label: "Orange" },
  { value: "from-subject-math to-subject-math/70", label: "Blue" },
  { value: "from-subject-english to-subject-english/70", label: "Pink" },
  { value: "from-subject-science to-subject-science/70", label: "Green" },
  { value: "from-subject-ap to-subject-ap/70", label: "Purple" },
  { value: "from-subject-mapeh to-subject-mapeh/70", label: "Red" },
];

const TeacherSectionsPage = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isTeacher = roles.includes("teacher");
  const [tab, setTab] = useState<"sections" | "requests" | "members">("sections");
  const [sections, setSections] = useState<Section[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<Partial<Section>>({});

  useEffect(() => {
    if (!isTeacher) {
      navigate("/");
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, user?.id]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data: sectionData } = await supabase
      .from("sections")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    setSections((sectionData as Section[]) || []);

    const sectionIds = (sectionData || []).map((s: any) => s.id);
    if (sectionIds.length) {
      const { data: reqData } = await supabase
        .from("section_join_requests")
        .select("*")
        .in("section_id", sectionIds)
        .order("created_at", { ascending: false });
      const reqs = (reqData as JoinRequest[]) || [];
      // hydrate student + section
      const studentIds = [...new Set(reqs.map((r) => r.student_id))];
      const { data: students } = studentIds.length
        ? await supabase.from("profiles").select("user_id, first_name, last_name, email, grade_level").in("user_id", studentIds)
        : { data: [] as any[] };
      const studentMap: Record<string, any> = {};
      (students || []).forEach((s: any) => (studentMap[s.user_id] = s));
      const sectionMap: Record<string, any> = {};
      (sectionData || []).forEach((s: any) => (sectionMap[s.id] = s));
      setRequests(reqs.map((r) => ({ ...r, student: studentMap[r.student_id], section: sectionMap[r.section_id] })));

      const { data: memData } = await supabase
        .from("section_members")
        .select("*")
        .in("section_id", sectionIds)
        .order("joined_at", { ascending: false });
      const studentIds2 = [...new Set((memData || []).map((m: any) => m.student_id))];
      const { data: memStudents } = studentIds2.length
        ? await supabase.from("profiles").select("user_id, first_name, last_name, email, grade_level").in("user_id", studentIds2)
        : { data: [] as any[] };
      const memMap: Record<string, any> = {};
      (memStudents || []).forEach((s: any) => (memMap[s.user_id] = s));
      setMembers((memData || []).map((m: any) => ({ ...m, student: memMap[m.student_id], section: sectionMap[m.section_id] })));
    } else {
      setRequests([]);
      setMembers([]);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", grade_level: "", school_level: "junior_high_school", color: "from-primary to-primary/70", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (s: Section) => {
    setEditing(s);
    setForm(s);
    setDialogOpen(true);
  };

  const saveSection = async () => {
    if (!form.name?.trim()) {
      toast.error("Section name is required");
      return;
    }
    if (editing) {
      const { error } = await supabase.from("sections").update({
        name: form.name,
        description: form.description,
        grade_level: form.grade_level,
        school_level: form.school_level,
        cover_image_url: form.cover_image_url,
        color: form.color,
        is_active: form.is_active,
      }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Section updated");
    } else {
      const { error } = await supabase.from("sections").insert({
        teacher_id: user!.id,
        name: form.name!,
        description: form.description || null,
        grade_level: form.grade_level || null,
        school_level: (form.school_level as any) || null,
        cover_image_url: form.cover_image_url || null,
        color: form.color || null,
      });
      if (error) return toast.error(error.message);
      toast.success("Section created");
    }
    setDialogOpen(false);
    fetchAll();
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Delete this section? Members and requests will be removed.")) return;
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
            <h1 className="text-xl font-bold text-foreground">My Sections</h1>
            <p className="text-xs text-muted-foreground">Create and manage your advisory sections</p>
          </div>
          <Button size="sm" className="rounded-xl text-xs font-bold" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Section
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: "sections", label: "Sections", icon: School, count: sections.length },
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
        ) : tab === "sections" ? (
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
                    <div className="flex gap-2">
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
        ) : tab === "requests" ? (
          requests.length === 0 ? (
            <EmptyState icon={<Clock className="h-10 w-10" />} title="No requests" desc="Student join requests will appear here" />
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-card rounded-2xl p-4 card-shadow border border-border/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">
                        {r.student ? `${r.student.last_name}, ${r.student.first_name}` : "Student"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{r.student?.email}</p>
                      <p className="text-[11px] text-muted-foreground">Grade: {r.student?.grade_level || "—"}</p>
                      <p className="text-[11px] text-primary font-semibold mt-1">→ {r.section?.name}</p>
                    </div>
                    <Badge
                      variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}
                      className="text-[9px]"
                    >
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
                  <p className="text-sm font-bold text-foreground">
                    {m.student ? `${m.student.last_name}, ${m.student.first_name}` : "Student"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.student?.email} · {m.section?.name}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive hover:text-destructive" onClick={() => removeMember(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Section" : "Create Section"}</DialogTitle>
          </DialogHeader>
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

export default TeacherSectionsPage;
