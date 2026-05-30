import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import LMSHeader from "@/components/lms/LMSHeader";

type StudentProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  school: string | null;
  grade_level: string | null;
  school_level: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
};

const TeacherApprovalPage = () => {
  const navigate = useNavigate();
  const { roles, user } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<StudentProfile[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  const isTeacher = roles.includes("teacher");

  useEffect(() => {
    if (!isTeacher) {
      navigate("/");
      return;
    }
    fetchStudents();
  }, [isTeacher]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: pending } = await api
      .from("profiles")
      .select("*")
      .eq("user_type", "student")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });
    setPendingStudents((pending as StudentProfile[]) || []);

    const { data: approved } = await api
      .from("profiles")
      .select("*")
      .eq("user_type", "student")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });
    setApprovedStudents((approved as StudentProfile[]) || []);
    setLoading(false);
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await api
      .from("profiles")
      .update({ approval_status: status, approved_by: user?.id })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`Student ${status === "approved" ? "approved" : "rejected"} successfully`);
    fetchStudents();
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Student Approvals</h1>
            <p className="text-xs text-muted-foreground">Approve or reject student signups</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTab("pending")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === "pending" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Clock className="h-4 w-4 inline mr-1" /> Pending ({pendingStudents.length})
          </button>
          <button onClick={() => setTab("approved")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === "approved" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Users className="h-4 w-4 inline mr-1" /> Approved ({approvedStudents.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : tab === "pending" ? (
          pendingStudents.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending student approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingStudents.map((student) => (
                <div key={student.id} className="bg-card rounded-2xl p-4 card-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{student.last_name}, {student.first_name}</h3>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                      <p className="text-xs text-muted-foreground">School: {student.school || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Grade: {student.grade_level || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Contact: {student.contact_number}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="rounded-xl text-xs" onClick={() => handleApproval(student.user_id, "approved")}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-xl text-xs" onClick={() => handleApproval(student.user_id, "rejected")}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {approvedStudents.map((student) => (
              <div key={student.id} className="bg-card rounded-2xl p-4 card-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{student.last_name}, {student.first_name}</h3>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                    <p className="text-xs text-muted-foreground">School: {student.school || "N/A"} | Grade: {student.grade_level || "N/A"}</p>
                  </div>
                  <Badge className="text-[10px]">Approved</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherApprovalPage;
