"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { useDict } from "@/components/language-provider";
import type { DividendMode } from "@/lib/compound-calculator";
import type { ContributionFrequency, DividendFrequency, StockSnapshot } from "@/lib/future-projection";
import type { SymbolMatch, SymbolSearchResponse } from "@/app/api/calculator/symbol-search/route";

export type CalculatorMode = "backtest" | "project";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50 disabled:cursor-not-allowed";

type LoadStatus = "idle" | "loading" | "error" | "success";

interface CalculatorFormProps {
  mode: CalculatorMode;

  ticker: string;
  onTicker: (value: string) => void;
  initialInvestment: string;
  onInitialInvestment: (value: string) => void;

  // backtest-only
  startDate?: string;
  onStartDate?: (value: string) => void;
  endDate?: string;
  onEndDate?: (value: string) => void;

  // project-only
  contributionAmount?: string;
  onContributionAmount?: (value: string) => void;
  contributionFrequency?: ContributionFrequency;
  onContributionFrequency?: (value: ContributionFrequency) => void;
  projectStartDate?: string;
  onProjectStartDate?: (value: string) => void;
  projectEndDate?: string;
  onProjectEndDate?: (value: string) => void;

  loadStatus?: LoadStatus;
  loadError?: string | null;
  onLoad?: () => void;
  snapshot?: StockSnapshot | null;

  sharePrice?: string;
  onSharePrice?: (value: string) => void;
  priceGrowthPct?: string;
  onPriceGrowthPct?: (value: string) => void;
  dividendAmount?: string;
  onDividendAmount?: (value: string) => void;
  dividendFrequency?: DividendFrequency;
  onDividendFrequency?: (value: DividendFrequency) => void;
  dividendGrowthPct?: string;
  onDividendGrowthPct?: (value: string) => void;

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
  mode,
  ticker, onTicker,
  initialInvestment, onInitialInvestment,
  startDate = "", onStartDate = () => {},
  endDate = "", onEndDate = () => {},
  contributionAmount = "0", onContributionAmount = () => {},
  contributionFrequency = "monthly", onContributionFrequency = () => {},
  projectStartDate = "", onProjectStartDate = () => {},
  projectEndDate = "", onProjectEndDate = () => {},
  loadStatus = "idle", loadError = null, onLoad = () => {}, snapshot = null,
  sharePrice = "0", onSharePrice = () => {},
  priceGrowthPct = "0", onPriceGrowthPct = () => {},
  dividendAmount = "0", onDividendAmount = () => {},
  dividendFrequency = "none", onDividendFrequency = () => {},
  dividendGrowthPct = "0", onDividendGrowthPct = () => {},
  includeDividends, onIncludeDividends,
  drip, onDrip,
  loading, onSubmit,
}: CalculatorFormProps) {
  const dict = useDict();
  const t = dict.calculator;
  const projectLocked = mode === "project" && loadStatus !== "success";

  const [suggestions, setSuggestions] = useState<SymbolMatch[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const tickerWrapRef = useRef<HTMLDivElement>(null);
  // Skips the very first run -- otherwise every page load fires a search for
  // whatever ticker is pre-filled (e.g. "SPY") before the user has typed
  // anything, wasting a call against Alpha Vantage's scarce free-tier quota.
  const tickerTouchedRef = useRef(false);

  useEffect(() => {
    if (!tickerTouchedRef.current) {
      tickerTouchedRef.current = true;
      return;
    }
    if (!ticker.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(`/api/calculator/symbol-search?q=${encodeURIComponent(ticker.trim())}`);
        if (res.ok) {
          const json = (await res.json()) as SymbolSearchResponse;
          setSuggestions(json.matches);
          setSuggestionsOpen(true);
        }
      } catch {
        // Silently ignore -- autocomplete is a convenience, not required for the form to work.
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ticker]);

  useEffect(() => {
    if (!suggestionsOpen) return;
    function handler(e: MouseEvent) {
      if (tickerWrapRef.current && !tickerWrapRef.current.contains(e.target as Node)) setSuggestionsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [suggestionsOpen]);

  function selectSuggestion(symbol: string) {
    onTicker(symbol);
    setSuggestionsOpen(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 relative" ref={tickerWrapRef}>
          <Label htmlFor="calc-ticker">{t.tickerLabel}</Label>
          {mode === "project" ? (
            <>
              <div className="flex gap-2">
                <Input
                  id="calc-ticker"
                  className="flex-1"
                  value={ticker}
                  onChange={(e) => onTicker(e.target.value.toUpperCase())}
                  onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
                  placeholder={t.tickerPlaceholder}
                  autoComplete="off"
                  required
                />
                <Button
                  type="button"
                  onClick={onLoad}
                  disabled={loadStatus === "loading" || !ticker.trim()}
                >
                  <Download className="w-4 h-4" />
                  {loadStatus === "loading" ? t.loadingButton : t.loadButton}
                </Button>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{t.loadButtonHint}</p>
            </>
          ) : (
            <Input
              id="calc-ticker"
              value={ticker}
              onChange={(e) => onTicker(e.target.value.toUpperCase())}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              placeholder={t.tickerPlaceholder}
              autoComplete="off"
              required
            />
          )}

          {suggestionsOpen && ticker.trim() && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-card)] max-h-60 overflow-y-auto">
              {suggestionsLoading ? (
                <p className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">{t.loadingButton}</p>
              ) : suggestions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">{t.noMatches}</p>
              ) : (
                suggestions.map((m) => (
                  <button
                    key={m.symbol}
                    type="button"
                    onClick={() => selectSuggestion(m.symbol)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--color-muted)] transition-colors"
                  >
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">{m.symbol}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)] ml-2">{m.name}</span>
                  </button>
                ))
              )}
            </div>
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
            onChange={(e) => onInitialInvestment(e.target.value)}
            disabled={projectLocked}
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
                disabled={projectLocked}
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
                disabled={projectLocked}
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
                onChange={(e) => onContributionAmount(e.target.value)}
                disabled={projectLocked}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-contribution-frequency">{t.contributionFrequencyLabel}</Label>
              <select
                id="calc-contribution-frequency"
                className={selectCls}
                value={contributionFrequency}
                onChange={(e) => onContributionFrequency(e.target.value as ContributionFrequency)}
                disabled={projectLocked}
              >
                <option value="weekly">{t.contributionFrequencyOptions.weekly}</option>
                <option value="biweekly">{t.contributionFrequencyOptions.biweekly}</option>
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
                step="any"
                value={sharePrice}
                onChange={(e) => onSharePrice(e.target.value)}
                disabled={projectLocked}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-price-growth">{t.priceGrowthRateLabel}</Label>
              <Input
                id="calc-price-growth"
                type="number"
                step="any"
                value={priceGrowthPct}
                onChange={(e) => onPriceGrowthPct(e.target.value)}
                disabled={projectLocked}
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
                step="any"
                value={dividendAmount}
                onChange={(e) => onDividendAmount(e.target.value)}
                disabled={projectLocked || dividendFrequency === "none"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-dividend-frequency">{t.dividendFrequencyLabel}</Label>
              <select
                id="calc-dividend-frequency"
                className={selectCls}
                value={dividendFrequency}
                onChange={(e) => onDividendFrequency(e.target.value as DividendFrequency)}
                disabled={projectLocked}
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
                step="any"
                value={dividendGrowthPct}
                onChange={(e) => onDividendGrowthPct(e.target.value)}
                disabled={projectLocked || dividendFrequency === "none"}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className={`flex items-center gap-2 ${projectLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={includeDividends}
            disabled={projectLocked}
            onChange={(e) => {
              onIncludeDividends(e.target.checked);
              if (!e.target.checked) onDrip(false);
            }}
            className="w-4 h-4 rounded accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-foreground)]">{t.includeDividends}</span>
        </label>

        <label className={`flex items-center gap-2 ${!includeDividends || projectLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={drip}
            disabled={!includeDividends || projectLocked}
            onChange={(e) => onDrip(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-foreground)]">{t.reinvestDividends}</span>
        </label>
      </div>

      <Button type="submit" disabled={loading || projectLocked}>
        {loading ? t.calculating : t.calculateButton}
      </Button>
    </form>
  );
}
