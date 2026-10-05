"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/calculators/stock/stat-card";
import { CalculatorGrowthChart } from "@/components/calculators/stock/calculator-growth-chart";
import { saveBucketProjectionAction } from "@/app/(dashboard)/savings-plan/actions";
import { useDict } from "@/components/language-provider";
import { formatCurrency } from "@/lib/utils";
import {
  computeCompoundInterest,
  CompoundInterestError,
  type CompoundingFrequency,
  type CompoundInterestResult,
} from "@/lib/compound-interest";
import type { SavingsBucket } from "@/types/database";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

interface CompoundCalculatorClientProps {
  bucket?: SavingsBucket | null;
}

export function CompoundCalculatorClient({ bucket }: CompoundCalculatorClientProps) {
  const dict = useDict();
  const t = dict.calculators;
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const [principal, setPrincipal] = useState(String(bucket?.current_amount ?? 1000));
  const [monthlyContribution, setMonthlyContribution] = useState(String(bucket?.contribution_amount ?? 100));
  const [annualRatePct, setAnnualRatePct] = useState("7");
  const [years, setYears] = useState("10");
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("monthly");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompoundInterestResult | null>(null);

  function handleCalculate() {
    setError(null);
    setSaved(false);
    try {
      const computed = computeCompoundInterest({
        principal: parseFloat(principal) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        annualRatePct: parseFloat(annualRatePct) || 0,
        years: parseInt(years) || 0,
        compoundingFrequency,
      });
      setResult(computed);
    } catch (err) {
      setResult(null);
      setError(err instanceof CompoundInterestError ? err.message : "Something went wrong.");
    }
  }

  function handleSaveToBucket() {
    if (!bucket || !result) return;
    startSaving(async () => {
      const lastDate = result.timeline[result.timeline.length - 1].date;
      const saveResult = await saveBucketProjectionAction({
        bucketId: bucket.id,
        projectionType: "compound",
        projectionInput: {
          principal: parseFloat(principal) || 0,
          monthlyContribution: parseFloat(monthlyContribution) || 0,
          annualRatePct: parseFloat(annualRatePct) || 0,
          years: parseInt(years) || 0,
          compoundingFrequency,
        },
        projectedValue: result.endingValue,
        projectedDate: lastDate,
      });
      if (!saveResult?.error) {
        setSaved(true);
        router.push("/savings-plan");
      }
    });
  }

  return (
    <>
      <Topbar title={t.cardCompoundTitle} backHref="/calculators" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ci-principal">{t.compound.principalLabel}</Label>
              <Input id="ci-principal" type="number" step="0.01" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ci-contribution">{t.compound.monthlyContributionLabel}</Label>
              <Input id="ci-contribution" type="number" step="0.01" min="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ci-rate">{t.compound.annualRateLabel}</Label>
              <Input id="ci-rate" type="number" step="0.01" min="0" value={annualRatePct} onChange={(e) => setAnnualRatePct(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ci-years">{t.compound.yearsLabel}</Label>
              <Input id="ci-years" type="number" step="1" min="1" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-frequency">{t.compound.compoundingFrequencyLabel}</Label>
            <select
              id="ci-frequency"
              value={compoundingFrequency}
              onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
              className={selectCls}
            >
              <option value="monthly">{t.compound.compoundingOptions.monthly}</option>
              <option value="quarterly">{t.compound.compoundingOptions.quarterly}</option>
              <option value="annually">{t.compound.compoundingOptions.annually}</option>
            </select>
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
              <StatCard label={t.compound.endingValueLabel} value={formatCurrency(result.endingValue)} colorClass="text-[var(--color-primary)]" />
              <StatCard label={t.compound.totalContributedLabel} value={formatCurrency(result.totalContributed)} />
              <StatCard label={t.compound.totalGrowthLabel} value={formatCurrency(result.totalGrowth)} colorClass="text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
              <h2 className="font-semibold text-[var(--color-foreground)] mb-5">{t.chartTitle}</h2>
              <CalculatorGrowthChart timeline={result.timeline} />
            </div>

            {bucket && (
              <Button onClick={handleSaveToBucket} disabled={isSaving} className="w-full">
                {isSaving ? dict.common.saving : saved ? dict.savingsPlan.savedToBucket : dict.savingsPlan.saveToBucket}
              </Button>
            )}
          </>
        )}
      </main>
    </>
  );
}
