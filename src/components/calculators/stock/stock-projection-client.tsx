"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { saveBucketProjectionAction } from "@/app/(dashboard)/savings-plan/actions";
import { CalculatorForm, dividendModeFrom } from "./calculator-form";
import { ProjectionResults } from "./projection-results";
import { CalculatorGrowthChart } from "./calculator-growth-chart";
import { SavingsPlanForm, type BucketContext } from "./savings-plan-form";
import { useDict } from "@/components/language-provider";
import {
  projectFutureGrowth,
  analyzeStock,
  FutureProjectionError,
  type FutureProjectionResult,
  type StockSnapshot,
  type DividendFrequency,
  type ContributionFrequency,
} from "@/lib/future-projection";
import type { StockHistoryError, StockHistoryPoint, StockHistoryResponse } from "@/app/api/calculator/stock-history/route";
import type { Group, SavingsBucket } from "@/types/database";

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

interface StockProjectionClientProps {
  groups: Group[];
  bucket?: SavingsBucket | null;
}

export function StockProjectionClient({ groups, bucket }: StockProjectionClientProps) {
  const dict = useDict();
  const t = dict.calculator;
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [savedToBucket, setSavedToBucket] = useState(false);

  const bucketInput = (bucket?.projection_input ?? {}) as { ticker?: string };

  const [ticker, setTicker] = useState(bucketInput.ticker ?? "SPY");
  const [initialInvestment, setInitialInvestment] = useState(String(bucket?.current_amount ?? 10000));
  const [includeDividends, setIncludeDividends] = useState(true);
  const [drip, setDrip] = useState(true);

  const [contributionAmount, setContributionAmount] = useState(String(bucket?.contribution_amount ?? 100));
  const [contributionFrequency, setContributionFrequency] = useState<ContributionFrequency>(
    (bucket?.contribution_frequency as ContributionFrequency) ?? "monthly"
  );
  const [projectStartDate, setProjectStartDate] = useState(todayStr());
  const [projectEndDate, setProjectEndDate] = useState(
    bucket?.target_date && bucket.target_date > todayStr() ? bucket.target_date : tenYearsFromTodayStr()
  );

  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null);
  const [sharePrice, setSharePrice] = useState("0");
  const [priceGrowthPct, setPriceGrowthPct] = useState("0");
  const [dividendAmount, setDividendAmount] = useState("0");
  const [dividendFrequency, setDividendFrequency] = useState<DividendFrequency>("none");
  const [dividendGrowthPct, setDividendGrowthPct] = useState("0");

  const [loadStatus, setLoadStatus] = useState<Status>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projectionAssumptions, setProjectionAssumptions] = useState<ProjectionAssumptions | null>(null);
  const [planInputs, setPlanInputs] = useState<PlanInputs | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    if (!ticker.trim()) {
      setStatus("error");
      setErrorMessage(t.errors.missing_symbol);
      return;
    }
    const initialInvestmentNum = parseFloat(initialInvestment) || 0;
    const contributionAmountNum = parseFloat(contributionAmount) || 0;

    if (initialInvestmentNum < 0 || contributionAmountNum < 0) {
      setStatus("error");
      setErrorMessage(t.errors.invalid_contribution);
      return;
    }
    if (initialInvestmentNum === 0 && contributionAmountNum === 0) {
      setStatus("error");
      setErrorMessage(t.errors.no_contribution);
      return;
    }
    if (projectStartDate >= projectEndDate) {
      setStatus("error");
      setErrorMessage(t.errors.invalid_dates);
      return;
    }

    setStatus("loading");

    try {
      const symbol = ticker.trim().toUpperCase();
      const dividendMode = dividendModeFrom(includeDividends, drip);

      let snap = snapshot;
      let effective: ProjectionAssumptions = {
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
        initialInvestment: initialInvestmentNum,
        contributionAmount: contributionAmountNum,
        contributionFrequency,
        startDate: projectStartDate,
        endDate: projectEndDate,
        dividendMode,
      });
      setProjectionResult(computed);
      setProjectionAssumptions(effective);
      setPlanInputs({ contributionAmount: contributionAmountNum, contributionFrequency, startDate: projectStartDate, endDate: projectEndDate });

      setStatus("success");
      setSavedToBucket(false);
    } catch (err) {
      setStatus("error");
      if (err instanceof FutureProjectionError) {
        setErrorMessage(t.errors[mapProjectionErrorMessage(err.message)]);
      } else if (err instanceof StockFetchError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.errors.upstream_error);
      }
    }
  }

  function handleSaveToBucket() {
    if (!bucket || !projectionResult) return;
    startSaving(async () => {
      const result = await saveBucketProjectionAction({
        bucketId: bucket.id,
        projectionType: "stock",
        projectionInput: {
          ticker: ticker.trim().toUpperCase(),
          priceGrowthPct: parseFloat(priceGrowthPct) || 0,
          dividendAmount: parseFloat(dividendAmount) || 0,
          dividendFrequency,
          dividendGrowthPct: parseFloat(dividendGrowthPct) || 0,
          contributionAmount: parseFloat(contributionAmount) || 0,
          contributionFrequency,
        },
        projectedValue: projectionResult.endingValue,
        projectedDate: projectEndDate,
      });
      if (!result?.error) {
        setSavedToBucket(true);
        router.push("/savings-plan");
      }
    });
  }

  const bucketContext: BucketContext | undefined = !bucket && projectionResult
    ? {
        initialInvestment: parseFloat(initialInvestment) || 0,
        defaultTargetAmount: Math.round(projectionResult.endingValue),
        projectionInput: {
          ticker: ticker.trim().toUpperCase(),
          priceGrowthPct: parseFloat(priceGrowthPct) || 0,
          dividendAmount: parseFloat(dividendAmount) || 0,
          dividendFrequency,
          dividendGrowthPct: parseFloat(dividendGrowthPct) || 0,
          contributionAmount: parseFloat(contributionAmount) || 0,
          contributionFrequency,
        },
      }
    : undefined;

  return (
    <>
      <Topbar title={t.titleProjection} backHref="/calculators" />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <CalculatorForm
          mode="project"
          ticker={ticker} onTicker={handleTickerChange}
          initialInvestment={initialInvestment} onInitialInvestment={setInitialInvestment}
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

        {projectionResult && (
          <>
            {projectionResult.warnings.map((warning) => {
              const [, date] = warning.split(":");
              return (
                <p key={warning} className="text-xs text-[var(--color-muted-foreground)]">
                  {t.projectionEndDateCappedWarning.replace("{date}", date)}
                </p>
              );
            })}

            <ProjectionResults result={projectionResult} assumptions={projectionAssumptions} ticker={ticker} />

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
              <h2 className="font-semibold text-[var(--color-foreground)] mb-1">{t.chartTitle}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-5">{ticker}</p>
              <CalculatorGrowthChart timeline={projectionResult.timeline} />
            </div>

            {bucket && (
              <Button onClick={handleSaveToBucket} disabled={isSaving} className="w-full">
                {isSaving ? dict.common.saving : savedToBucket ? dict.savingsPlan.savedToBucket : dict.savingsPlan.saveToBucket}
              </Button>
            )}

            {planInputs && planInputs.contributionAmount > 0 && (
              <SavingsPlanForm
                contributionAmount={planInputs.contributionAmount}
                contributionFrequency={planInputs.contributionFrequency}
                startDate={planInputs.startDate}
                endDate={planInputs.endDate}
                groups={groups}
                bucketContext={bucketContext}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
