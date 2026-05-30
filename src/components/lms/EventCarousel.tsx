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
  sort_order: number | null;
  images: string[];
};

type EventCarouselProps = {
  variant?: "compact" | "full";
  className?: string;
};

const EventCarousel = ({ variant = "compact", className = "" }: EventCarouselProps) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventIndex, setEventIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [open, setOpen] = useState<EventItem | null>(null);
  const [dialogImageIndex, setDialogImageIndex] = useState(0);

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, content, sort_order, event_images(id, image_data, sort_order)")
      .eq("is_active", true)
      .order("sort_order");

    const parsed: EventItem[] = (data || [])
      .map((row) => {
        const imgs = [...(row.event_images || [])]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((im) => im.image_data)
          .filter((url) => Boolean(url?.trim()));
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          sort_order: row.sort_order,
          images: imgs,
        };
      })
      .filter((e) => e.images.length > 0);

    setEvents(parsed);
    setEventIndex((prev) => (parsed.length === 0 ? 0 : Math.min(prev, parsed.length - 1)));
    setImageIndex(0);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("events-carousel")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "event_images" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentEvent = events[eventIndex];
  const currentImage = currentEvent?.images[imageIndex];

  const goToSlide = useCallback(
    (nextEvent: number, nextImage: number) => {
      if (isTransitioning || events.length === 0) return;
      setIsTransitioning(true);
      setEventIndex(nextEvent);
      setImageIndex(nextImage);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning, events.length],
  );

  const advance = useCallback(() => {
    if (events.length === 0) return;
    const ev = events[eventIndex];
    if (!ev) return;
    if (ev.images.length > 1 && imageIndex < ev.images.length - 1) {
      goToSlide(eventIndex, imageIndex + 1);
      return;
    }
    const nextEvent = (eventIndex + 1) % events.length;
    goToSlide(nextEvent, 0);
  }, [events, eventIndex, imageIndex, goToSlide]);

  useEffect(() => {
    if (events.length === 0) return;
    const totalSlides = events.reduce((n, e) => n + e.images.length, 0);
    if (totalSlides <= 1) return;
    const timer = setInterval(advance, 4500);
    return () => clearInterval(timer);
  }, [advance, events]);

  const openEvent = (event: EventItem) => {
    setOpen(event);
    setDialogImageIndex(0);
  };

  if (events.length === 0 || !currentEvent || !currentImage) return null;

  const heightClass = variant === "full" ? "h-[220px] sm:h-[280px]" : "h-[160px]";
  const imageCount = currentEvent.images.length;
  const totalEvents = events.length;

  return (
    <div className={className}>
      <div className={`relative overflow-hidden rounded-xl ${heightClass}`}>
        <button
          type="button"
          onClick={() => openEvent(currentEvent)}
          className="absolute inset-0 w-full h-full text-left z-10"
        >
          <img
            key={`${currentEvent.id}-${imageIndex}`}
            src={currentImage}
            alt={currentEvent.title}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-400 ease-out ${
              isTransitioning ? "opacity-90 scale-[1.02]" : "opacity-100 scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
            {totalEvents > 1 && (
              <p className="text-[9px] font-bold text-primary-foreground/80 mb-1">
                Event {eventIndex + 1} of {totalEvents}
                {imageCount > 1 && ` · Photo ${imageIndex + 1}/${imageCount}`}
              </p>
            )}
            {currentEvent.title?.trim() && (
              <h3 className="text-sm sm:text-base font-extrabold text-primary-foreground drop-shadow-lg leading-tight line-clamp-2">
                {currentEvent.title}
              </h3>
            )}
            {currentEvent.content?.trim() && variant === "full" && (
              <p className="text-[10px] sm:text-[11px] text-primary-foreground/90 mt-1 line-clamp-2 drop-shadow-md">
                {currentEvent.content}
              </p>
            )}
          </div>
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
          {imageCount > 1 && (
            <div className="flex gap-1">
              {currentEvent.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(eventIndex, i);
                  }}
                  aria-label={`Photo ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === imageIndex ? "w-3 bg-accent" : "w-1 bg-primary-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}
          {totalEvents > 1 && (
            <div className="flex gap-1.5">
              {events.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(i, 0);
                  }}
                  aria-label={`Event ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === eventIndex ? "w-5 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          {open && (
            <>
              <div className="relative">
                <img
                  src={open.images[dialogImageIndex]}
                  alt=""
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                {open.images.length > 1 && (
                  <>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {open.images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setDialogImageIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            i === dialogImageIndex ? "w-4 bg-accent" : "w-1.5 bg-primary-foreground/50"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white text-lg"
                      onClick={() =>
                        setDialogImageIndex((i) => (i === 0 ? open.images.length - 1 : i - 1))
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white text-lg"
                      onClick={() =>
                        setDialogImageIndex((i) => (i + 1) % open.images.length)
                      }
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
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
