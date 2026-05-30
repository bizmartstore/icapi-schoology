import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_CODE, isBootstrapAdmin } from "@/lib/auth-config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AdminCodeDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== ADMIN_CODE) {
      toast.error("Invalid admin code");
      setCode("");
      return;
    }
    if (!user) {
      sessionStorage.setItem("pending_admin_grant", "true");
      onOpenChange(false);
      setCode("");
      toast.info(`Please log in with the authorized admin email to access admin.`);
      navigate("/login");
      return;
    }
    if (!isBootstrapAdmin(user.email)) {
      toast.error("Admin access is restricted to the authorized account only.");
      setCode("");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("grant_admin_role", { _user_id: user.id });
      if (error) throw error;
      await refreshProfile();
      onOpenChange(false);
      setCode("");
      toast.success("Admin access granted!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Failed to grant admin access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Admin Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Enter Admin Code</Label>
            <Input
              type="password"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Verifying..." : "Access Admin Dashboard"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCodeDialog;
