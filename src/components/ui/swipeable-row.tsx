"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";

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

const DRAG_THRESHOLD_PX = 10;
const SNAP_OPEN_RATIO = 0.4;

interface DragState {
  startX: number;
  startY: number;
  baseOffset: number;
  curDx: number;
  decided: "horizontal" | "vertical" | null;
  dragging: boolean;
  open: boolean;
}

export function SwipeableRow({
  children,
  actions,
  actionWidth = 76,
  disabled = false,
  className = "",
  onClose,
}: SwipeableRowProps) {
  const maxReveal = actions.length * actionWidth;
  const coarsePointer = useCoarsePointer();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const stateRef = useRef<DragState>({
    startX: 0, startY: 0, baseOffset: 0, curDx: 0, decided: null, dragging: false, open: false,
  });

  const clamp = useCallback((n: number) => Math.min(0, Math.max(-maxReveal, n)), [maxReveal]);

  const setTranslate = useCallback((x: number) => {
    if (contentRef.current) contentRef.current.style.transform = `translateX(${x}px)`;
  }, []);

  const commitOpen = useCallback((open: boolean) => {
    stateRef.current.open = open;
    setIsOpen(open);
    setTranslate(open ? -maxReveal : 0);
    if (!open) onClose?.();
  }, [maxReveal, onClose, setTranslate]);

  useEffect(() => {
    if (disabled && stateRef.current.open) commitOpen(false);
  }, [disabled, commitOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: Event) {
      const wrapper = contentRef.current?.parentElement;
      if (wrapper && !wrapper.contains(e.target as Node)) commitOpen(false);
    }
    document.addEventListener("touchstart", handler);
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, commitOpen]);

  function onPointerDown(e: React.PointerEvent) {
    if (disabled || actions.length === 0 || !coarsePointer || e.pointerType === "mouse") return;
    const s = stateRef.current;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.baseOffset = s.open ? -maxReveal : 0;
    s.curDx = 0;
    s.decided = null;
    s.dragging = true;
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (s.decided === null) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD_PX) return;
      s.decided = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (s.decided === "vertical") { s.dragging = false; return; }
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (s.decided !== "horizontal") return;

    e.preventDefault();
    s.curDx = dx;
    setTranslate(clamp(s.baseOffset + dx));
  }

  function endDrag() {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.decided !== "horizontal") return;
    setIsDragging(false);
    const finalOffset = clamp(s.baseOffset + s.curDx);
    commitOpen(finalOffset <= -maxReveal * SNAP_OPEN_RATIO);
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {actions.length > 0 && (
        <div className="absolute inset-y-0 right-0 z-0 flex" style={{ width: maxReveal }}>
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

      <div
        ref={contentRef}
        className="relative z-10 bg-[var(--color-card)]"
        style={{
          transform: "translateX(0px)",
          transition: isDragging ? "none" : "transform 200ms ease-out",
          willChange: "transform",
        }}
      >
        {children}
      </div>

      {isOpen && (
        <div
          className="absolute inset-0 z-20"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); commitOpen(false); }}
        />
      )}
    </div>
  );
}
