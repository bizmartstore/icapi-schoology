import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const ADMIN_CODE = "ADMIN_08";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AdminCodeDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      onOpenChange(false);
      setCode("");
      navigate("/admin");
    } else {
      toast.error("Invalid admin code");
      setCode("");
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
          <Button type="submit" className="w-full rounded-xl">Access Admin Dashboard</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCodeDialog;
