export const PWA_INSTALL_QUERY = "pwa_install";
export const PWA_PENDING_SESSION_KEY = "pwa-pending-install";
export const PWA_DISMISS_STORAGE_KEY = "pwa-install-dismissed";
export const PWA_DISMISS_INAPP_KEY = "pwa-install-dismissed-inapp";
export const PWA_PROMPT_READY_EVENT = "pwa-install-prompt-ready";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

/** Call once before React mounts so we never miss a fast beforeinstallprompt. */
export function initPwaInstallPromptCapture(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(PWA_PROMPT_READY_EVENT));
  });
}

export function getCapturedInstallPrompt(): BeforeInstallPromptEvent | undefined {
  return window.__pwaInstallPrompt;
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOSDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

export function isAndroidMobile(): boolean {
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua) && /Mobile/i.test(ua);
}

export function hasForceInstallIntent(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get(PWA_INSTALL_QUERY) === "1") return true;
  return sessionStorage.getItem(PWA_PENDING_SESSION_KEY) === "1";
}

export function markPendingInstallAfterExternal(): void {
  sessionStorage.setItem(PWA_PENDING_SESSION_KEY, "1");
}

export function withPwaInstallQuery(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(PWA_INSTALL_QUERY, "1");
  return parsed.toString();
}

/** Strip ?pwa_install=1 from the address bar without reloading. */
export function cleanPwaInstallQueryFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(PWA_INSTALL_QUERY)) return;
  params.delete(PWA_INSTALL_QUERY);
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
}

export function isInstallBannerDismissed(inApp: boolean, forceInstall: boolean): boolean {
  if (forceInstall) return false;
  if (inApp) return sessionStorage.getItem(PWA_DISMISS_INAPP_KEY) === "1";
  return localStorage.getItem(PWA_DISMISS_STORAGE_KEY) === "1";
}

export function dismissInstallBanner(inApp: boolean): void {
  if (inApp) {
    sessionStorage.setItem(PWA_DISMISS_INAPP_KEY, "1");
  } else {
    localStorage.setItem(PWA_DISMISS_STORAGE_KEY, "1");
  }
}

export function shouldOfferInstallBanner(inApp: boolean, forceInstall: boolean): boolean {
  if (isStandaloneDisplay()) return false;
  if (isInstallBannerDismissed(inApp, forceInstall)) return false;
  return isIOSDevice() || inApp || isAndroidMobile() || forceInstall;
}
