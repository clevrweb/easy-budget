"use client";

import { useTransition } from "react";
import { Pencil, Trash2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteIncomeSourceAction, toggleIncomeSourceActiveAction } from "@/app/(dashboard)/income/actions";
import { IncomeForm } from "./income-form";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/language-provider";
import type { IncomeSource } from "@/types/database";

const frequencyLabel: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  twice_monthly: "2× / month",
  monthly: "Monthly",
};

interface IncomeRowProps {
  source: IncomeSource;
}

export function IncomeRow({ source }: IncomeRowProps) {
  const [isPending, startTransition] = useTransition();
  const dict = useDict();

  function handleDelete() {
    if (!confirm(`${dict.income.confirmDelete} "${source.name}"?`)) return;
    startTransition(async () => { await deleteIncomeSourceAction(source.id); });
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleIncomeSourceActiveAction(source.id, !source.is_active);
    });
  }

  return (
    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-muted)] transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Active toggle */}
      <button
        onClick={handleToggle}
        title={source.is_active ? "Deactivate" : "Activate"}
        className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 shrink-0 ${
          source.is_active ? "bg-emerald-500" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full bg-white shadow-sm mx-1 transition-transform duration-200 ${
            source.is_active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      {/* Icon */}
      <div className={`p-1.5 rounded-lg shrink-0 ${source.is_active ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"}`}>
        <TrendingUp className="w-3.5 h-3.5" />
      </div>

      {/* Name + schedule */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${source.is_active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)] line-through"}`}>
          {source.name}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {frequencyLabel[source.frequency] ?? source.frequency}
          {" · "}
          {dict.income.startDateLabel.toLowerCase()}{" "}
          {new Date(source.start_date + "T00:00:00").toLocaleDateString()}
        </p>
      </div>

      {/* Amount */}
      <span className={`font-semibold text-sm shrink-0 tabular-nums ${source.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-muted-foreground)]"}`}>
        {formatCurrency(source.amount)}
      </span>

      {/* Frequency badge */}
      <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)] hidden sm:inline-flex shrink-0">
        {frequencyLabel[source.frequency] ?? source.frequency}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <IncomeForm
          source={source}
          trigger={
            <Button variant="ghost" size="icon" title={dict.common.edit}>
              <Pencil className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            </Button>
          }
        />
        <Button variant="ghost" size="icon" onClick={handleDelete} title={dict.common.delete}>
          <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
        </Button>
      </div>
    </div>
  );
}
