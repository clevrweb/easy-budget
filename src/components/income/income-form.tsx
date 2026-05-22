"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { createIncomeSourceAction, updateIncomeSourceAction } from "@/app/(dashboard)/income/actions";
import { useDict } from "@/components/language-provider";
import type { IncomeSource, IncomeFrequency } from "@/types/database";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

interface IncomeFormProps {
  source?: IncomeSource;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function IncomeForm({ source, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: IncomeFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [frequency, setFrequency] = useState(source?.frequency ?? "monthly");
  const isEdit = !!source;
  const dict = useDict();
  const t = dict.income;

  useEffect(() => {
    if (open) setFrequency(source?.frequency ?? "monthly");
    else setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const FREQUENCIES = [
    { value: "weekly",       label: t.weekly,       hint: t.weeklyHint },
    { value: "biweekly",     label: t.biweekly,     hint: t.biweeklyHint },
    { value: "twice_monthly", label: t.twiceMonthly, hint: t.twiceMonthlyHint },
    { value: "monthly",      label: t.monthly,      hint: t.monthlyHint },
  ];

  const hint = FREQUENCIES.find((f) => f.value === frequency)?.hint ?? "";

  function handleOpenChange(v: boolean) {
    if (isControlled) controlledOnOpenChange?.(v);
    else setInternalOpen(v);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateIncomeSourceAction(formData)
        : await createIncomeSourceAction(formData);

      if (result?.error) setError(result.error);
      else handleOpenChange(false);
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="w-4 h-4" />
              {t.addIncome}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editIncome : t.addIncome}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={source.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="income-name">{t.nameLabel}</Label>
            <Input
              id="income-name"
              name="name"
              placeholder={t.namePlaceholder}
              defaultValue={source?.name}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="income-amount">{t.amountLabel}</Label>
              <Input
                id="income-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={source?.amount}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="income-start-date">{t.startDateLabel}</Label>
              <Input
                id="income-start-date"
                name="start_date"
                type="date"
                defaultValue={source?.start_date ?? todayStr}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="income-frequency">{t.frequencyLabel}</Label>
            <select
              id="income-frequency"
              name="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
              className={selectCls}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            {hint && (
              <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
            )}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            {t.startDateHint}
          </p>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? t.saving : isEdit ? t.saveChanges : t.addIncome}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t.cancel}</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
