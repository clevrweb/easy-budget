"use client";

interface MonthPickerProps {
  value: string;
  label?: string;
}

export function MonthPicker({ value, label }: MonthPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--color-muted-foreground)] font-medium">Month</span>
      <form method="get">
        <input
          type="month"
          name="month"
          defaultValue={value}
          onChange={(e) => (e.target.form as HTMLFormElement).submit()}
          className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        />
      </form>
      {label && <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>}
    </div>
  );
}
