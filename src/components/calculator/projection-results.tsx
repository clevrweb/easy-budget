"use client";

import { formatCurrency } from "@/lib/utils";
import { useDict } from "@/components/language-provider";
import { StatCard } from "./stat-card";
import type { FutureProjectionResult, HistoricalReturnEstimate } from "@/lib/future-projection";

interface ProjectionResultsProps {
  result: FutureProjectionResult;
  estimate: HistoricalReturnEstimate | null;
  usingOverride: boolean;
  ticker: string;
}

export function ProjectionResults({ result, estimate, usingOverride, ticker }: ProjectionResultsProps) {
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

      {estimate && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {usingOverride
            ? t.estimateNoteOverridden
            : t.estimateNoteAuto
                .replace("{return}", estimate.annualPriceReturnPct.toFixed(1))
                .replace("{yield}", estimate.annualDividendYieldPct.toFixed(1))
                .replace("{years}", Math.round(estimate.yearsOfHistory).toString())
                .replace("{ticker}", ticker)
                .replace("{date}", estimate.sinceDate)}
        </p>
      )}

      {estimate?.insufficientHistory && (
        <p className="text-xs text-[var(--color-warning)]">
          {t.limitedHistoryWarning.replace("{years}", estimate.yearsOfHistory.toFixed(1))}
        </p>
      )}
    </div>
  );
}
