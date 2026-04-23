import { ThemeToggle } from "./theme-toggle";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-card)] shrink-0">
      {/* Desktop: just the page title */}
      <h1 className="text-base font-semibold text-[var(--color-foreground)] hidden md:block">{title}</h1>

      {/* Mobile: logo + app name */}
      <div className="flex items-center gap-2.5 md:hidden">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <path d="M16 6L10 12H13V21H10L16 27L22 21H19V12H22L16 6Z" fill="white" />
          </svg>
        </div>
        <span className="font-bold text-sm text-[var(--color-foreground)]">Easy Budget</span>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
