"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TickerAutocompleteInput } from "@/components/calculators/stock/ticker-autocomplete-input";
import { StatCard } from "@/components/calculators/stock/stat-card";
import { CalculatorGrowthChart } from "@/components/calculators/stock/calculator-growth-chart";
import { useDict } from "@/components/language-provider";
import { formatCurrency } from "@/lib/utils";
import {
  projectFutureGrowth,
  analyzeStock,
  FutureProjectionError,
  type StockSnapshot,
  type DividendFrequency,
  type ContributionFrequency,
} from "@/lib/future-projection";
import type { StockHistoryError, StockHistoryPoint, StockHistoryResponse } from "@/app/api/calculator/stock-history/route";
import type { BucketCalcResult } from "./bucket-compound-fields";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

type Status = "idle" | "loading" | "error" | "success";

class StockFetchError extends Error {}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function tenYearsFromTodayStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 10);
  return d.toISOString().split("T")[0];
}

interface BucketStockFieldsProps {
  initialInvestment?: number;
  initialContribution?: number;
  onResult: (result: BucketCalcResult) => void;
}

export function BucketStockFields({ initialInvestment, initialContribution, onResult }: BucketStockFieldsProps) {
  const dict = useDict();
  const t = dict.calculator;

  const [ticker, setTicker] = useState("SPY");
  const [investment, setInvestment] = useState(String(initialInvestment ?? 10000));
  const [contributionAmount, setContributionAmount] = useState(String(initialContribution ?? 100));
  const [contributionFrequency, setContributionFrequency] = useState<ContributionFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(tenYearsFromTodayStr());

  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null);
  const [sharePrice, setSharePrice] = useState("0");
  const [priceGrowthPct, setPriceGrowthPct] = useState("0");
  const [dividendAmount, setDividendAmount] = useState("0");
  const [dividendFrequency, setDividendFrequency] = useState<DividendFrequency>("none");
  const [dividendGrowthPct, setDividendGrowthPct] = useState("0");

  const [loadStatus, setLoadStatus] = useState<Status>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<{ date: string; value: number }[] | null>(null);
  const [endingValue, setEndingValue] = useState(0);
  const [totalContributedResult, setTotalContributedResult] = useState(0);
  const [totalGrowthResult, setTotalGrowthResult] = useState(0);

  const [cachedSymbol, setCachedSymbol] = useState<string | null>(null);
  const [cachedSeries, setCachedSeries] = useState<StockHistoryPoint[] | null>(null);

  function handleTickerChange(value: string) {
    setTicker(value);
    setSnapshot(null);
    setLoadStatus("idle");
    setLoadError(null);
  }

  async function fetchSeriesForSymbol(symbol: string): Promise<StockHistoryPoint[]> {
    if (cachedSeries && symbol === cachedSymbol) return cachedSeries;
    const res = await fetch(`/api/calculator/stock-history?symbol=${encodeURIComponent(symbol)}`);
    const json = await res.json();
    if (!res.ok) {
      const err = json as StockHistoryError;
      throw new StockFetchError(t.errors[err.error] ?? err.message);
    }
    const series = (json as StockHistoryResponse).series;
    setCachedSymbol(symbol);
    setCachedSeries(series);
    return series;
  }

  async function handleLoad() {
    setLoadError(null);
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) {
      setLoadStatus("error");
      setLoadError(t.errors.missing_symbol);
      return;
    }
    setLoadStatus("loading");
    try {
      const series = await fetchSeriesForSymbol(symbol);
      const snap = analyzeStock(series);
      setSnapshot(snap);
      setSharePrice(String(snap.lastPrice));
      setPriceGrowthPct(String(snap.measuredPriceGrowthPct));
      setDividendAmount(String(snap.lastDividendAmount));
      setDividendFrequency(snap.dividendFrequency);
      setDividendGrowthPct(String(snap.measuredDividendGrowthPct));
      setLoadStatus("success");
    } catch (err) {
      setLoadStatus("error");
      if (err instanceof StockFetchError) setLoadError(err.message);
      else if (err instanceof FutureProjectionError) setLoadError(t.errors.insufficient_history);
      else setLoadError(t.errors.upstream_error);
    }
  }

  async function handleCalculate() {
    setErrorMessage(null);
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) {
      setStatus("error");
      setErrorMessage(t.errors.missing_symbol);
      return;
    }
    const investmentNum = parseFloat(investment) || 0;
    const contributionNum = parseFloat(contributionAmount) || 0;
    if (investmentNum < 0 || contributionNum < 0) {
      setStatus("error");
      setErrorMessage(t.errors.invalid_contribution);
      return;
    }
    if (investmentNum === 0 && contributionNum === 0) {
      setStatus("error");
      setErrorMessage(t.errors.no_contribution);
      return;
    }
    if (startDate >= endDate) {
      setStatus("error");
      setErrorMessage(t.errors.invalid_dates);
      return;
    }

    setStatus("loading");
    try {
      let snap = snapshot;
      let effective = {
        sharePrice: parseFloat(sharePrice) || 0,
        priceGrowthPct: parseFloat(priceGrowthPct) || 0,
        dividendAmount: parseFloat(dividendAmount) || 0,
        dividendFrequency,
        dividendGrowthPct: parseFloat(dividendGrowthPct) || 0,
      };

      if (!snap) {
        const series = await fetchSeriesForSymbol(symbol);
        snap = analyzeStock(series);
        effective = {
          sharePrice: snap.lastPrice,
          priceGrowthPct: snap.measuredPriceGrowthPct,
          dividendAmount: snap.lastDividendAmount,
          dividendFrequency: snap.dividendFrequency,
          dividendGrowthPct: snap.measuredDividendGrowthPct,
        };
        setSnapshot(snap);
        setSharePrice(String(effective.sharePrice));
        setPriceGrowthPct(String(effective.priceGrowthPct));
        setDividendAmount(String(effective.dividendAmount));
        setDividendFrequency(effective.dividendFrequency);
        setDividendGrowthPct(String(effective.dividendGrowthPct));
      }

      const computed = projectFutureGrowth({
        referencePrice: effective.sharePrice,
        priceGrowthPct: effective.priceGrowthPct,
        startingDividendPerShare: effective.dividendAmount,
        dividendGrowthPct: effective.dividendGrowthPct,
        dividendFrequency: effective.dividendFrequency,
        initialInvestment: investmentNum,
        contributionAmount: contributionNum,
        contributionFrequency,
        startDate,
        endDate,
        dividendMode: "drip",
      });

      setTimeline(computed.timeline);
      setEndingValue(computed.endingValue);
      setTotalContributedResult(computed.totalContributed);
      setTotalGrowthResult(computed.totalGrowth);
      setStatus("success");

      onResult({
        targetAmount: Math.round(computed.endingValue),
        targetDate: endDate,
        currentAmount: investmentNum,
        contributionAmount: contributionNum,
        contributionFrequency,
        projectionInput: {
          ticker: symbol,
          priceGrowthPct: effective.priceGrowthPct,
          dividendAmount: effective.dividendAmount,
          dividendFrequency: effective.dividendFrequency,
          dividendGrowthPct: effective.dividendGrowthPct,
          contributionAmount: contributionNum,
          contributionFrequency,
        },
        projectedValue: computed.endingValue,
        projectedDate: endDate,
      });
    } catch (err) {
      setStatus("error");
      if (err instanceof FutureProjectionError) setErrorMessage(t.errors.upstream_error);
      else if (err instanceof StockFetchError) setErrorMessage(err.message);
      else setErrorMessage(t.errors.upstream_error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bsf-ticker">{t.tickerLabel}</Label>
        <TickerAutocompleteInput
          id="bsf-ticker"
          value={ticker}
          onChange={handleTickerChange}
          placeholder={t.tickerPlaceholder}
          onLoad={handleLoad}
          loadStatus={loadStatus}
        />
        {loadStatus === "error" && loadError && <p className="text-xs text-[var(--color-danger)]">{loadError}</p>}
        {snapshot && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t.lastPriceLabel.replace("{ticker}", ticker).replace("{price}", snapshot.lastPrice.toFixed(2))}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bsf-investment">{t.initialInvestmentLabel}</Label>
          <Input id="bsf-investment" type="number" step="0.01" min="0" value={investment} onChange={(e) => setInvestment(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bsf-contribution">{t.contributionAmountLabel}</Label>
          <Input id="bsf-contribution" type="number" step="0.01" min="0" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bsf-frequency">{t.contributionFrequencyLabel}</Label>
          <select
            id="bsf-frequency"
            className={selectCls}
            value={contributionFrequency}
            onChange={(e) => setContributionFrequency(e.target.value as ContributionFrequency)}
          >
            <option value="weekly">{t.contributionFrequencyOptions.weekly}</option>
            <option value="biweekly">{t.contributionFrequencyOptions.biweekly}</option>
            <option value="monthly">{t.contributionFrequencyOptions.monthly}</option>
            <option value="quarterly">{t.contributionFrequencyOptions.quarterly}</option>
            <option value="annually">{t.contributionFrequencyOptions.annually}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bsf-end-date">{t.endDateLabel}</Label>
          <Input id="bsf-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <Button type="button" onClick={handleCalculate} disabled={status === "loading"} className="w-full">
        {status === "loading" ? t.calculating : t.calculateButton}
      </Button>

      {status === "error" && errorMessage && <p className="text-xs text-[var(--color-danger)]">{errorMessage}</p>}

      {status === "success" && timeline && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <StatCard label={dict.calculators.compound.endingValueLabel} value={formatCurrency(endingValue)} colorClass="text-[var(--color-primary)]" />
            <StatCard label={dict.calculators.compound.totalContributedLabel} value={formatCurrency(totalContributedResult)} />
            <StatCard label={dict.calculators.compound.totalGrowthLabel} value={formatCurrency(totalGrowthResult)} colorClass="text-emerald-600 dark:text-emerald-400" />
          </div>
          <CalculatorGrowthChart timeline={timeline} />
        </>
      )}
    </div>
  );
}
