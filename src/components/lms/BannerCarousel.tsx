import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, banners.length]);

  const next = useCallback(() => {
    if (banners.length === 0) return;
    goTo((current + 1) % banners.length);
  }, [current, goTo, banners.length]);

  const prev = useCallback(() => {
    if (banners.length === 0) return;
    goTo((current - 1 + banners.length) % banners.length);
  }, [current, goTo, banners.length]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="px-4">
      <div className="relative rounded-2xl overflow-hidden card-shadow group">
        <div className="relative h-[180px] sm:h-[220px]">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                i === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
            >
              <img
                src={banner.image_url || fallbackImages[i % fallbackImages.length]}
                alt={banner.title}
                className="w-full h-full object-cover"
                width={1200}
                height={512}
                loading={i === 0 ? undefined : "lazy"}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient || "from-primary/80 to-primary/40"}`} />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <h2 className="text-lg sm:text-xl font-extrabold text-primary-foreground drop-shadow-lg leading-tight mb-1">
                  {banner.title}
                </h2>
                <p className="text-xs sm:text-sm text-primary-foreground/90 drop-shadow-md max-w-[70%]">
                  {banner.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft className="h-4 w-4 text-primary-foreground" />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-primary-foreground" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;
