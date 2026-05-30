export const JOIN_PASSCODE_LENGTH = 4;

import { supabase } from "@/integrations/supabase/client";

export function isValidJoinPasscode(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export async function requestSectionJoin(sectionId: string, passcode: string) {
  const { error } = await supabase.rpc("request_section_join", {
    p_section_id: sectionId,
    p_passcode: passcode,
  });

  if (!error) return { ok: true as const };

  const message = error.message ?? "";
  if (message.includes("Invalid passcode")) {
    return { ok: false as const, reason: "invalid" as const };
  }
  if (message.includes("Request already sent") || message.includes("duplicate")) {
    return { ok: false as const, reason: "duplicate" as const };
  }
  if (message.includes("Only students")) {
    return { ok: false as const, reason: "not_student" as const };
  }
  if (message.includes("already a member")) {
    return { ok: false as const, reason: "member" as const };
  }
  return { ok: false as const, reason: "error" as const, message };
}

export async function setSectionJoinPasscode(sectionId: string, passcode: string) {
  const { error } = await supabase.rpc("set_section_join_passcode", {
    p_section_id: sectionId,
    p_passcode: passcode,
  });
  return { error };
}
