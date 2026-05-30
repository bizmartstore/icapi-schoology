import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, GraduationCap, BookOpen } from "lucide-react";
import { isBootstrapAdmin } from "@/lib/auth-config";

type ProfileTab = "student" | "teacher";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("student");
  const [loading, setLoading] = useState(false);

  const [studentForm, setStudentForm] = useState({
    lastName: "",
    firstName: "",
    contactNumber: "",
    school: "",
    gradeLevel: "",
    schoolLevel: "" as "" | "elementary" | "junior_high_school",
  });

  const [teacherForm, setTeacherForm] = useState({
    lastName: "",
    firstName: "",
    contactNumber: "",
    subjectTaught: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (profile) {
      navigate("/", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  if (authLoading || !user || profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
    );
  }

  const email = user.email ?? "";

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { lastName, firstName, contactNumber, school, gradeLevel, schoolLevel } = studentForm;

    if (!lastName || !firstName || !contactNumber || !school || !gradeLevel || !schoolLevel) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("create_user_profile", {
        _first_name: firstName,
        _last_name: lastName,
        _contact_number: contactNumber,
        _user_type: "student",
        _school: school,
        _grade_level: gradeLevel,
        _school_level: schoolLevel,
      });
      if (error) throw error;

      await refreshProfile();
      if (isBootstrapAdmin(email)) {
        toast.success("Admin profile saved! You can log in now.");
        navigate("/");
        return;
      }
      toast.success("Profile saved! Please wait for teacher approval before using the app.");
      navigate("/login");
      await signOut();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { lastName, firstName, contactNumber, subjectTaught } = teacherForm;

    if (!lastName || !firstName || !contactNumber || !subjectTaught) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("create_user_profile", {
        _first_name: firstName,
        _last_name: lastName,
        _contact_number: contactNumber,
        _user_type: "teacher",
        _subject_taught: subjectTaught,
      });
      if (error) throw error;

      await refreshProfile();
      if (isBootstrapAdmin(email)) {
        toast.success("Admin profile saved! You can log in now.");
        navigate("/");
        return;
      }
      toast.success("Profile saved! Please wait for admin approval before using the app.");
      navigate("/login");
      await signOut();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your account exists but profile details are missing. Fill them in to continue.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 p-1">
            <TabsTrigger value="student" className="rounded-lg text-xs font-semibold gap-1.5">
              <GraduationCap className="h-4 w-4" />
              Student
            </TabsTrigger>
            <TabsTrigger value="teacher" className="rounded-lg text-xs font-semibold gap-1.5">
              <BookOpen className="h-4 w-4" />
              Teacher
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <form onSubmit={handleStudentSubmit} className="bg-card rounded-2xl p-6 card-shadow space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={studentForm.lastName} onChange={(e) => setStudentForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={studentForm.firstName} onChange={(e) => setStudentForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input value={studentForm.contactNumber} onChange={(e) => setStudentForm((p) => ({ ...p, contactNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>School *</Label>
                <Input value={studentForm.school} onChange={(e) => setStudentForm((p) => ({ ...p, school: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>School Level *</Label>
                <Select value={studentForm.schoolLevel} onValueChange={(v) => setStudentForm((p) => ({ ...p, schoolLevel: v as typeof p.schoolLevel, gradeLevel: "" }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary</SelectItem>
                    <SelectItem value="junior_high_school">Junior High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade Level *</Label>
                <Select value={studentForm.gradeLevel} onValueChange={(v) => setStudentForm((p) => ({ ...p, gradeLevel: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentForm.schoolLevel === "elementary" ? (
                      ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))
                    ) : studentForm.schoolLevel === "junior_high_school" ? (
                      ["Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none" disabled>Select school level first</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Student Profile"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="teacher">
            <form onSubmit={handleTeacherSubmit} className="bg-card rounded-2xl p-6 card-shadow space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={teacherForm.lastName} onChange={(e) => setTeacherForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={teacherForm.firstName} onChange={(e) => setTeacherForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input value={teacherForm.contactNumber} onChange={(e) => setTeacherForm((p) => ({ ...p, contactNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Subject Taught *</Label>
                <Input value={teacherForm.subjectTaught} onChange={(e) => setTeacherForm((p) => ({ ...p, subjectTaught: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Teacher Profile"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Wrong account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline" onClick={() => signOut()}>
            Sign out
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
