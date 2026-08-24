"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useDict } from "@/components/language-provider";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
  backHref?: string;
}

export function Topbar({ title, children, backHref }: TopbarProps) {
  const dict = useDict();

  return (
    <header className="relative h-14 flex items-center justify-between px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-card)] shrink-0">
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
        <>
          <h1 className="text-base font-semibold text-[var(--color-foreground)] hidden md:block">{title}</h1>
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M16 6L10 12H13V21H10L16 27L22 21H19V12H22L16 6Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-sm text-[var(--color-foreground)]">Budget Whisperer</span>
          </div>
        </>
      )}

      {/* Center title on back pages */}
      {backHref && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h1>
      )}

      {/* Right */}
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
