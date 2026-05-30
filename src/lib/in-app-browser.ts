/** Social / messaging in-app browsers cannot install PWAs; user must open in Safari or Chrome. */

export type InAppBrowserKind =
  | "messenger"
  | "facebook"
  | "instagram"
  | "line"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "snapchat"
  | "wechat"
  | "whatsapp"
  | "generic";

const IN_APP_UA =
  /Messenger|FB_IAB|FBAN\/|FBAV\/|FBAN;|FBAV;|Facebook|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|MicroMessenger|WeChat|WhatsApp|TikTok|BytedanceWebview/i;

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || "";
  return IN_APP_UA.test(ua);
}

export function getInAppBrowserKind(): InAppBrowserKind | null {
  if (!isInAppBrowser()) return null;

  const ua = navigator.userAgent || "";
  if (/Messenger/i.test(ua)) return "messenger";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  if (/Line\//i.test(ua)) return "line";
  if (/TikTok|BytedanceWebview/i.test(ua)) return "tiktok";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/MicroMessenger|WeChat/i.test(ua)) return "wechat";
  if (/FB_IAB|FBAN|FBAV|Facebook/i.test(ua)) return "facebook";
  return "generic";
}

export function inAppBrowserLabel(kind: InAppBrowserKind | null): string {
  switch (kind) {
    case "messenger":
      return "Messenger";
    case "facebook":
      return "Facebook";
    case "instagram":
      return "Instagram";
    case "whatsapp":
      return "WhatsApp";
    case "line":
      return "LINE";
    case "tiktok":
      return "TikTok";
    case "twitter":
      return "X (Twitter)";
    case "linkedin":
      return "LinkedIn";
    case "snapchat":
      return "Snapchat";
    case "wechat":
      return "WeChat";
    default:
      return "this app";
  }
}

/** Opens the current page in Chrome (Android). iOS must use the host app's "Open in browser" menu. */
export function openInExternalBrowser(url: string = window.location.href): boolean {
  const ua = navigator.userAgent || "";

  if (/Android/i.test(ua)) {
    try {
      const parsed = new URL(url);
      const path = `${parsed.host}${parsed.pathname}${parsed.search}`;
      const fallback = encodeURIComponent(url);
      window.location.href = `intent://${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
      return true;
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
  }

  // iOS in-app WebViews block programmatic handoff; copying helps users paste in Safari.
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(url);
  }
  return false;
}
