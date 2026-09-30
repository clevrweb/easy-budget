"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SwipeAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onActivate: () => void;
  /** Tailwind classes for the action button's background/text. */
  className?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  /** px width per action button. */
  actionWidth?: number;
  /** Disable swipe entirely and force-close if already open (e.g. while a mutation is pending). */
  disabled?: boolean;
  /** Applied to the outer clipping wrapper — use for card chrome (rounded/border/shadow). */
  className?: string;
  /** Fired whenever the row transitions from open -> closed, for any reason. */
  onClose?: () => void;
}

// Driven entirely by native CSS Scroll Snap rather than manual pointer-event
// math: a JS drag implementation has to win a race against the browser's own
// touch-scroll gesture recognizer (which can claim a not-perfectly-horizontal
// touch for native vertical scrolling before threshold-detection code ever
// runs), which is unreliable across Android/iOS combinations. Scroll snap
// hands axis disambiguation, momentum, and snap-back to the browser itself.
export function SwipeableRow({
  children,
  actions,
  actionWidth = 76,
  disabled = false,
  className = "",
  onClose,
}: SwipeableRowProps) {
  const maxReveal = actions.length * actionWidth;
  const trackRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wasOpenRef = useRef(false);

  const close = useCallback((smooth = true) => {
    trackRef.current?.scrollTo({ left: 0, behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (disabled) close(false);
  }, [disabled, close]);

  // Debounced scroll-settle check: reads the final resting scrollLeft (always
  // exactly 0 or maxReveal thanks to `scroll-snap-type: x mandatory`) to
  // derive open/closed state.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || maxReveal === 0) return;
    let t: ReturnType<typeof setTimeout>;
    function handleScroll() {
      clearTimeout(t);
      t = setTimeout(() => {
        const open = (el?.scrollLeft ?? 0) > maxReveal / 2;
        setIsOpen(open);
        if (!open && wasOpenRef.current) onClose?.();
        wasOpenRef.current = open;
      }, 100);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [maxReveal, onClose]);

  // Tapping/clicking outside the row while open closes it.
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: Event) {
      if (trackRef.current && !trackRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("touchstart", handler);
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, close]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        className="no-scrollbar flex"
        style={{
          overflowX: disabled ? "hidden" : "auto",
          overflowY: "clip",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          overscrollBehaviorX: "none",
        }}
      >
        <div className="shrink-0 w-full bg-[var(--color-card)]" style={{ scrollSnapAlign: "start" }}>
          {children}
        </div>

        {actions.length > 0 && (
          <div className="shrink-0 flex" style={{ width: maxReveal, scrollSnapAlign: "end" }}>
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={a.onActivate}
                style={{ width: actionWidth }}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-bold text-white ${a.className ?? "bg-slate-500"}`}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
