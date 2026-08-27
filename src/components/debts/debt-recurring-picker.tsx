"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRecurringBillForDebtAction } from "@/app/(dashboard)/debts/actions";
import { formatCurrency } from "@/lib/utils";
import { useDict } from "@/components/language-provider";

interface DebtRecurringPickerProps {
  debtId: string;
  debtName: string;
  minimumPayment: number;
  onDone: () => void;
}

export function DebtRecurringPicker({ debtId, debtName, minimumPayment, onDone }: DebtRecurringPickerProps) {
  const dict = useDict();
  const t = dict.debts;
  const [dueDay, setDueDay] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    const day = parseInt(dueDay, 10);
    startTransition(async () => {
      const result = await createRecurringBillForDebtAction(debtId, day);
      if (result?.error) { setError(result.error); return; }
      onDone();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t.addAsBillTitle.replace("{name}", debtName)}
        </h3>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{t.addAsBillDesc}</p>
      </div>

      <p className="text-sm text-[var(--color-foreground)]">
        {formatCurrency(minimumPayment)} <span className="text-[var(--color-muted-foreground)]">/ month</span>
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="debt-due-day">{t.dueDayLabel}</Label>
        <Input
          id="debt-due-day"
          type="number"
          min={1}
          max={31}
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
        />
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" className="flex-1" onClick={handleAdd} disabled={isPending}>
          {isPending ? dict.common.saving : t.addBillButton}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          {t.skipButton}
        </Button>
      </div>
    </div>
  );
}
