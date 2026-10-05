"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/calculators/stock/stat-card";
import { CalculatorGrowthChart } from "@/components/calculators/stock/calculator-growth-chart";
import { useDict } from "@/components/language-provider";
import { formatCurrency } from "@/lib/utils";
import {
  computeCompoundInterest,
  CompoundInterestError,
  type CompoundingFrequency,
} from "@/lib/compound-interest";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

export interface BucketCalcResult {
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  contributionAmount: number;
  contributionFrequency: string;
  projectionInput: Record<string, unknown>;
  projectedValue: number;
  projectedDate: string;
}

interface BucketCompoundFieldsProps {
  initialPrincipal?: number;
  initialContribution?: number;
  onResult: (result: BucketCalcResult) => void;
}

export function BucketCompoundFields({ initialPrincipal, initialContribution, onResult }: BucketCompoundFieldsProps) {
  const dict = useDict();
  const t = dict.calculators;

  const [principal, setPrincipal] = useState(String(initialPrincipal ?? 1000));
  const [monthlyContribution, setMonthlyContribution] = useState(String(initialContribution ?? 100));
  const [annualRatePct, setAnnualRatePct] = useState("7");
  const [years, setYears] = useState("10");
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("monthly");

  const [error, setError] = useState<string | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [timeline, setTimeline] = useState<{ date: string; value: number }[] | null>(null);
  const [endingValue, setEndingValue] = useState(0);
  const [totalContributed, setTotalContributed] = useState(0);
  const [totalGrowth, setTotalGrowth] = useState(0);

  function handleCalculate() {
    setError(null);
    try {
      const principalNum = parseFloat(principal) || 0;
      const contributionNum = parseFloat(monthlyContribution) || 0;
      const computed = computeCompoundInterest({
        principal: principalNum,
        monthlyContribution: contributionNum,
        annualRatePct: parseFloat(annualRatePct) || 0,
        years: parseInt(years) || 0,
        compoundingFrequency,
      });
      setTimeline(computed.timeline);
      setEndingValue(computed.endingValue);
      setTotalContributed(computed.totalContributed);
      setTotalGrowth(computed.totalGrowth);
      setCalculated(true);

      const projectedDate = computed.timeline[computed.timeline.length - 1].date;
      onResult({
        targetAmount: Math.round(computed.endingValue),
        targetDate: projectedDate,
        currentAmount: principalNum,
        contributionAmount: contributionNum,
        contributionFrequency: "monthly",
        projectionInput: {
          principal: principalNum,
          monthlyContribution: contributionNum,
          annualRatePct: parseFloat(annualRatePct) || 0,
          years: parseInt(years) || 0,
          compoundingFrequency,
        },
        projectedValue: computed.endingValue,
        projectedDate,
      });
    } catch (err) {
      setCalculated(false);
      setTimeline(null);
      setError(err instanceof CompoundInterestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bcf-principal">{t.compound.principalLabel}</Label>
          <Input id="bcf-principal" type="number" step="0.01" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bcf-contribution">{t.compound.monthlyContributionLabel}</Label>
          <Input id="bcf-contribution" type="number" step="0.01" min="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bcf-rate">{t.compound.annualRateLabel}</Label>
          <Input id="bcf-rate" type="number" step="0.01" min="0" value={annualRatePct} onChange={(e) => setAnnualRatePct(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bcf-years">{t.compound.yearsLabel}</Label>
          <Input id="bcf-years" type="number" step="1" min="1" value={years} onChange={(e) => setYears(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bcf-frequency">{t.compound.compoundingFrequencyLabel}</Label>
        <select
          id="bcf-frequency"
          value={compoundingFrequency}
          onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
          className={selectCls}
        >
          <option value="monthly">{t.compound.compoundingOptions.monthly}</option>
          <option value="quarterly">{t.compound.compoundingOptions.quarterly}</option>
          <option value="annually">{t.compound.compoundingOptions.annually}</option>
        </select>
      </div>

      <Button type="button" onClick={handleCalculate} className="w-full">{t.calculateButton}</Button>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

      {calculated && timeline && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <StatCard label={t.compound.endingValueLabel} value={formatCurrency(endingValue)} colorClass="text-[var(--color-primary)]" />
            <StatCard label={t.compound.totalContributedLabel} value={formatCurrency(totalContributed)} />
            <StatCard label={t.compound.totalGrowthLabel} value={formatCurrency(totalGrowth)} colorClass="text-emerald-600 dark:text-emerald-400" />
          </div>
          <CalculatorGrowthChart timeline={timeline} />
        </>
      )}
    </div>
  );
}
