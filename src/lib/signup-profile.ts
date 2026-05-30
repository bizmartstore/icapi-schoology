import { supabase } from "@/integrations/supabase/client";
import { isBootstrapAdmin } from "@/lib/auth-config";

export type SignupProfilePayload = {
  first_name: string;
  last_name: string;
  contact_number: string;
  user_type: "student" | "teacher";
  school?: string | null;
  grade_level?: string | null;
  school_level?: "elementary" | "junior_high_school" | null;
  subject_taught?: string | null;
};

export async function signUpWithProfile(email: string, password: string, profile: SignupProfilePayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        contact_number: profile.contact_number,
        user_type: profile.user_type,
        school: profile.school ?? null,
        grade_level: profile.grade_level ?? null,
        school_level: profile.school_level ?? null,
        subject_taught: profile.subject_taught ?? null,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("Signup failed");

  if (data.session) {
    const { error: profileError } = await supabase.rpc("create_user_profile", {
      _first_name: profile.first_name,
      _last_name: profile.last_name,
      _contact_number: profile.contact_number,
      _user_type: profile.user_type,
      _school: profile.school ?? null,
      _grade_level: profile.grade_level ?? null,
      _school_level: profile.school_level ?? null,
      _subject_taught: profile.subject_taught ?? null,
    });
    if (profileError) throw profileError;
  }

  if (isBootstrapAdmin(email) && data.session) {
    await supabase.rpc("grant_admin_role", { _user_id: data.user.id });
  }

  return data;
}

export async function ensureBootstrapAdmin(userId: string, email: string | undefined | null) {
  if (!isBootstrapAdmin(email)) return;

  await supabase.rpc("grant_admin_role", { _user_id: userId });
  await supabase
    .from("profiles")
    .update({ approval_status: "approved" })
    .eq("user_id", userId);
}
