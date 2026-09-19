"use client";

import { cn } from "@/lib/utils";
import { useDict } from "@/components/language-provider";

export type CalculatorMode = "backtest" | "project";

interface CalculatorModeToggleProps {
  mode: CalculatorMode;
  onMode: (mode: CalculatorMode) => void;
}

export function CalculatorModeToggle({ mode, onMode }: CalculatorModeToggleProps) {
  const dict = useDict();
  const t = dict.calculator;

  const options: { value: CalculatorMode; label: string }[] = [
    { value: "backtest", label: t.modeBacktestLabel },
    { value: "project", label: t.modeProjectLabel },
  ];

  return (
    <div className="inline-flex rounded-lg border border-[var(--color-border)] p-1 bg-[var(--color-muted)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onMode(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            mode === opt.value
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
