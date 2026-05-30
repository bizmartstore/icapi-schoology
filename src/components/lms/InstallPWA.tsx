import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    if (standalone || dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !standalone) {
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

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setShowBanner(false);
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-md mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl p-4 card-shadow border border-primary/20 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl sacred-gradient flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Install ICAPILMS</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Tap Share, then \"Add to Home Screen\" to install the app on your phone."
                : "Add ICAPILMS to your home screen for quick access like a native app."}
            </p>
            <div className="flex gap-2 mt-3">
              {!isIOS && deferredPrompt && (
                <Button size="sm" className="rounded-xl text-xs h-8" onClick={handleInstall}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Install App
                </Button>
              )}
              {isIOS && (
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
