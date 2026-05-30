import { useEffect, useState } from "react";
import { Download, X, Share, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getInAppBrowserKind,
  inAppBrowserLabel,
  isInAppBrowser,
  openInExternalBrowser,
} from "@/lib/in-app-browser";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [inAppKind, setInAppKind] = useState<ReturnType<typeof getInAppBrowserKind>>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const inApp = isInAppBrowser();
    setInAppBrowser(inApp);
    setInAppKind(getInAppBrowserKind());

    if (standalone || dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari and in-app browsers (Messenger, etc.) never get beforeinstallprompt.
    if ((ios && !standalone) || inApp) {
      setShowBanner(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleOpenInBrowser = () => {
    const opened = openInExternalBrowser();
    if (!opened && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(window.location.href).then(() => {
        setLinkCopied(true);
        window.setTimeout(() => setLinkCopied(false), 2500);
      });
    }
  };

  const handleCopyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setShowBanner(false);
  };

  if (!showBanner || isStandalone) return null;

  const appLabel = inAppBrowserLabel(inAppKind);
  const needsExternalBrowser = inAppBrowser && !deferredPrompt;

  const description = needsExternalBrowser
    ? isIOS
      ? `Links opened in ${appLabel} can't install apps. Tap ⋯ (menu) → Open in Safari, then Share → Add to Home Screen.`
      : `Links opened in ${appLabel} can't install apps. Open this page in Chrome, then tap Install App.`
    : isIOS
      ? 'Tap Share, then "Add to Home Screen" to install the app on your phone.'
      : "Add iCAPI LMS to your home screen for quick access like a native app.";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-md mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl p-4 card-shadow border border-primary/20 shadow-lg">
        <div className="flex items-start gap-3">
          <img
            src="/icapi-logo.png"
            alt="iCAPI LMS"
            className="h-10 w-10 object-contain shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Install iCAPI LMS</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {needsExternalBrowser && !isIOS && (
                <Button size="sm" className="rounded-xl text-xs h-8" onClick={handleOpenInBrowser}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open in Chrome
                </Button>
              )}
              {needsExternalBrowser && (
                <Button
                  size="sm"
                  variant={needsExternalBrowser && isIOS ? "default" : "outline"}
                  className="rounded-xl text-xs h-8"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy link
                    </>
                  )}
                </Button>
              )}
              {!needsExternalBrowser && !isIOS && deferredPrompt && (
                <Button size="sm" className="rounded-xl text-xs h-8" onClick={handleInstall}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Install App
                </Button>
              )}
              {!needsExternalBrowser && isIOS && (
                <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                  <Share className="h-3.5 w-3.5" />
                  Share → Add to Home Screen
                </div>
              )}
              <Button size="sm" variant="ghost" className="rounded-xl text-xs h-8" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
