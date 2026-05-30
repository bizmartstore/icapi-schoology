import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, ArrowLeft, GraduationCap, BookOpen } from "lucide-react";
import { signUpWithProfile } from "@/lib/signup-profile";
import { isBootstrapAdmin } from "@/lib/auth-config";

type SignupTab = "student" | "teacher";

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("type") === "teacher" ? "teacher" : "student";
  const [activeTab, setActiveTab] = useState<SignupTab>(initialTab);
  const [loading, setLoading] = useState(false);

  const [studentForm, setStudentForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    contactNumber: "",
    school: "",
    gradeLevel: "",
    schoolLevel: "" as "" | "elementary" | "junior_high_school",
    password: "",
    confirmPassword: "",
  });

  const [teacherForm, setTeacherForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    contactNumber: "",
    subjectTaught: "",
    password: "",
    confirmPassword: "",
  });

  const handleTabChange = (value: string) => {
    const tab = value as SignupTab;
    setActiveTab(tab);
    setSearchParams({ type: tab }, { replace: true });
  };

  const handleStudentChange = (field: string, value: string) => {
    setStudentForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "schoolLevel") next.gradeLevel = "";
      return next;
    });
  };

  const handleTeacherChange = (field: string, value: string) => {
    setTeacherForm((prev) => ({ ...prev, [field]: value }));
  };

  const validatePasswords = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { lastName, firstName, email, contactNumber, school, gradeLevel, schoolLevel, password, confirmPassword } = studentForm;

    if (!lastName || !firstName || !email || !contactNumber || !school || !gradeLevel || !schoolLevel || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!validatePasswords(password, confirmPassword)) return;

    setLoading(true);
    try {
      await signUpWithProfile(email, password, {
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        user_type: "student",
        school,
        grade_level: gradeLevel,
        school_level: schoolLevel,
      });

      await supabase.auth.signOut();
      toast.success(
        isBootstrapAdmin(email)
          ? "Admin account created! You can log in now."
          : "Account created! Please wait for teacher approval before logging in."
      );
      navigate("/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { lastName, firstName, email, contactNumber, subjectTaught, password, confirmPassword } = teacherForm;

    if (!lastName || !firstName || !email || !contactNumber || !subjectTaught || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!validatePasswords(password, confirmPassword)) return;

    setLoading(true);
    try {
      await signUpWithProfile(email, password, {
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        user_type: "teacher",
        subject_taught: subjectTaught,
      });

      await supabase.auth.signOut();
      toast.success(
        isBootstrapAdmin(email)
          ? "Admin account created! You can log in now."
          : "Account created! Please wait for admin approval before logging in."
      );
      navigate("/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Create Account</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input placeholder="Dela Cruz" value={studentForm.lastName} onChange={(e) => handleStudentChange("lastName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input placeholder="Juan" value={studentForm.firstName} onChange={(e) => handleStudentChange("firstName", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="student@email.com" value={studentForm.email} onChange={(e) => handleStudentChange("email", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input placeholder="09XXXXXXXXX" value={studentForm.contactNumber} onChange={(e) => handleStudentChange("contactNumber", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>School *</Label>
                <Input placeholder="Your school name" value={studentForm.school} onChange={(e) => handleStudentChange("school", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>School Level *</Label>
                <Select value={studentForm.schoolLevel} onValueChange={(v) => handleStudentChange("schoolLevel", v)}>
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
                <Select value={studentForm.gradeLevel} onValueChange={(v) => handleStudentChange("gradeLevel", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentForm.schoolLevel === "elementary" ? (
                      <>
                        <SelectItem value="Grade 1">Grade 1</SelectItem>
                        <SelectItem value="Grade 2">Grade 2</SelectItem>
                        <SelectItem value="Grade 3">Grade 3</SelectItem>
                        <SelectItem value="Grade 4">Grade 4</SelectItem>
                        <SelectItem value="Grade 5">Grade 5</SelectItem>
                        <SelectItem value="Grade 6">Grade 6</SelectItem>
                      </>
                    ) : studentForm.schoolLevel === "junior_high_school" ? (
                      <>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="__none" disabled>Select school level first</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="At least 6 characters" value={studentForm.password} onChange={(e) => handleStudentChange("password", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input type="password" placeholder="Re-enter password" value={studentForm.confirmPassword} onChange={(e) => handleStudentChange("confirmPassword", e.target.value)} />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Creating account..." : "Sign Up as Student"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                After signup, your account needs to be approved by a teacher before you can log in.
              </p>
            </form>
          </TabsContent>

          <TabsContent value="teacher">
            <form onSubmit={handleTeacherSubmit} className="bg-card rounded-2xl p-6 card-shadow space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input placeholder="Santos" value={teacherForm.lastName} onChange={(e) => handleTeacherChange("lastName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input placeholder="Maria" value={teacherForm.firstName} onChange={(e) => handleTeacherChange("firstName", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="teacher@email.com" value={teacherForm.email} onChange={(e) => handleTeacherChange("email", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input placeholder="09XXXXXXXXX" value={teacherForm.contactNumber} onChange={(e) => handleTeacherChange("contactNumber", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Subject Taught *</Label>
                <Input placeholder="e.g. Mathematics, Science" value={teacherForm.subjectTaught} onChange={(e) => handleTeacherChange("subjectTaught", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="At least 6 characters" value={teacherForm.password} onChange={(e) => handleTeacherChange("password", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input type="password" placeholder="Re-enter password" value={teacherForm.confirmPassword} onChange={(e) => handleTeacherChange("confirmPassword", e.target.value)} />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Creating account..." : "Sign Up as Teacher"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                After signup, your account needs to be approved by an admin before you can log in.
              </p>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
