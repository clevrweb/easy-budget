"use client";

import { useState } from "react";
import { getDebtsWithPlanAction } from "@/app/(dashboard)/debts/actions";
import { Topbar } from "@/components/layout/topbar";
import { DebtForm } from "./debt-form";
import { DebtCard } from "./debt-card";
import { DebtPlanOverview } from "./debt-plan-overview";
import { useDict } from "@/components/language-provider";
import type { Debt } from "@/types/database";
import type { SnowballPlan } from "@/lib/debt-snowball";

interface DebtsPageClientProps {
  initialDebts: Debt[];
  initialExtraPayment: number;
  initialPlan: SnowballPlan;
}

export function DebtsPageClient({ initialDebts, initialExtraPayment, initialPlan }: DebtsPageClientProps) {
  const [debts, setDebts] = useState(initialDebts);
  const [extraPayment, setExtraPayment] = useState(initialExtraPayment);
  const [plan, setPlan] = useState(initialPlan);
  const dict = useDict();
  const t = dict.debts;

  async function refresh() {
    const data = await getDebtsWithPlanAction();
    setDebts(data.debts as Debt[]);
    setExtraPayment(data.settings.extra_monthly_payment);
    setPlan(data.plan);
  }

  const payoffById = new Map(plan.debts.map((d) => [d.id, d]));
  const sortedDebts = [...debts].sort(
    (a, b) => (payoffById.get(a.id)?.payoffOrder ?? 0) - (payoffById.get(b.id)?.payoffOrder ?? 0)
  );

  return (
    <>
      <Topbar title={t.title}>
        <DebtForm onSaved={refresh} />
      </Topbar>

      <main className="flex-1 p-4 md:p-6 space-y-5">
        <DebtPlanOverview plan={plan} extraMonthlyPayment={extraPayment} onExtraSaved={refresh} />

        {debts.length === 0 ? (
          <div className="mt-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-muted)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0l-3-3m3 3l-3 3M3 7h8m0 0L8 4m3 3L8 10" />
              </svg>
            </div>
            <p className="text-[var(--color-foreground)] font-medium">{t.noDebts}</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{t.noDebtsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDebts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} payoff={payoffById.get(debt.id)} onChanged={refresh} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
