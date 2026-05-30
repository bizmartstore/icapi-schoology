import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type EventItem = {
  id: string;
  title: string;
  content: string | null;
  image_data: string | null;
  sort_order: number | null;
};

type EventCarouselProps = {
  /** Taller slides for the dedicated Events page */
  variant?: "compact" | "full";
  className?: string;
};

const EventCarousel = ({ variant = "compact", className = "" }: EventCarouselProps) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [open, setOpen] = useState<EventItem | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, content, image_data, sort_order")
      .eq("is_active", true)
      .order("sort_order");
    const withImages = (data || []).filter((e) => Boolean(e.image_data?.trim())) as EventItem[];
    setEvents(withImages);
    setCurrent((prev) => (withImages.length === 0 ? 0 : Math.min(prev, withImages.length - 1)));
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("events-carousel")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || events.length <= 1) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning, events.length],
  );

  const next = useCallback(() => {
    if (events.length <= 1) return;
    goTo((current + 1) % events.length);
  }, [current, goTo, events.length]);

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, events.length]);

  if (events.length === 0) return null;

  const heightClass = variant === "full" ? "h-[220px] sm:h-[280px]" : "h-[160px]";

  return (
    <div className={className}>
      <div className={`relative overflow-hidden rounded-xl ${heightClass}`}>
        {events.map((event, i) => {
          const isActive = current === i;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => setOpen(event)}
              className={`absolute inset-0 w-full h-full text-left transition-all duration-400 ease-out ${
                isActive
                  ? "opacity-100 translate-x-0 z-10"
                  : i < current
                    ? "opacity-0 -translate-x-full z-0"
                    : "opacity-0 translate-x-full z-0"
              }`}
            >
              <img
                src={event.image_data!}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? undefined : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
                {event.title?.trim() && (
                  <h3 className="text-sm sm:text-base font-extrabold text-primary-foreground drop-shadow-lg leading-tight line-clamp-2">
                    {event.title}
                  </h3>
                )}
                {event.content?.trim() && variant === "full" && (
                  <p className="text-[10px] sm:text-[11px] text-primary-foreground/90 mt-1 line-clamp-2 drop-shadow-md">
                    {event.content}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {events.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                aria-label={`Go to event ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-5 bg-accent" : "w-1.5 bg-primary-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          {open && (
            <>
              {open.image_data && (
                <img src={open.image_data} alt="" className="w-full h-40 object-cover rounded-t-2xl" />
              )}
              <div className="p-4">
                <DialogHeader>
                  <DialogTitle className="text-base text-left">{open.title}</DialogTitle>
                  {open.content?.trim() && (
                    <DialogDescription className="sr-only">Event details</DialogDescription>
                  )}
                </DialogHeader>
                {open.content?.trim() ? (
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap mt-2">
                    {open.content}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No additional details.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCarousel;
