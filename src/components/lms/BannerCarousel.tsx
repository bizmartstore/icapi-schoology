import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

const fallbackImages = [banner1, banner2, banner3];

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  gradient: string | null;
  sort_order: number | null;
};

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    supabase.from("banners").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data && data.length > 0) setBanners(data as Banner[]);
    });
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
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-400 ease-out ${
              i === current ? "opacity-100 translate-x-0" : i < current ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full"
            }`}
          >
            <img
              src={banner.image_url || fallbackImages[i % fallbackImages.length]}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading={i === 0 ? undefined : "lazy"}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient || "from-black/60 via-black/20 to-transparent"}`} />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <h2 className="text-base font-extrabold text-primary-foreground drop-shadow-lg leading-tight">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-[11px] text-primary-foreground/90 drop-shadow-md mt-0.5 max-w-[75%]">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
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
