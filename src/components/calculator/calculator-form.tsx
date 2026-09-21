"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";
import type { DividendMode } from "@/lib/compound-calculator";
import type { ContributionFrequency, DividendFrequency, StockSnapshot } from "@/lib/future-projection";
import { CalculatorModeToggle, type CalculatorMode } from "./calculator-mode-toggle";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

type LoadStatus = "idle" | "loading" | "error" | "success";

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
  contributionAmount: number;
  onContributionAmount: (value: number) => void;
  contributionFrequency: ContributionFrequency;
  onContributionFrequency: (value: ContributionFrequency) => void;
  projectStartDate: string;
  onProjectStartDate: (value: string) => void;
  projectEndDate: string;
  onProjectEndDate: (value: string) => void;

  loadStatus: LoadStatus;
  loadError: string | null;
  onLoad: () => void;
  snapshot: StockSnapshot | null;

  sharePrice: number;
  onSharePrice: (value: number) => void;
  priceGrowthPct: number;
  onPriceGrowthPct: (value: number) => void;
  dividendAmount: number;
  onDividendAmount: (value: number) => void;
  dividendFrequency: DividendFrequency;
  onDividendFrequency: (value: DividendFrequency) => void;
  dividendGrowthPct: number;
  onDividendGrowthPct: (value: number) => void;

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

export function CalculatorForm({
  mode, onMode,
  ticker, onTicker,
  initialInvestment, onInitialInvestment,
  startDate, onStartDate,
  endDate, onEndDate,
  contributionAmount, onContributionAmount,
  contributionFrequency, onContributionFrequency,
  projectStartDate, onProjectStartDate,
  projectEndDate, onProjectEndDate,
  loadStatus, loadError, onLoad, snapshot,
  sharePrice, onSharePrice,
  priceGrowthPct, onPriceGrowthPct,
  dividendAmount, onDividendAmount,
  dividendFrequency, onDividendFrequency,
  dividendGrowthPct, onDividendGrowthPct,
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
          {mode === "project" ? (
            <div className="flex gap-2">
              <Input
                id="calc-ticker"
                className="flex-1"
                value={ticker}
                onChange={(e) => onTicker(e.target.value.toUpperCase())}
                placeholder={t.tickerPlaceholder}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={onLoad}
                disabled={loadStatus === "loading" || !ticker.trim()}
              >
                {loadStatus === "loading" ? t.loadingButton : t.loadButton}
              </Button>
            </div>
          ) : (
            <Input
              id="calc-ticker"
              value={ticker}
              onChange={(e) => onTicker(e.target.value.toUpperCase())}
              placeholder={t.tickerPlaceholder}
              required
            />
          )}
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

      {mode === "project" && loadStatus === "error" && loadError && (
        <p className="text-xs text-[var(--color-danger)]">{loadError}</p>
      )}

      {mode === "project" && snapshot && (
        <div className="rounded-lg bg-[var(--color-muted)] px-3 py-2 space-y-0.5 text-xs text-[var(--color-muted-foreground)]">
          <p>{t.lastPriceLabel.replace("{ticker}", ticker).replace("{price}", snapshot.lastPrice.toFixed(2))}</p>
          <p>
            {t.dividendYieldLabel
              .replace("{pct}", snapshot.currentDividendYieldPct.toFixed(2))
              .replace("{amount}", snapshot.currentDividendAnnualAmount.toFixed(2))}
          </p>
          <p>
            {t.measuredLabel
              .replace("{dividendPct}", snapshot.measuredDividendGrowthPct.toFixed(2))
              .replace("{pricePct}", snapshot.measuredPriceGrowthPct.toFixed(2))}
          </p>
          {snapshot.insufficientHistory && (
            <p className="text-[var(--color-warning)]">
              {t.limitedHistoryWarning.replace("{years}", snapshot.yearsOfHistory.toFixed(1))}
            </p>
          )}
          {snapshot.insufficientDividendHistory && (
            <p className="text-[var(--color-warning)]">{t.insufficientDividendHistoryWarning}</p>
          )}
        </div>
      )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-contribution">{t.contributionAmountLabel}</Label>
              <Input
                id="calc-contribution"
                type="number"
                min="0"
                step="0.01"
                value={contributionAmount}
                onChange={(e) => onContributionAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-contribution-frequency">{t.contributionFrequencyLabel}</Label>
              <select
                id="calc-contribution-frequency"
                className={selectCls}
                value={contributionFrequency}
                onChange={(e) => onContributionFrequency(e.target.value as ContributionFrequency)}
              >
                <option value="weekly">{t.contributionFrequencyOptions.weekly}</option>
                <option value="monthly">{t.contributionFrequencyOptions.monthly}</option>
                <option value="quarterly">{t.contributionFrequencyOptions.quarterly}</option>
                <option value="annually">{t.contributionFrequencyOptions.annually}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-share-price">{t.sharePriceLabel}</Label>
              <Input
                id="calc-share-price"
                type="number"
                min="0"
                step="0.01"
                value={sharePrice}
                onChange={(e) => onSharePrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-price-growth">{t.priceGrowthRateLabel}</Label>
              <Input
                id="calc-price-growth"
                type="number"
                step="0.1"
                value={priceGrowthPct}
                onChange={(e) => onPriceGrowthPct(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-dividend-amount">{t.dividendAmountLabel}</Label>
              <Input
                id="calc-dividend-amount"
                type="number"
                min="0"
                step="0.001"
                value={dividendAmount}
                onChange={(e) => onDividendAmount(Number(e.target.value))}
                disabled={dividendFrequency === "none"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-dividend-frequency">{t.dividendFrequencyLabel}</Label>
              <select
                id="calc-dividend-frequency"
                className={selectCls}
                value={dividendFrequency}
                onChange={(e) => onDividendFrequency(e.target.value as DividendFrequency)}
              >
                <option value="monthly">{t.dividendFrequencyOptions.monthly}</option>
                <option value="quarterly">{t.dividendFrequencyOptions.quarterly}</option>
                <option value="semiannual">{t.dividendFrequencyOptions.semiannual}</option>
                <option value="annual">{t.dividendFrequencyOptions.annual}</option>
                <option value="none">{t.dividendFrequencyOptions.none}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-dividend-growth">{t.dividendGrowthRateLabel}</Label>
              <Input
                id="calc-dividend-growth"
                type="number"
                step="0.1"
                value={dividendGrowthPct}
                onChange={(e) => onDividendGrowthPct(Number(e.target.value))}
                disabled={dividendFrequency === "none"}
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
