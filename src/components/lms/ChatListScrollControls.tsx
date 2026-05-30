import { useCallback, useEffect, useState, type RefObject } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  scrollRef: RefObject<HTMLDivElement | null>;
  className?: string;
};

const ChatListScrollControls = ({ scrollRef, className = "" }: Props) => {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }
    const threshold = 12;
    setCanScrollUp(el.scrollTop > threshold);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - threshold);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [scrollRef, updateScrollState]);

  const scrollBy = (direction: "up" | "down") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(160, Math.floor(el.clientHeight * 0.75));
    el.scrollBy({ top: direction === "up" ? -step : step, behavior: "smooth" });
  };

  if (!canScrollUp && !canScrollDown) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-8 w-8 rounded-full shadow-md border border-border"
        disabled={!canScrollUp}
        onClick={() => scrollBy("up")}
        aria-label="Scroll up"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-8 w-8 rounded-full shadow-md border border-border"
        disabled={!canScrollDown}
        onClick={() => scrollBy("down")}
        aria-label="Scroll down"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatListScrollControls;
