"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Tag, TrendingUp, TrendingDown, Settings, MoreHorizontal, Users, Repeat, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/components/language-provider";

interface BottomNavProps {
  hasMultipleAccounts?: boolean;
}

export function BottomNav({ hasMultipleAccounts }: BottomNavProps) {
  const pathname = usePathname();
  const dict = useDict();
  const [moreOpen, setMoreOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/dashboard", label: dict.nav.home,     icon: LayoutDashboard },
    { href: "/income",    label: dict.nav.income,   icon: TrendingUp },
    { href: "/categories", label: dict.nav.categories, icon: Tag },
    { href: "/reports",   label: dict.nav.reports,  icon: BarChart2 },
    { href: "/settings",  label: dict.nav.settings, icon: Settings },
  ];

  const moreItems = [
    { href: "/groups",    label: dict.nav.groups,    icon: Users },
    { href: "/recurring", label: dict.nav.recurring, icon: Repeat },
    { href: "/debts",     label: dict.nav.debts,     icon: TrendingDown },
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-sidebar)] border-t border-[var(--color-border)] flex md:hidden safe-area-inset-bottom">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors",
              isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-muted-foreground)]"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        className={cn(
          "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors",
          isMoreActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"
        )}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>{dict.nav.more}</span>
      </button>

      {moreOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed bottom-16 right-2 z-50 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 min-w-[160px] safe-area-inset-bottom"
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
