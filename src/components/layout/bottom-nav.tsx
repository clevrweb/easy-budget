"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Tag, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/components/language-provider";

export function BottomNav() {
  const pathname = usePathname();
  const dict = useDict();

  const navItems = [
    { href: "/dashboard",  label: dict.nav.home,       icon: LayoutDashboard },
    { href: "/categories", label: dict.nav.categories, icon: Tag },
    { href: "/groups",     label: dict.nav.groups,     icon: Users },
    { href: "/reports",    label: dict.nav.reports,    icon: BarChart2 },
    { href: "/settings",   label: dict.nav.settings,   icon: Settings },
  ];

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
    </nav>
  );
}
