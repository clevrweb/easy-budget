"use client";

import { useTransition, useState } from "react";
import { deleteDebtAction } from "@/app/(dashboard)/debts/actions";
import { DebtForm } from "./debt-form";
import { useDict } from "@/components/language-provider";
import { formatCurrency } from "@/lib/utils";
import type { Debt } from "@/types/database";
import type { DebtPayoffResult } from "@/lib/debt-snowball";
import { Pencil, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeableRow, type SwipeAction } from "@/components/ui/swipeable-row";
import { useConfirmAction } from "@/lib/use-confirm-action";

interface DebtCardProps {
  debt: Debt;
  payoff?: DebtPayoffResult;
  onChanged?: () => void;
}

export function DebtCard({ debt, payoff, onChanged }: DebtCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const dict = useDict();
  const t = dict.debts;

  function handleDelete() {
    if (!confirm(t.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteDebtAction(debt.id);
      if (!result?.error) onChanged?.();
    });
  }

  const deleteConfirm = useConfirmAction(() => {
    startTransition(async () => {
      const result = await deleteDebtAction(debt.id);
      if (!result?.error) onChanged?.();
    });
  });

  const swipeActions: SwipeAction[] = [
    {
      key: "edit",
      label: dict.common.edit,
      icon: <Pencil className="w-4 h-4" />,
      onActivate: () => setEditOpen(true),
      className: "bg-slate-500",
    },
    {
      key: "delete",
      label: deleteConfirm.armed ? dict.common.confirmAgain : dict.common.delete,
      icon: <Trash2 className="w-4 h-4" />,
      onActivate: deleteConfirm.trigger,
      className: deleteConfirm.armed ? "bg-red-700" : "bg-[var(--color-danger)]",
    },
  ];

  return (
    <SwipeableRow
      actions={swipeActions}
      disabled={isPending}
      onClose={deleteConfirm.reset}
      className="rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200"
    >
    <div className={`bg-[var(--color-card)] p-5 flex flex-col gap-4 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-danger)]/10 border-2 border-[var(--color-danger)]">
          <TrendingDown className="w-4 h-4 text-[var(--color-danger)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">{debt.name}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {formatCurrency(debt.balance)} · {debt.interest_rate}% APR
          </p>
        </div>
        {payoff && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--color-primary)] text-white">
            {t.payoffOrderPrefix}{payoff.payoffOrder}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>{t.minimumPaymentLabel}: {formatCurrency(debt.minimum_payment)}/mo</span>
        {payoff && (
          <span>
            {payoff.monthsToPayoff !== null ? t.monthsToPayoff.replace("{n}", String(payoff.monthsToPayoff)) : "—"}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-1 border-t border-[var(--color-border)]">
        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setEditOpen(true)}>
          <Pencil className="w-3.5 h-3.5" /> {dict.common.edit}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} className="flex-1 text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]">
          <Trash2 className="w-3.5 h-3.5" /> {dict.common.delete}
        </Button>
      </div>
    </div>
    <DebtForm debt={debt} onSaved={onChanged} open={editOpen} onOpenChange={setEditOpen} />
    </SwipeableRow>
  );
}
