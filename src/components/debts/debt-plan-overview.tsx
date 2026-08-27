"use client";

import { ExtraPaymentForm } from "./extra-payment-form";
import { useDict } from "@/components/language-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SnowballPlan } from "@/lib/debt-snowball";

interface DebtPlanOverviewProps {
  plan: SnowballPlan;
  extraMonthlyPayment: number;
  onExtraSaved: () => void;
}

export function DebtPlanOverview({ plan, extraMonthlyPayment, onExtraSaved }: DebtPlanOverviewProps) {
  const dict = useDict();
  const t = dict.debts;

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-5">
      <div>
        {plan.debtFreeDate ? (
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            {t.debtFreeBy.replace("{date}", formatDate(plan.debtFreeDate))}
          </h2>
        ) : (
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">{t.title}</h2>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-sm text-[var(--color-muted-foreground)]">
          <span>{t.totalDebtLabel}: <strong className="text-[var(--color-foreground)]">{formatCurrency(plan.totalBalance)}</strong></span>
          <span>{t.totalInterestLabel}: <strong className="text-[var(--color-foreground)]">{formatCurrency(plan.totalInterestPaid)}</strong></span>
        </div>
        {plan.capped && (
          <p className="mt-2 text-xs text-[var(--color-danger)]">{t.capWarning}</p>
        )}
      </div>

      <ExtraPaymentForm initialValue={extraMonthlyPayment} onSaved={onExtraSaved} />

      {plan.debts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {t.timelineTitle}
          </p>
          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            {[...plan.debts]
              .sort((a, b) => a.payoffOrder - b.payoffOrder)
              .map((d) => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-[var(--color-foreground)]">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                      {t.payoffOrderPrefix}{d.payoffOrder}
                    </span>
                    {d.name}
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {d.payoffDate ? formatDate(d.payoffDate) : "—"}
                    {d.monthsToPayoff !== null ? ` · ${t.monthsToPayoff.replace("{n}", String(d.monthsToPayoff))}` : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
