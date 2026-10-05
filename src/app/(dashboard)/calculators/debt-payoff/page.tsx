"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/calculators/stock/stat-card";
import { CalculatorGrowthChart } from "@/components/calculators/stock/calculator-growth-chart";
import { useDict } from "@/components/language-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeDebtPayoff, DebtPayoffError, type DebtPayoffResult } from "@/lib/debt-payoff-calculator";

export default function DebtPayoffCalculatorPage() {
  const dict = useDict();
  const t = dict.calculators;

  const [balance, setBalance] = useState("5000");
  const [rate, setRate] = useState("19.99");
  const [payment, setPayment] = useState("200");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DebtPayoffResult | null>(null);

  function handleCalculate() {
    setError(null);
    try {
      setResult(computeDebtPayoff({
        balance: parseFloat(balance) || 0,
        annualRatePct: parseFloat(rate) || 0,
        monthlyPayment: parseFloat(payment) || 0,
      }));
    } catch (err) {
      setResult(null);
      setError(err instanceof DebtPayoffError ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <Topbar title={t.cardDebtPayoffTitle} backHref="/calculators" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dp-balance">{t.debtPayoff.balanceLabel}</Label>
            <Input id="dp-balance" type="number" step="0.01" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dp-rate">{t.debtPayoff.rateLabel}</Label>
              <Input id="dp-rate" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dp-payment">{t.debtPayoff.paymentLabel}</Label>
              <Input id="dp-payment" type="number" step="0.01" min="0" value={payment} onChange={(e) => setPayment(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full">{t.calculateButton}</Button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {result?.neverPaidOff && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {t.debtPayoff.neverPaidOffWarning}
          </div>
        )}

        {result && !result.neverPaidOff && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label={t.debtPayoff.monthsToPayoffLabel} value={String(result.monthsToPayoff)} colorClass="text-[var(--color-primary)]" />
              <StatCard label={t.debtPayoff.payoffDateLabel} value={formatDate(result.payoffDate!)} />
              <StatCard label={t.debtPayoff.totalInterestLabel} value={formatCurrency(result.totalInterestPaid)} />
            </div>

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
              <h2 className="font-semibold text-[var(--color-foreground)] mb-5">{t.chartTitle}</h2>
              <CalculatorGrowthChart timeline={result.timeline} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
