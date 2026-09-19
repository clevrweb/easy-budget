"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CalculatorForm, dividendModeFrom } from "./calculator-form";
import { CalculatorResults } from "./calculator-results";
import { ProjectionResults } from "./projection-results";
import { CalculatorGrowthChart } from "./calculator-growth-chart";
import { useDict } from "@/components/language-provider";
import {
  computeCompoundGrowth,
  CompoundCalculatorError,
  type CompoundCalculatorResult,
} from "@/lib/compound-calculator";
import {
  projectFutureGrowth,
  estimateHistoricalReturns,
  FutureProjectionError,
  type FutureProjectionResult,
  type HistoricalReturnEstimate,
} from "@/lib/future-projection";
import type { CalculatorMode } from "./calculator-mode-toggle";
import type { StockHistoryError, StockHistoryPoint, StockHistoryResponse } from "@/app/api/calculator/stock-history/route";

type Status = "idle" | "loading" | "error" | "success";

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

function mapProjectionErrorMessage(message: string): "invalid_contribution" | "no_contribution" | "invalid_dates" | "upstream_error" {
  if (message.includes("cannot be negative")) return "invalid_contribution";
  if (message.includes("greater than 0")) return "no_contribution";
  if (message.includes("before end date") || message.includes("at least one month")) return "invalid_dates";
  return "upstream_error";
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
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [projectStartDate, setProjectStartDate] = useState(todayStr());
  const [projectEndDate, setProjectEndDate] = useState(tenYearsFromTodayStr());
  const [annualReturnOverride, setAnnualReturnOverride] = useState<number | null>(null);
  const [dividendYieldOverride, setDividendYieldOverride] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<HistoricalReturnEstimate | null>(null);
  const [usingOverrideAtCalc, setUsingOverrideAtCalc] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CompoundCalculatorResult | null>(null);
  const [projectionResult, setProjectionResult] = useState<FutureProjectionResult | null>(null);

  const [cachedSymbol, setCachedSymbol] = useState<string | null>(null);
  const [cachedSeries, setCachedSeries] = useState<StockHistoryPoint[] | null>(null);

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
      if (initialInvestment < 0 || monthlyContribution < 0) {
        setStatus("error");
        setErrorMessage(t.errors.invalid_contribution);
        return;
      }
      if (initialInvestment === 0 && monthlyContribution === 0) {
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
      let series = cachedSeries;

      if (!series || symbol !== cachedSymbol) {
        const res = await fetch(`/api/calculator/stock-history?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();

        if (!res.ok) {
          const err = json as StockHistoryError;
          setStatus("error");
          setErrorMessage(t.errors[err.error] ?? err.message);
          return;
        }

        series = (json as StockHistoryResponse).series;
        setCachedSymbol(symbol);
        setCachedSeries(series);
      }

      const dividendMode = dividendModeFrom(includeDividends, drip);

      if (mode === "backtest") {
        const computed = computeCompoundGrowth({
          prices: series,
          initialInvestment,
          startDate,
          endDate,
          dividendMode,
        });
        setResult(computed);
      } else {
        const est = estimateHistoricalReturns(series);
        setEstimate(est);
        const overridden = annualReturnOverride !== null || dividendYieldOverride !== null;
        setUsingOverrideAtCalc(overridden);
        const annualPriceReturnPct = annualReturnOverride ?? est.annualPriceReturnPct;
        const annualDividendYieldPct = dividendYieldOverride ?? est.annualDividendYieldPct;
        const referencePrice = series[series.length - 1].close;
        const computed = projectFutureGrowth({
          referencePrice,
          annualPriceReturnPct,
          annualDividendYieldPct,
          initialInvestment,
          monthlyContribution,
          startDate: projectStartDate,
          endDate: projectEndDate,
          dividendMode,
        });
        setProjectionResult(computed);
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      if (err instanceof CompoundCalculatorError) {
        setErrorMessage(t.errors[mapCalculatorErrorMessage(err.message)]);
      } else if (err instanceof FutureProjectionError) {
        setErrorMessage(t.errors[mapProjectionErrorMessage(err.message)]);
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
          ticker={ticker} onTicker={setTicker}
          initialInvestment={initialInvestment} onInitialInvestment={setInitialInvestment}
          startDate={startDate} onStartDate={setStartDate}
          endDate={endDate} onEndDate={setEndDate}
          monthlyContribution={monthlyContribution} onMonthlyContribution={setMonthlyContribution}
          projectStartDate={projectStartDate} onProjectStartDate={setProjectStartDate}
          projectEndDate={projectEndDate} onProjectEndDate={setProjectEndDate}
          annualReturnOverride={annualReturnOverride} onAnnualReturnOverride={setAnnualReturnOverride}
          dividendYieldOverride={dividendYieldOverride} onDividendYieldOverride={setDividendYieldOverride}
          estimate={estimate}
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
              estimate={estimate}
              usingOverride={usingOverrideAtCalc}
              ticker={ticker}
            />

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
              <h2 className="font-semibold text-[var(--color-foreground)] mb-1">{t.chartTitle}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-5">{ticker}</p>
              <CalculatorGrowthChart timeline={projectionResult.timeline} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
