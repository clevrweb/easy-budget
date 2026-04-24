"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { ThemeToggle } from "./theme-toggle";

interface MobileHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function MobileHeader({ title, children }: MobileHeaderProps) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "dark" ? "/logo-dark.jpg" : "/logo.jpg";

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-card)] md:hidden shrink-0">
      <div className="flex items-center gap-2.5">
        <Image src={logo} alt="Easy Budget" width={64} height={64} className="w-8 h-8 object-contain" priority />
        <span className="font-bold text-sm text-[var(--color-foreground)]">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
