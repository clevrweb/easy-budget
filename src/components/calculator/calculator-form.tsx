"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";
import type { DividendMode } from "@/lib/compound-calculator";
import type { HistoricalReturnEstimate } from "@/lib/future-projection";
import { CalculatorModeToggle, type CalculatorMode } from "./calculator-mode-toggle";

interface CalculatorFormProps {
  mode: CalculatorMode;
  onMode: (mode: CalculatorMode) => void;

  ticker: string;
  onTicker: (value: string) => void;
  initialInvestment: number;
  onInitialInvestment: (value: number) => void;

  // backtest-only
  startDate: string;
  onStartDate: (value: string) => void;
  endDate: string;
  onEndDate: (value: string) => void;

  // project-only
  monthlyContribution: number;
  onMonthlyContribution: (value: number) => void;
  projectStartDate: string;
  onProjectStartDate: (value: string) => void;
  projectEndDate: string;
  onProjectEndDate: (value: string) => void;
  annualReturnOverride: number | null;
  onAnnualReturnOverride: (value: number | null) => void;
  dividendYieldOverride: number | null;
  onDividendYieldOverride: (value: number | null) => void;
  estimate: HistoricalReturnEstimate | null;

  includeDividends: boolean;
  onIncludeDividends: (value: boolean) => void;
  drip: boolean;
  onDrip: (value: boolean) => void;

  loading: boolean;
  onSubmit: () => void;
}

export function dividendModeFrom(includeDividends: boolean, drip: boolean): DividendMode {
  if (!includeDividends) return "none";
  return drip ? "drip" : "cash";
}

function parseOptionalNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export function CalculatorForm({
  mode, onMode,
  ticker, onTicker,
  initialInvestment, onInitialInvestment,
  startDate, onStartDate,
  endDate, onEndDate,
  monthlyContribution, onMonthlyContribution,
  projectStartDate, onProjectStartDate,
  projectEndDate, onProjectEndDate,
  annualReturnOverride, onAnnualReturnOverride,
  dividendYieldOverride, onDividendYieldOverride,
  estimate,
  includeDividends, onIncludeDividends,
  drip, onDrip,
  loading, onSubmit,
}: CalculatorFormProps) {
  const dict = useDict();
  const t = dict.calculator;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4"
    >
      <CalculatorModeToggle mode={mode} onMode={onMode} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="calc-ticker">{t.tickerLabel}</Label>
          <Input
            id="calc-ticker"
            value={ticker}
            onChange={(e) => onTicker(e.target.value.toUpperCase())}
            placeholder={t.tickerPlaceholder}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="calc-amount">{t.initialInvestmentLabel}</Label>
          <Input
            id="calc-amount"
            type="number"
            min="0"
            step="0.01"
            value={initialInvestment}
            onChange={(e) => onInitialInvestment(Number(e.target.value))}
          />
        </div>
      </div>

      {mode === "backtest" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="calc-start">{t.startDateLabel}</Label>
            <Input
              id="calc-start"
              type="date"
              value={startDate}
              onChange={(e) => onStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-end">{t.endDateLabel}</Label>
            <Input
              id="calc-end"
              type="date"
              value={endDate}
              onChange={(e) => onEndDate(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-project-start">{t.startDateLabel}</Label>
              <Input
                id="calc-project-start"
                type="date"
                value={projectStartDate}
                onChange={(e) => onProjectStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-project-end">{t.endDateLabel}</Label>
              <Input
                id="calc-project-end"
                type="date"
                value={projectEndDate}
                onChange={(e) => onProjectEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="calc-monthly">{t.monthlyContributionLabel}</Label>
            <Input
              id="calc-monthly"
              type="number"
              min="0"
              step="0.01"
              value={monthlyContribution}
              onChange={(e) => onMonthlyContribution(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-return-override">{t.annualReturnOverrideLabel}</Label>
              <Input
                id="calc-return-override"
                type="number"
                step="0.1"
                value={annualReturnOverride ?? ""}
                onChange={(e) => onAnnualReturnOverride(parseOptionalNumber(e.target.value))}
                placeholder={estimate ? estimate.annualPriceReturnPct.toFixed(1) : t.estimateAutoPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-yield-override">{t.dividendYieldOverrideLabel}</Label>
              <Input
                id="calc-yield-override"
                type="number"
                step="0.1"
                value={dividendYieldOverride ?? ""}
                onChange={(e) => onDividendYieldOverride(parseOptionalNumber(e.target.value))}
                placeholder={estimate ? estimate.annualDividendYieldPct.toFixed(1) : t.estimateAutoPlaceholder}
                disabled={!includeDividends}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDividends}
            onChange={(e) => {
              onIncludeDividends(e.target.checked);
              if (!e.target.checked) onDrip(false);
            }}
            className="w-4 h-4 rounded accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-foreground)]">{t.includeDividends}</span>
        </label>

        <label className={`flex items-center gap-2 ${includeDividends ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
          <input
            type="checkbox"
            checked={drip}
            disabled={!includeDividends}
            onChange={(e) => onDrip(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-foreground)]">{t.reinvestDividends}</span>
        </label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? t.calculating : t.calculateButton}
      </Button>
    </form>
  );
}
