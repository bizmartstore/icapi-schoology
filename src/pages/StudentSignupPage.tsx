import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";

const StudentSignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
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

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { lastName, firstName, email, contactNumber, school, gradeLevel, schoolLevel, password, confirmPassword } = form;

    if (!lastName || !firstName || !email || !contactNumber || !school || !gradeLevel || !schoolLevel || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: contactNumber,
        user_type: "student" as const,
        school,
        grade_level: gradeLevel,
        school_level: schoolLevel as "elementary" | "junior_high_school",
      });

      if (profileError) throw profileError;

      await supabase.auth.signOut();
      toast.success("Account created! Please wait for teacher approval before logging in.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
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
          <h1 className="text-xl font-bold text-foreground">Student Sign Up</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input placeholder="Dela Cruz" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input placeholder="Juan" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input type="email" placeholder="student@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Contact Number *</Label>
            <Input placeholder="09XXXXXXXXX" value={form.contactNumber} onChange={(e) => handleChange("contactNumber", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>School *</Label>
            <Input placeholder="Your school name" value={form.school} onChange={(e) => handleChange("school", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>School Level *</Label>
            <Select value={form.schoolLevel} onValueChange={(v) => handleChange("schoolLevel", v)}>
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
            <Select value={form.gradeLevel} onValueChange={(v) => handleChange("gradeLevel", v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {form.schoolLevel === "elementary" ? (
                  <>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                  </>
                ) : form.schoolLevel === "junior_high_school" ? (
                  <>
                    <SelectItem value="Grade 7">Grade 7</SelectItem>
                    <SelectItem value="Grade 8">Grade 8</SelectItem>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                  </>
                ) : (
                  <SelectItem value="" disabled>Select school level first</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Password *</Label>
            <Input type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Confirm Password *</Label>
            <Input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} />
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Creating account..." : "Sign Up as Student"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            After signup, your account needs to be approved by a teacher before you can log in.
          </p>
        </form>
      </div>
    </div>
  );
};

export default StudentSignupPage;
