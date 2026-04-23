import { ThemeToggle } from "./theme-toggle";

interface MobileHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function MobileHeader({ title, children }: MobileHeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-card)] md:hidden shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <path d="M16 6L10 12H13V21H10L16 27L22 21H19V12H22L16 6Z" fill="white" />
          </svg>
        </div>
        <span className="font-bold text-sm text-[var(--color-foreground)]">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
