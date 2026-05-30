import { useEffect, useState, useCallback } from "react";
import heroImg from "@/assets/banner-catholic-hero.jpg";
import { Sparkles, BookOpenCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type DbBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  gradient: string | null;
  sort_order: number | null;
};

/**
 * HeroBanner — Catholic-themed hero carousel. The default school banner always
 * displays first; additional banners from the admin dashboard follow in order.
 */
const HeroBanner = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [banners, setBanners] = useState<DbBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalSlides = 1 + banners.length;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const withImages = (data || []).filter((b) => Boolean(b.image_url?.trim())) as DbBanner[];
      setBanners(withImages);
      setCurrent((prev) => Math.min(prev, withImages.length));
    };

    loadBanners();

    const channel = supabase
      .channel("hero-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        loadBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || totalSlides <= 1) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning, totalSlides],
  );

  const next = useCallback(() => {
    if (totalSlides <= 1) return;
    goTo((current + 1) % totalSlides);
  }, [current, goTo, totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, totalSlides]);

  return (
    <section className="relative overflow-hidden h-[230px] sm:h-[280px]">
      {/* Default banner — always slide 0 */}
      <div
        className={`absolute inset-0 altar-gradient transition-all duration-400 ease-out ${
          current === 0 ? "opacity-100 translate-x-0 z-10" : current > 0 ? "opacity-0 -translate-x-full z-0" : "opacity-0 translate-x-full z-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out will-change-transform"
          style={{
            backgroundImage: `url(${heroImg})`,
            transform: `translate3d(${mouse.x}px, ${mouse.y}px, 0) scale(1.06)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/55 to-primary/85" />
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[160%] h-[260px] opacity-50"
          style={{
            background: "radial-gradient(ellipse at center, hsl(45 95% 70% / 0.55) 0%, transparent 60%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-3 left-3 h-8 w-8 border-l-2 border-t-2 border-accent/60 rounded-tl-2xl" />
          <div className="absolute top-3 right-3 h-8 w-8 border-r-2 border-t-2 border-accent/60 rounded-tr-2xl" />
          <div className="absolute bottom-3 left-3 h-8 w-8 border-l-2 border-b-2 border-accent/60 rounded-bl-2xl" />
          <div className="absolute bottom-3 right-3 h-8 w-8 border-r-2 border-b-2 border-accent/60 rounded-br-2xl" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <div className="flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-accent" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent">Ad Majorem Dei Gloriam</span>
          </div>
          <h1 className="font-serif-display text-[28px] sm:text-[36px] font-bold leading-tight text-primary-foreground drop-shadow-lg">
            Lumen <span className="shimmer-gold">Sapientiae</span>
          </h1>
          <p className="text-[11px] sm:text-[12px] font-medium text-primary-foreground/85 mt-1 max-w-md">
            Faith. Knowledge. Service. — A Catholic learning community guiding minds and forming hearts.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm">
              <BookOpenCheck className="h-3 w-3 text-accent" />
              <span className="text-[10px] font-bold text-primary-foreground">DepEd Aligned</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-primary-foreground">✟ Christ-Centered</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] divine-gradient opacity-80" />
      </div>

      {/* Admin banners — slides 1..n */}
      {banners.map((banner, i) => {
        const slideIndex = i + 1;
        const isActive = current === slideIndex;
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-400 ease-out ${
              isActive ? "opacity-100 translate-x-0 z-10" : slideIndex < current ? "opacity-0 -translate-x-full z-0" : "opacity-0 translate-x-full z-0"
            }`}
          >
            {banner.image_url ? (
              <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 altar-gradient" />
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient || "from-primary/80 via-primary/50 to-primary/30"}`} />
            <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
              <h2 className="font-serif-display text-[24px] sm:text-[32px] font-bold leading-tight text-primary-foreground drop-shadow-lg">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-[11px] sm:text-[12px] font-medium text-primary-foreground/85 mt-2 max-w-md drop-shadow-md">
                  {banner.subtitle}
                </p>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] divine-gradient opacity-80" />
          </div>
        );
      })}

      {/* Carousel dots */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-5 bg-accent" : "w-1.5 bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
