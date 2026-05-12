import { useEffect, useState } from "react";
import heroImg from "@/assets/banner-catholic-hero.jpg";
import { Sparkles, BookOpenCheck } from "lucide-react";

/**
 * HeroBanner — Catholic-themed hero with golden divine light, stained glass,
 * and parallax depth. Replaces the old Shopee-style banner carousel as the
 * top-most welcome panel.
 */
const HeroBanner = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative overflow-hidden h-[230px] sm:h-[280px] altar-gradient">
      {/* Background image with subtle parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${heroImg})`,
          transform: `translate3d(${mouse.x}px, ${mouse.y}px, 0) scale(1.06)`,
        }}
      />
      {/* Dark navy gradient overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/55 to-primary/85" />
      {/* Golden glow rays from top */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[160%] h-[260px] opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(45 95% 70% / 0.55) 0%, transparent 60%)",
        }}
      />
      {/* Decorative gothic arches frame (top corners) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-3 left-3 h-8 w-8 border-l-2 border-t-2 border-accent/60 rounded-tl-2xl" />
        <div className="absolute top-3 right-3 h-8 w-8 border-r-2 border-t-2 border-accent/60 rounded-tr-2xl" />
        <div className="absolute bottom-3 left-3 h-8 w-8 border-l-2 border-b-2 border-accent/60 rounded-bl-2xl" />
        <div className="absolute bottom-3 right-3 h-8 w-8 border-r-2 border-b-2 border-accent/60 rounded-br-2xl" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        <div className="flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-sm animate-fade-in">
          <Sparkles className="h-3 w-3 text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
            Ad Majorem Dei Gloriam
          </span>
        </div>
        <h1 className="font-serif-display text-[28px] sm:text-[36px] font-bold leading-tight text-primary-foreground drop-shadow-lg animate-fade-in">
          Lumen <span className="shimmer-gold">Sapientiae</span>
        </h1>
        <p className="text-[11px] sm:text-[12px] font-medium text-primary-foreground/85 mt-1 max-w-md animate-fade-in">
          Faith. Knowledge. Service. — A Catholic learning community guiding minds and forming hearts.
        </p>
        <div className="flex items-center gap-2 mt-3 animate-fade-in">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm">
            <BookOpenCheck className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-bold text-primary-foreground">DepEd Aligned</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-primary-foreground">✟ Christ-Centered</span>
          </div>
        </div>
      </div>

      {/* Bottom golden accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] divine-gradient opacity-80" />
    </section>
  );
};

export default HeroBanner;