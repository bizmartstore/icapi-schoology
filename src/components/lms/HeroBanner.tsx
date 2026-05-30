import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type DbBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  gradient: string | null;
  sort_order: number | null;
};

const hasBannerText = (banner: DbBanner) =>
  Boolean(banner.title?.trim() || banner.subtitle?.trim());

/**
 * HeroBanner — displays admin-created banners from the dashboard in a carousel.
 */
const HeroBanner = () => {
  const [banners, setBanners] = useState<DbBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const withImages = (data || []).filter((b) => Boolean(b.image_url?.trim())) as DbBanner[];
      setBanners(withImages);
      setCurrent((prev) => (withImages.length === 0 ? 0 : Math.min(prev, withImages.length - 1)));
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
      if (isTransitioning || banners.length <= 1) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning, banners.length],
  );

  const next = useCallback(() => {
    if (banners.length <= 1) return;
    goTo((current + 1) % banners.length);
  }, [current, goTo, banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="relative overflow-hidden h-[230px] sm:h-[280px]">
      {banners.map((banner, i) => {
        const isActive = current === i;
        const showTextOverlay = hasBannerText(banner);
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-400 ease-out ${
              isActive ? "opacity-100 translate-x-0 z-10" : i < current ? "opacity-0 -translate-x-full z-0" : "opacity-0 translate-x-full z-0"
            }`}
          >
            {banner.image_url ? (
              <img src={banner.image_url} alt={banner.title || "Banner"} className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? undefined : "lazy"} />
            ) : (
              <div className="absolute inset-0 altar-gradient" />
            )}
            {showTextOverlay && (
              <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient || "from-primary/80 via-primary/50 to-primary/30"}`} />
            )}
            {showTextOverlay && (
              <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                {banner.title?.trim() && (
                  <h2 className="font-serif-display text-[24px] sm:text-[32px] font-bold leading-tight text-primary-foreground drop-shadow-lg">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle?.trim() && (
                  <p className="text-[11px] sm:text-[12px] font-medium text-primary-foreground/85 mt-2 max-w-md drop-shadow-md">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] divine-gradient opacity-80" />
          </div>
        );
      })}

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {banners.map((_, i) => (
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
