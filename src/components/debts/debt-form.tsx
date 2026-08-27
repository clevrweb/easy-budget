"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createDebtAction, updateDebtAction } from "@/app/(dashboard)/debts/actions";
import { DebtRecurringPicker } from "./debt-recurring-picker";
import { useDict } from "@/components/language-provider";
import type { Debt } from "@/types/database";
import { Plus } from "lucide-react";

interface DebtFormProps {
  debt?: Debt;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

export function DebtForm({ debt, trigger, onSaved }: DebtFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createdDebt, setCreatedDebt] = useState<{ id: string; name: string; minimumPayment: number } | null>(null);
  const isEdit = !!debt;
  const dict = useDict();
  const t = dict.debts;

  function resetAndClose(o: boolean) {
    setOpen(o);
    if (!o) {
      setError(null);
      setCreatedDebt(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (isEdit) {
        const result = await updateDebtAction(formData);
        if (result?.error) setError(result.error);
        else { onSaved?.(); resetAndClose(false); }
        return;
      }

      const result = await createDebtAction(formData);
      if (result?.error) { setError(result.error); return; }
      onSaved?.();
      setCreatedDebt({
        id: result.id,
        name: formData.get("name") as string,
        minimumPayment: parseFloat(formData.get("minimum_payment") as string),
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="w-4 h-4" />{t.addDebt}</Button>}
      </DialogTrigger>
      <DialogContent>
        {createdDebt ? (
          <DebtRecurringPicker
            debtId={createdDebt.id}
            debtName={createdDebt.name}
            minimumPayment={createdDebt.minimumPayment}
            onDone={() => resetAndClose(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isEdit ? t.editDebt : t.addDebt}</DialogTitle>
            </DialogHeader>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              {isEdit && <input type="hidden" name="id" value={debt.id} />}

              <div className="space-y-1.5">
                <Label htmlFor="debt-name">{t.nameLabel}</Label>
                <Input id="debt-name" name="name" placeholder={t.namePlaceholder} defaultValue={debt?.name} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="debt-balance">{t.balanceLabel}</Label>
                <Input
                  id="debt-balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={debt?.balance}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="debt-rate">{t.interestRateLabel}</Label>
                <Input
                  id="debt-rate"
                  name="interest_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={debt?.interest_rate ?? 0}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="debt-min-payment">{t.minimumPaymentLabel}</Label>
                <Input
                  id="debt-min-payment"
                  name="minimum_payment"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={debt?.minimum_payment}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? dict.common.saving : isEdit ? t.saveChanges : t.addDebt}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">{dict.common.cancel}</Button>
                </DialogClose>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
