import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Users, Shield } from "lucide-react";

type PendingUser = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  user_type: "student" | "teacher";
  subject_taught: string | null;
  school: string | null;
  grade_level: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [pendingTeachers, setPendingTeachers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "teacher")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });
    setPendingTeachers((pending as PendingUser[]) || []);

    const { data: all } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setAllUsers((all as PendingUser[]) || []);
    setLoading(false);
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: status, approved_by: (await supabase.auth.getUser()).data.user?.id })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`Teacher ${status === "approved" ? "approved" : "rejected"} successfully`);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Manage teacher approvals and users</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab("pending")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === "pending" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Clock className="h-4 w-4 inline mr-1" /> Pending ({pendingTeachers.length})
          </button>
          <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Users className="h-4 w-4 inline mr-1" /> All Users ({allUsers.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : tab === "pending" ? (
          pendingTeachers.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending teacher approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTeachers.map((user) => (
                <div key={user.id} className="bg-card rounded-2xl p-4 card-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{user.last_name}, {user.first_name}</h3>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Subject: {user.subject_taught || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Contact: {user.contact_number}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="rounded-xl text-xs" onClick={() => handleApproval(user.user_id, "approved")}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-xl text-xs" onClick={() => handleApproval(user.user_id, "rejected")}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {allUsers.map((user) => (
              <div key={user.id} className="bg-card rounded-2xl p-4 card-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{user.last_name}, {user.first_name}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">Type: {user.user_type}</p>
                  </div>
                  <Badge
                    variant={user.approval_status === "approved" ? "default" : user.approval_status === "rejected" ? "destructive" : "secondary"}
                    className="text-[10px] capitalize"
                  >
                    {user.approval_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
