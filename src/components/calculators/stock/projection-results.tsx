"use client";

import { formatCurrency } from "@/lib/utils";
import { useDict } from "@/components/language-provider";
import { StatCard } from "./stat-card";
import type { FutureProjectionResult, DividendFrequency } from "@/lib/future-projection";

interface ProjectionAssumptions {
  sharePrice: number;
  priceGrowthPct: number;
  dividendAmount: number;
  dividendFrequency: DividendFrequency;
  dividendGrowthPct: number;
}

interface ProjectionResultsProps {
  result: FutureProjectionResult;
  assumptions: ProjectionAssumptions | null;
  ticker: string;
}

export function ProjectionResults({ result, assumptions, ticker }: ProjectionResultsProps) {
  const dict = useDict();
  const t = dict.calculator;

  const growthColor = result.totalGrowth >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t.endingValue} value={formatCurrency(result.endingValue)} />
        <StatCard label={t.totalContributed} value={formatCurrency(result.totalContributed)} />
        <StatCard label={t.totalGrowth} value={formatCurrency(result.totalGrowth)} colorClass={growthColor} />
        <StatCard label={t.totalDividendsCollected} value={formatCurrency(result.totalDividendsCollected)} />
      </div>

      {assumptions && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {t.assumptionsNote
            .replace("{price}", assumptions.priceGrowthPct.toFixed(1))
            .replace("{dividend}", assumptions.dividendGrowthPct.toFixed(1))
            .replace("{frequency}", t.dividendFrequencyOptions[assumptions.dividendFrequency])
            .replace("{ticker}", ticker)}
        </p>
      )}
    </div>
  );
}
