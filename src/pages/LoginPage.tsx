import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, GraduationCap } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check approval status
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status, user_type")
        .eq("user_id", data.user.id)
        .single();

      if (profile && profile.approval_status !== "approved") {
        await supabase.auth.signOut();
        toast.error(
          profile.user_type === "teacher"
            ? "Your account is pending admin approval. Please wait."
            : "Your account is pending teacher approval. Please wait."
        );
        setLoading(false);
        return;
      }

      // Check if admin grant is pending
      const pendingAdmin = sessionStorage.getItem("pending_admin_grant");
      if (pendingAdmin === "true") {
        sessionStorage.removeItem("pending_admin_grant");
        const { error: rpcError } = await supabase.rpc("grant_admin_role", { _user_id: data.user.id });
        if (rpcError) {
          toast.error("Login successful but failed to grant admin: " + rpcError.message);
        } else {
          toast.success("Admin access granted!");
          navigate("/admin");
          return;
        }
      }

      toast.success("Login successful!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to EduLearn</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl p-6 card-shadow space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Don't have an account?</p>
          <div className="flex gap-3 justify-center">
            <Link to="/signup/student">
              <Button variant="outline" size="sm" className="rounded-xl">Sign up as Student</Button>
            </Link>
            <Link to="/signup/teacher">
              <Button variant="outline" size="sm" className="rounded-xl">Sign up as Teacher</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
