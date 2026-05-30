import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  gradient: string | null;
  sort_order: number | null;
};

const hasBannerText = (banner: Banner) =>
  Boolean(banner.title?.trim() || banner.subtitle?.trim());

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const withImages = (data || []).filter((b) => Boolean(b.image_url?.trim())) as Banner[];
      setBanners(withImages);
      setCurrent((prev) => (withImages.length === 0 ? 0 : Math.min(prev, withImages.length - 1)));
    };

    loadBanners();

    const channel = supabase
      .channel("banner-carousel")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        loadBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    if (isTransitioning || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [isTransitioning, banners.length]);

  const next = useCallback(() => {
    if (banners.length === 0) return;
    goTo((current + 1) % banners.length);
  }, [current, goTo, banners.length]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative">
      <div className="relative h-[140px] overflow-hidden">
        {banners.map((banner, i) => {
          const showTextOverlay = hasBannerText(banner);
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-400 ease-out ${
                i === current ? "opacity-100 translate-x-0" : i < current ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full"
              }`}
            >
              <img
                src={banner.image_url!}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover"
                loading={i === 0 ? undefined : "lazy"}
              />
              {showTextOverlay && (
                <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient || "from-black/60 via-black/20 to-transparent"}`} />
              )}
              {showTextOverlay && (
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  {banner.title?.trim() && (
                    <h2 className="text-base font-extrabold text-primary-foreground drop-shadow-lg leading-tight">
                      {banner.title}
                    </h2>
                  )}
                  {banner.subtitle?.trim() && (
                    <p className="text-[11px] text-primary-foreground/90 drop-shadow-md mt-0.5 max-w-[75%]">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {banners.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-4 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40"}`} />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
