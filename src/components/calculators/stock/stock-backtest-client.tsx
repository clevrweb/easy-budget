"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CalculatorForm, dividendModeFrom } from "./calculator-form";
import { CalculatorResults } from "./calculator-results";
import { CalculatorGrowthChart } from "./calculator-growth-chart";
import { useDict } from "@/components/language-provider";
import {
  computeCompoundGrowth,
  CompoundCalculatorError,
  type CompoundCalculatorResult,
} from "@/lib/compound-calculator";
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

function mapCalculatorErrorMessage(message: string): "invalid_amount" | "invalid_dates" | "no_overlap" | "upstream_error" {
  if (message.includes("Initial investment")) return "invalid_amount";
  if (message.includes("before end date")) return "invalid_dates";
  if (message.includes("No overlapping")) return "no_overlap";
  return "upstream_error";
}

export function StockBacktestClient() {
  const dict = useDict();
  const t = dict.calculator;

  const [ticker, setTicker] = useState("SPY");
  const [initialInvestment, setInitialInvestment] = useState("10000");
  const [includeDividends, setIncludeDividends] = useState(true);
  const [drip, setDrip] = useState(true);
  const [startDate, setStartDate] = useState(fiveYearsAgoStr());
  const [endDate, setEndDate] = useState(todayStr());

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CompoundCalculatorResult | null>(null);

  async function fetchSeriesForSymbol(symbol: string): Promise<StockHistoryPoint[]> {
    const res = await fetch(`/api/calculator/stock-history?symbol=${encodeURIComponent(symbol)}`);
    const json = await res.json();
    if (!res.ok) {
      const err = json as StockHistoryError;
      throw new StockFetchError(t.errors[err.error] ?? err.message);
    }
    return (json as StockHistoryResponse).series;
  }

  async function handleCalculate() {
    setErrorMessage(null);

    if (!ticker.trim()) {
      setStatus("error");
      setErrorMessage(t.errors.missing_symbol);
      return;
    }
    const initialInvestmentNum = parseFloat(initialInvestment) || 0;
    if (initialInvestmentNum <= 0) {
      setStatus("error");
      setErrorMessage(t.errors.invalid_amount);
      return;
    }
    if (startDate >= endDate) {
      setStatus("error");
      setErrorMessage(t.errors.invalid_dates);
      return;
    }

    setStatus("loading");

    try {
      const series = await fetchSeriesForSymbol(ticker.trim().toUpperCase());
      const computed = computeCompoundGrowth({
        prices: series,
        initialInvestment: initialInvestmentNum,
        startDate,
        endDate,
        dividendMode: dividendModeFrom(includeDividends, drip),
      });
      setResult(computed);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      if (err instanceof CompoundCalculatorError) {
        setErrorMessage(t.errors[mapCalculatorErrorMessage(err.message)]);
      } else if (err instanceof StockFetchError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.errors.upstream_error);
      }
    }
  }

  return (
    <>
      <Topbar title={t.titleBacktest} backHref="/calculators" />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <CalculatorForm
          mode="backtest"
          ticker={ticker} onTicker={setTicker}
          initialInvestment={initialInvestment} onInitialInvestment={setInitialInvestment}
          startDate={startDate} onStartDate={setStartDate}
          endDate={endDate} onEndDate={setEndDate}
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

        {result && (
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
      </main>
    </>
  );
}
