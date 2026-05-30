export const BOOTSTRAP_ADMIN_EMAIL = "sheethappenswithjaa@gmail.com";
export const ADMIN_CODE = "ADMIN_08";

export function isBootstrapAdmin(email: string | undefined | null) {
  return email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}
