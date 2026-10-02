"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DraggableFabProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
  storageKey: string;
}

const SIZE = 48;
const SIDE_MARGIN = 16;
const BOTTOM_MARGIN = 80;

function clamp(x: number, y: number) {
  const maxX = window.innerWidth - SIZE - SIDE_MARGIN;
  const maxY = window.innerHeight - SIZE - BOTTOM_MARGIN;
  return {
    x: Math.min(Math.max(x, SIDE_MARGIN), Math.max(maxX, SIDE_MARGIN)),
    y: Math.min(Math.max(y, SIDE_MARGIN), Math.max(maxY, SIDE_MARGIN)),
  };
}

function defaultPos() {
  return clamp((window.innerWidth - SIZE) / 2, (window.innerHeight - SIZE) / 2);
}

/** Draggable FAB that remembers where it was dropped, per `storageKey`. */
export function DraggableFab({ href, icon, label, className, storageKey }: DraggableFabProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; dragging: boolean } | null>(null);

  useEffect(() => {
    let initial: { x: number; y: number };
    try {
      const saved = localStorage.getItem(storageKey);
      initial = saved ? clamp(JSON.parse(saved).x, JSON.parse(saved).y) : defaultPos();
    } catch {
      initial = defaultPos();
    }
    setPos(initial);
  }, [storageKey]);

  function handlePointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, dragging: false };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const ds = dragRef.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.dragging && Math.hypot(dx, dy) > 6) ds.dragging = true;
    if (ds.dragging) setPos(clamp(ds.origX + dx, ds.origY + dy));
  }

  function handlePointerUp() {
    const ds = dragRef.current;
    if (ds?.dragging && pos) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(pos));
      } catch {}
    }
  }

  function handleClick(e: React.MouseEvent) {
    if (dragRef.current?.dragging) e.preventDefault();
    dragRef.current = null;
  }

  return (
    <Link
      href={href}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      className={cn(
        "fixed z-30 md:hidden h-12 w-12 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform touch-none select-none",
        !pos && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        className ?? "bg-[var(--color-primary)] text-white"
      )}
    >
      {icon}
    </Link>
  );
}
