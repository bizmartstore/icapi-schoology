import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, Phone, School, GraduationCap, ShieldCheck, Calendar, ListChecks, Share2, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressToAvatarDataUrl } from "@/lib/avatar-image";

const ProfilePopover = () => {
  const { profile, roles, signOut, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = profile ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}` : "?";
  const roleLabel = roles.includes("admin") ? "Admin" : roles.includes("teacher") ? "Teacher" : "Student";
  const avatarSrc = profile?.avatar_data || undefined;

  const handleAvatarChange = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const avatarData = await compressToAvatarDataUrl(file);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_data: avatarData })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="h-7 w-7 border-2 border-primary-foreground/30 ml-1 cursor-pointer">
          <AvatarImage src={avatarSrc} alt="Profile" />
          <AvatarFallback className="bg-primary-foreground text-primary text-[10px] font-bold">{initials}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[300px] p-0 overflow-hidden">
        <div className="sacred-gradient px-4 py-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14 border-2 border-accent/60">
              <AvatarImage src={avatarSrc} alt="Profile" />
              <AvatarFallback className="bg-primary-foreground text-primary text-lg font-extrabold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center border-2 border-primary shadow-sm"
              aria-label="Change profile photo"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleAvatarChange(f);
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-serif-display text-base font-bold text-primary-foreground leading-tight truncate">
              {profile ? `${profile.first_name} ${profile.last_name}` : "Guest"}
            </p>
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40 text-[9px] font-bold uppercase tracking-wider text-accent">
              <ShieldCheck className="h-2.5 w-2.5" /> {roleLabel}
            </span>
          </div>
        </div>
        {profile && (
          <div className="p-3 space-y-1.5 bg-card">
            <Row icon={<Mail className="h-3.5 w-3.5" />} label={profile.email} />
            {profile.contact_number && <Row icon={<Phone className="h-3.5 w-3.5" />} label={profile.contact_number} />}
            {profile.school && <Row icon={<School className="h-3.5 w-3.5" />} label={profile.school} />}
            {profile.grade_level && <Row icon={<GraduationCap className="h-3.5 w-3.5" />} label={`Grade ${profile.grade_level}`} />}
            <p className="text-[9px] text-muted-foreground pt-1">Tap the camera icon to upload a photo (compressed, no extra storage quota).</p>
          </div>
        )}
        <div className="px-3 pb-2 grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => navigate("/calendar")}>
            <Calendar className="h-3.5 w-3.5 mr-1" /> Calendar
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => navigate("/grades")}>
            <ListChecks className="h-3.5 w-3.5 mr-1" /> Grades
          </Button>
          {roles.includes("admin") && (
            <Button variant="outline" size="sm" className="col-span-2 h-8 text-[11px] font-bold" onClick={() => navigate("/admin")}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Admin Dashboard
            </Button>
          )}
        </div>
        <div className="px-3 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-[11px] font-bold"
            onClick={async () => {
              const u = new URL(window.location.href);
              u.searchParams.set("guest", "1");
              const link = u.toString();
              try {
                await navigator.clipboard.writeText(link);
                toast.success("Share link copied — recipient will start signed out");
              } catch {
                toast.info(link);
              }
            }}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Copy Share Link
          </Button>
        </div>
        <div className="px-3 pb-3">
          <Button variant="destructive" size="sm" className="w-full h-8 text-[11px] font-bold" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Row = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 text-[11px] text-foreground">
    <span className="text-primary">{icon}</span>
    <span className="truncate">{label}</span>
  </div>
);

export default ProfilePopover;
