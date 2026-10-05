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
import { computeCompoundInterest, CompoundInterestError, type CompoundInterestResult } from "@/lib/compound-interest";

export default function RetirementCalculatorPage() {
  const dict = useDict();
  const t = dict.calculators;

  const [currentSavings, setCurrentSavings] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [returnRate, setReturnRate] = useState("7");
  const [years, setYears] = useState("25");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompoundInterestResult | null>(null);

  function handleCalculate() {
    setError(null);
    try {
      const computed = computeCompoundInterest({
        principal: parseFloat(currentSavings) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        annualRatePct: parseFloat(returnRate) || 0,
        years: parseInt(years) || 0,
        compoundingFrequency: "monthly",
      });
      setResult(computed);
    } catch (err) {
      setResult(null);
      setError(err instanceof CompoundInterestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <Topbar title={t.cardRetirementTitle} backHref="/calculators" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ret-savings">{t.retirement.currentSavingsLabel}</Label>
              <Input id="ret-savings" type="number" step="0.01" min="0" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ret-contribution">{t.retirement.monthlyContributionLabel}</Label>
              <Input id="ret-contribution" type="number" step="0.01" min="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ret-rate">{t.retirement.returnRateLabel}</Label>
              <Input id="ret-rate" type="number" step="0.01" min="0" value={returnRate} onChange={(e) => setReturnRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ret-years">{t.retirement.yearsLabel}</Label>
              <Input id="ret-years" type="number" step="1" min="1" value={years} onChange={(e) => setYears(e.target.value)} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label={t.retirement.nestEggLabel} value={formatCurrency(result.endingValue)} colorClass="text-[var(--color-primary)]" />
              <StatCard label={t.compound.totalContributedLabel} value={formatCurrency(result.totalContributed)} />
            </div>

            <p className="text-sm text-[var(--color-muted-foreground)]">
              {t.retirement.withdrawalNote.replace("{amount}", formatCurrency(result.endingValue * 0.04))}
            </p>

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
