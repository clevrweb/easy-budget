"use client";

import { useState, useTransition } from "react";
import { updateDefaultViewAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";
import type { DefaultBillsView } from "@/types/database";

interface DefaultViewSwitcherProps {
  initialView: DefaultBillsView;
}

export function DefaultViewSwitcher({ initialView }: DefaultViewSwitcherProps) {
  const dict = useDict();
  const t = dict.settings;
  const [current, setCurrent] = useState<DefaultBillsView>(initialView);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const OPTIONS: { value: DefaultBillsView; label: string }[] = [
    { value: "day", label: t.defaultViewToday },
    { value: "week", label: t.defaultViewWeek },
    { value: "month", label: t.defaultViewMonth },
  ];

  function handleChange(view: DefaultBillsView) {
    setSaved(false);
    setCurrent(view);
    startTransition(async () => {
      await updateDefaultViewAction(view);
      setSaved(true);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.defaultViewDesc}</p>
      <div className="flex gap-2">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => handleChange(value)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
              current === value
                ? "text-white"
                : "border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
            style={current === value ? { backgroundColor: "var(--color-primary)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      {saved && <p className="text-xs text-[var(--color-primary)]">{t.defaultViewUpdated}</p>}
    </div>
  );
}
