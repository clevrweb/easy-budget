"use client";

import { formatCurrency, formatPercent } from "@/lib/utils";
import { useDict } from "@/components/language-provider";
import type { CompoundCalculatorResult } from "@/lib/compound-calculator";
import { StatCard } from "./stat-card";

interface CalculatorResultsProps {
  result: CompoundCalculatorResult;
}

export function CalculatorResults({ result }: CalculatorResultsProps) {
  const dict = useDict();
  const t = dict.calculator;

  const returnColor = result.totalReturnPct >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]";
  const cagrColor = result.cagr >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label={t.endingValue} value={formatCurrency(result.endingValue)} />
      <StatCard label={t.totalReturn} value={formatPercent(result.totalReturnPct)} colorClass={returnColor} />
      <StatCard label={t.cagr} value={formatPercent(result.cagr)} colorClass={cagrColor} />
      <StatCard label={t.totalDividendsCollected} value={formatCurrency(result.totalDividendsCollected)} />
    </div>
  );
}
