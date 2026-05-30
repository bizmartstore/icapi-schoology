/**
 * Public Supabase client settings (safe to commit — these are exposed in the browser bundle).
 * Used when Vite env vars are missing, e.g. Lovable publish without Secrets updated.
 */
export const SUPABASE_PROJECT_REF = "mvxyqbjwnpwcovkarwqa";

export const supabasePublicConfig = {
  url: `https://${SUPABASE_PROJECT_REF}.supabase.co`,
  publishableKey: "sb_publishable_2jnq2rYzUOjVy3qBBE0zAA_oOjtd2fI",
} as const;
