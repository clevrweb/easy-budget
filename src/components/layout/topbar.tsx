"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useDict } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
  backHref?: string;
}

// Hidden on mobile -- the logo/title bar, per-page "Add" actions, and the
// theme toggle it used to carry have moved to the bottom nav logo, a FAB per
// page, and the Settings > Appearance tab, respectively. The one exception is
// a page with `backHref`: that back-navigation link has no other mobile home,
// so the bar stays visible there (just the back link + centered title; the
// right-side slot below is still mobile-hidden even then).
export function Topbar({ title, children, backHref }: TopbarProps) {
  const dict = useDict();

  return (
    <header
      className={cn(
        "relative h-14 items-center justify-between px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-card)] shrink-0",
        backHref ? "flex" : "hidden md:flex"
      )}
    >
      {/* Left */}
      {backHref ? (
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors min-w-[60px]"
        >
          <ChevronLeft className="w-4 h-4" />
          {dict.nav.back}
        </Link>
      ) : (
        <h1 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h1>
      )}

      {/* Center title on back pages */}
      {backHref && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h1>
      )}

      {/* Right */}
      <div className="hidden md:flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
