"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/calculators/stock/stat-card";
import { CalculatorGrowthChart } from "@/components/calculators/stock/calculator-growth-chart";
import { useDict } from "@/components/language-provider";
import { formatCurrency } from "@/lib/utils";
import { computeLoanPayment, LoanCalculatorError, type LoanResult } from "@/lib/loan-calculator";

export default function LoanCalculatorPage() {
  const dict = useDict();
  const t = dict.calculators;

  const [amount, setAmount] = useState("25000");
  const [rate, setRate] = useState("6.5");
  const [termYears, setTermYears] = useState("5");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoanResult | null>(null);

  function handleCalculate() {
    setError(null);
    try {
      setResult(computeLoanPayment({
        amount: parseFloat(amount) || 0,
        annualRatePct: parseFloat(rate) || 0,
        termYears: parseInt(termYears) || 0,
      }));
    } catch (err) {
      setResult(null);
      setError(err instanceof LoanCalculatorError ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <Topbar title={t.cardLoanTitle} backHref="/calculators" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ln-amount">{t.loan.loanAmountLabel}</Label>
            <Input id="ln-amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ln-rate">{t.loan.rateLabel}</Label>
              <Input id="ln-rate" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ln-term">{t.loan.termYearsLabel}</Label>
              <Input id="ln-term" type="number" step="1" min="1" value={termYears} onChange={(e) => setTermYears(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full">{t.calculateButton}</Button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label={t.loan.monthlyPaymentLabel} value={formatCurrency(result.monthlyPayment)} colorClass="text-[var(--color-primary)]" />
              <StatCard label={t.loan.totalInterestLabel} value={formatCurrency(result.totalInterestPaid)} />
              <StatCard label={t.loan.totalPaidLabel} value={formatCurrency(result.totalPaid)} />
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
