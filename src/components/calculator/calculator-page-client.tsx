"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CalculatorForm, dividendModeFrom } from "./calculator-form";
import { CalculatorResults } from "./calculator-results";
import { ProjectionResults } from "./projection-results";
import { CalculatorGrowthChart } from "./calculator-growth-chart";
import { SavingsPlanForm } from "./savings-plan-form";
import { useDict } from "@/components/language-provider";
import {
  computeCompoundGrowth,
  CompoundCalculatorError,
  type CompoundCalculatorResult,
} from "@/lib/compound-calculator";
import {
  projectFutureGrowth,
  analyzeStock,
  FutureProjectionError,
  type FutureProjectionResult,
  type StockSnapshot,
  type DividendFrequency,
  type ContributionFrequency,
} from "@/lib/future-projection";
import type { CalculatorMode } from "./calculator-mode-toggle";
import type { StockHistoryError, StockHistoryPoint, StockHistoryResponse } from "@/app/api/calculator/stock-history/route";

type Status = "idle" | "loading" | "error" | "success";

class StockFetchError extends Error {}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function fiveYearsAgoStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 5);
  return d.toISOString().split("T")[0];
}

function tenYearsFromTodayStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 10);
  return d.toISOString().split("T")[0];
}

function mapCalculatorErrorMessage(message: string): "invalid_amount" | "invalid_dates" | "no_overlap" | "upstream_error" {
  if (message.includes("Initial investment")) return "invalid_amount";
  if (message.includes("before end date")) return "invalid_dates";
  if (message.includes("No overlapping")) return "no_overlap";
  return "upstream_error";
}

function mapProjectionErrorMessage(
  message: string
): "invalid_contribution" | "no_contribution" | "invalid_dates" | "invalid_share_price" | "invalid_dividend_amount" | "invalid_dividend_growth" | "upstream_error" {
  if (message.includes("Dividend amount")) return "invalid_dividend_amount";
  if (message.includes("Dividend growth rate")) return "invalid_dividend_growth";
  if (message.includes("share price")) return "invalid_share_price";
  if (message.includes("cannot be negative")) return "invalid_contribution";
  if (message.includes("greater than 0")) return "no_contribution";
  if (message.includes("before end date") || message.includes("at least one month")) return "invalid_dates";
  return "upstream_error";
}

interface ProjectionAssumptions {
  sharePrice: number;
  priceGrowthPct: number;
  dividendAmount: number;
  dividendFrequency: DividendFrequency;
  dividendGrowthPct: number;
}

interface PlanInputs {
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  startDate: string;
  endDate: string;
}

export function CalculatorPageClient() {
  const dict = useDict();
  const t = dict.calculator;

  const [mode, setMode] = useState<CalculatorMode>("backtest");

  const [ticker, setTicker] = useState("SPY");
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [includeDividends, setIncludeDividends] = useState(true);
  const [drip, setDrip] = useState(true);

  // backtest-only
  const [startDate, setStartDate] = useState(fiveYearsAgoStr());
  const [endDate, setEndDate] = useState(todayStr());

  // project-only
  const [contributionAmount, setContributionAmount] = useState(100);
  const [contributionFrequency, setContributionFrequency] = useState<ContributionFrequency>("monthly");
  const [projectStartDate, setProjectStartDate] = useState(todayStr());
  const [projectEndDate, setProjectEndDate] = useState(tenYearsFromTodayStr());

  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null);
  const [sharePrice, setSharePrice] = useState(0);
  const [priceGrowthPct, setPriceGrowthPct] = useState(0);
  const [dividendAmount, setDividendAmount] = useState(0);
  const [dividendFrequency, setDividendFrequency] = useState<DividendFrequency>("none");
  const [dividendGrowthPct, setDividendGrowthPct] = useState(0);

  const [loadStatus, setLoadStatus] = useState<Status>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projectionAssumptions, setProjectionAssumptions] = useState<ProjectionAssumptions | null>(null);
  const [planInputs, setPlanInputs] = useState<PlanInputs | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CompoundCalculatorResult | null>(null);
  const [projectionResult, setProjectionResult] = useState<FutureProjectionResult | null>(null);

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

  async function handleLoadStock() {
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
      setSharePrice(snap.lastPrice);
      setPriceGrowthPct(snap.measuredPriceGrowthPct);
      setDividendAmount(snap.lastDividendAmount);
      setDividendFrequency(snap.dividendFrequency);
      setDividendGrowthPct(snap.measuredDividendGrowthPct);
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

    if (!ticker.trim()) {
      setStatus("error");
      setErrorMessage(t.errors.missing_symbol);
      return;
    }
    if (mode === "backtest") {
      if (initialInvestment <= 0) {
        setStatus("error");
        setErrorMessage(t.errors.invalid_amount);
        return;
      }
      if (startDate >= endDate) {
        setStatus("error");
        setErrorMessage(t.errors.invalid_dates);
        return;
      }
    } else {
      if (initialInvestment < 0 || contributionAmount < 0) {
        setStatus("error");
        setErrorMessage(t.errors.invalid_contribution);
        return;
      }
      if (initialInvestment === 0 && contributionAmount === 0) {
        setStatus("error");
        setErrorMessage(t.errors.no_contribution);
        return;
      }
      if (projectStartDate >= projectEndDate) {
        setStatus("error");
        setErrorMessage(t.errors.invalid_dates);
        return;
      }
    }

    setStatus("loading");

    try {
      const symbol = ticker.trim().toUpperCase();
      const dividendMode = dividendModeFrom(includeDividends, drip);

      if (mode === "backtest") {
        const series = await fetchSeriesForSymbol(symbol);
        const computed = computeCompoundGrowth({
          prices: series,
          initialInvestment,
          startDate,
          endDate,
          dividendMode,
        });
        setResult(computed);
      } else {
        let snap = snapshot;
        let effective: ProjectionAssumptions = {
          sharePrice, priceGrowthPct, dividendAmount, dividendFrequency, dividendGrowthPct,
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
          setSharePrice(effective.sharePrice);
          setPriceGrowthPct(effective.priceGrowthPct);
          setDividendAmount(effective.dividendAmount);
          setDividendFrequency(effective.dividendFrequency);
          setDividendGrowthPct(effective.dividendGrowthPct);
        }

        const computed = projectFutureGrowth({
          referencePrice: effective.sharePrice,
          priceGrowthPct: effective.priceGrowthPct,
          startingDividendPerShare: effective.dividendAmount,
          dividendGrowthPct: effective.dividendGrowthPct,
          dividendFrequency: effective.dividendFrequency,
          initialInvestment,
          contributionAmount,
          contributionFrequency,
          startDate: projectStartDate,
          endDate: projectEndDate,
          dividendMode,
        });
        setProjectionResult(computed);
        setProjectionAssumptions(effective);
        setPlanInputs({
          contributionAmount,
          contributionFrequency,
          startDate: projectStartDate,
          endDate: projectEndDate,
        });
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      if (err instanceof CompoundCalculatorError) {
        setErrorMessage(t.errors[mapCalculatorErrorMessage(err.message)]);
      } else if (err instanceof FutureProjectionError) {
        setErrorMessage(t.errors[mapProjectionErrorMessage(err.message)]);
      } else if (err instanceof StockFetchError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.errors.upstream_error);
      }
    }
  }

  return (
    <>
      <Topbar title={t.title} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <CalculatorForm
          mode={mode} onMode={setMode}
          ticker={ticker} onTicker={handleTickerChange}
          initialInvestment={initialInvestment} onInitialInvestment={setInitialInvestment}
          startDate={startDate} onStartDate={setStartDate}
          endDate={endDate} onEndDate={setEndDate}
          contributionAmount={contributionAmount} onContributionAmount={setContributionAmount}
          contributionFrequency={contributionFrequency} onContributionFrequency={setContributionFrequency}
          projectStartDate={projectStartDate} onProjectStartDate={setProjectStartDate}
          projectEndDate={projectEndDate} onProjectEndDate={setProjectEndDate}
          loadStatus={loadStatus} loadError={loadError} onLoad={handleLoadStock} snapshot={snapshot}
          sharePrice={sharePrice} onSharePrice={setSharePrice}
          priceGrowthPct={priceGrowthPct} onPriceGrowthPct={setPriceGrowthPct}
          dividendAmount={dividendAmount} onDividendAmount={setDividendAmount}
          dividendFrequency={dividendFrequency} onDividendFrequency={setDividendFrequency}
          dividendGrowthPct={dividendGrowthPct} onDividendGrowthPct={setDividendGrowthPct}
          includeDividends={includeDividends} onIncludeDividends={setIncludeDividends}
          drip={drip} onDrip={setDrip}
          loading={status === "loading"}
          onSubmit={handleCalculate}
        />

        {status === "error" && errorMessage && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {errorMessage}
          </div>
        )}

        {mode === "backtest" && result && (
          <>
            {result.warnings.map((warning) => {
              const [kind, date] = warning.split(":");
              const text = kind === "startDateClamped" ? t.startDateClampedWarning : t.endDateClampedWarning;
              return (
                <p key={warning} className="text-xs text-[var(--color-muted-foreground)]">
                  {text.replace("{date}", date)}
                </p>
              );
            })}

            <CalculatorResults result={result} />

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
              <h2 className="font-semibold text-[var(--color-foreground)] mb-1">{t.chartTitle}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-5">{ticker}</p>
              <CalculatorGrowthChart timeline={result.timeline} />
            </div>
          </>
        )}

        {mode === "project" && projectionResult && (
          <>
            {projectionResult.warnings.map((warning) => {
              const [, date] = warning.split(":");
              return (
                <p key={warning} className="text-xs text-[var(--color-muted-foreground)]">
                  {t.projectionEndDateCappedWarning.replace("{date}", date)}
                </p>
              );
            })}

            <ProjectionResults
              result={projectionResult}
              assumptions={projectionAssumptions}
              ticker={ticker}
            />

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
              <h2 className="font-semibold text-[var(--color-foreground)] mb-1">{t.chartTitle}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-5">{ticker}</p>
              <CalculatorGrowthChart timeline={projectionResult.timeline} />
            </div>

            {planInputs && planInputs.contributionAmount > 0 && (
              <SavingsPlanForm
                contributionAmount={planInputs.contributionAmount}
                contributionFrequency={planInputs.contributionFrequency}
                startDate={planInputs.startDate}
                endDate={planInputs.endDate}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
