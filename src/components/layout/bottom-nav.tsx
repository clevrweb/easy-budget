"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Tag, TrendingUp, TrendingDown, Settings, MoreHorizontal, Users, Repeat, ArrowLeftRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/components/language-provider";

interface BottomNavProps {
  hasMultipleAccounts?: boolean;
}

export function BottomNav({ hasMultipleAccounts }: BottomNavProps) {
  const pathname = usePathname();
  const dict = useDict();
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/dashboard", label: dict.nav.home,     icon: LayoutDashboard },
    { href: "/income",    label: dict.nav.income,   icon: TrendingUp },
    { href: "/reports",   label: dict.nav.reports,  icon: BarChart2 },
    { href: "/settings",  label: dict.nav.settings, icon: Settings },
  ];

  const moreItems = [
    { href: "/categories", label: dict.nav.categories, icon: Tag },
    { href: "/groups",    label: dict.nav.groups,    icon: Users },
    { href: "/recurring", label: dict.nav.recurring, icon: Repeat },
    { href: "/debts",     label: dict.nav.debts,     icon: TrendingDown },
    { href: "/calculator", label: dict.nav.calculator, icon: Calculator },
    ...(hasMultipleAccounts
      ? [{ href: "/choose-account", label: dict.nav.switchBudget, icon: ArrowLeftRight }]
      : []),
  ];
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    if (!moreOpen) return;
    function handler(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  useEffect(() => {
    if (moreOpen) {
      setMoreVisible(true);
      return;
    }
    const t = setTimeout(() => setMoreVisible(false), 150);
    return () => clearTimeout(t);
  }, [moreOpen]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-sidebar)] border-t border-[var(--color-border)] flex md:hidden safe-area-inset-bottom">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium active:scale-95 transition-transform"
          >
            <span
              className={cn(
                "flex items-center justify-center w-9 h-7 rounded-full transition-colors",
                isActive && "bg-[var(--color-sidebar-active)]"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]")} />
            </span>
            <span className={isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}>{label}</span>
          </Link>
        );
      })}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium active:scale-95 transition-transform"
      >
        <span
          className={cn(
            "flex items-center justify-center w-9 h-7 rounded-full transition-colors",
            isMoreActive && "bg-[var(--color-sidebar-active)]"
          )}
        >
          <MoreHorizontal className={cn("w-5 h-5", isMoreActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]")} />
        </span>
        <span className={isMoreActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}>{dict.nav.more}</span>
      </button>

      {moreVisible && createPortal(
        <div
          ref={menuRef}
          className={cn(
            "fixed bottom-16 right-2 z-50 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 min-w-[160px] safe-area-inset-bottom",
            moreOpen
              ? "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150"
              : "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-2 duration-150"
          )}
        >
          {moreItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>,
        document.body
      )}
    </nav>
  );
}
