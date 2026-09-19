import type { DividendMode, PricePoint, TimelinePoint } from "./compound-calculator";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const MAX_ESTIMATE_YEARS = 20;
const MAX_PROJECTION_MONTHS = 600; // 50-year safety cap, same convention as debt-snowball.ts

export interface HistoricalReturnEstimate {
  annualPriceReturnPct: number;
  annualDividendYieldPct: number;
  yearsOfHistory: number; // actual span used, un-floored, for display
  sinceDate: string; // first date in the (possibly capped) window
  cappedAtYears: number | null; // 20 if the estimate window was truncated, else null
  insufficientHistory: boolean; // true if yearsOfHistory < 1 — estimate is unreliable
}

export class FutureProjectionError extends Error {}

export function estimateHistoricalReturns(prices: PricePoint[]): HistoricalReturnEstimate {
  if (prices.length < 2) {
    throw new FutureProjectionError("Not enough price history to estimate returns");
  }
  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));

  const cutoff = new Date(sorted[sorted.length - 1].date + "T00:00:00");
  cutoff.setFullYear(cutoff.getFullYear() - MAX_ESTIMATE_YEARS);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  let windowed = sorted.filter((p) => p.date >= cutoffStr);
  if (windowed.length < 2) windowed = sorted; // guard against sparse data near the cutoff

  const first = windowed[0];
  const last = windowed[windowed.length - 1];
  const years = (Date.parse(last.date) - Date.parse(first.date)) / MS_PER_YEAR;
  const safeYears = Math.max(years, 1); // floor prevents power-law blowups on sub-year windows

  const annualPriceReturnPct = (Math.pow(last.close / first.close, 1 / safeYears) - 1) * 100;

  const totalDividends = windowed.reduce((s, p) => s + p.dividend, 0);
  const avgPrice = windowed.reduce((s, p) => s + p.close, 0) / windowed.length;
  const annualDividendYieldPct = avgPrice > 0 ? (totalDividends / safeYears / avgPrice) * 100 : 0;

  return {
    annualPriceReturnPct,
    annualDividendYieldPct,
    yearsOfHistory: years,
    sinceDate: first.date,
    cappedAtYears: sorted[0].date < cutoffStr ? MAX_ESTIMATE_YEARS : null,
    insufficientHistory: years < 1,
  };
}

function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Whole calendar months elapsed from start to end (never negative). */
function monthsBetween(startDate: string, endDate: string): number {
  const s = parseISODate(startDate);
  const e = parseISODate(endDate);
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() < s.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Adds `months` months to `dateStr`, preserving the original day-of-month and
 * clamping to the last valid day of the target month (e.g. Jan 31 + 1 month
 * -> Feb 28/29). Mirrors the day-preserving convention in src/lib/income-utils.ts
 * — deliberately NOT debt-snowball.ts's day-1 normalization, which would desync
 * the timeline from the user's actual start date (e.g. today).
 */
function addMonthsClamped(dateStr: string, months: number): string {
  const base = parseISODate(dateStr);
  const y = base.getFullYear();
  const targetMonthIndex = base.getMonth() + months;
  const daysInTargetMonth = new Date(y, targetMonthIndex + 1, 0).getDate();
  const clampedDay = Math.min(base.getDate(), daysInTargetMonth);
  return toISODate(new Date(y, targetMonthIndex, clampedDay));
}

export interface FutureProjectionInput {
  referencePrice: number; // latest real close price, used as the starting price scale
  annualPriceReturnPct: number; // resolved by the caller: override ?? estimate
  annualDividendYieldPct: number; // resolved by the caller: override ?? estimate
  initialInvestment: number;
  monthlyContribution: number;
  startDate: string; // typically today
  endDate: string; // future date
  dividendMode: DividendMode;
}

export interface FutureProjectionResult {
  timeline: TimelinePoint[];
  months: number; // actual months simulated (post-cap)
  endingValue: number;
  totalContributed: number;
  totalGrowth: number;
  totalGrowthPct: number;
  totalDividendsCollected: number;
  endingShares: number;
  warnings: string[]; // e.g. "endDateClamped:2076-09-18"
}

export function projectFutureGrowth(input: FutureProjectionInput): FutureProjectionResult {
  const {
    referencePrice, annualPriceReturnPct, annualDividendYieldPct,
    initialInvestment, monthlyContribution, startDate, endDate, dividendMode,
  } = input;

  if (referencePrice <= 0) {
    throw new FutureProjectionError("A valid reference price is required");
  }
  if (initialInvestment < 0 || monthlyContribution < 0) {
    throw new FutureProjectionError("Investment and contribution amounts cannot be negative");
  }
  if (initialInvestment === 0 && monthlyContribution === 0) {
    throw new FutureProjectionError("Enter an initial investment or a monthly contribution greater than 0");
  }
  if (startDate >= endDate) {
    throw new FutureProjectionError("Start date must be before end date");
  }

  let months = monthsBetween(startDate, endDate);
  if (months < 1) {
    throw new FutureProjectionError("End date must be at least one month after start date");
  }

  const warnings: string[] = [];
  if (months > MAX_PROJECTION_MONTHS) {
    months = MAX_PROJECTION_MONTHS;
    warnings.push(`endDateClamped:${addMonthsClamped(startDate, months)}`);
  }

  const monthlyPriceReturn = Math.pow(1 + annualPriceReturnPct / 100, 1 / 12) - 1;
  const monthlyDividendYield = annualDividendYieldPct / 100 / 12;

  let price = referencePrice;
  let shares = initialInvestment / price;
  let cashDividendsAccrued = 0;
  let totalDividendsCollected = 0;

  const timeline: TimelinePoint[] = [
    { date: startDate, price, shares, cashDividendsAccrued: 0, value: shares * price },
  ];

  for (let i = 1; i <= months; i++) {
    price *= 1 + monthlyPriceReturn;

    // Dividend for this month is based on shares held before this month's
    // contribution — that contribution hasn't been invested yet.
    const dividendCash = shares * price * monthlyDividendYield;
    totalDividendsCollected += dividendCash;
    if (dividendMode === "drip" && dividendCash > 0) {
      shares += dividendCash / price;
    } else if (dividendMode === "cash" && dividendCash > 0) {
      cashDividendsAccrued += dividendCash;
    }

    // Contribution lands at the end of the month, so it starts compounding
    // the following month rather than earning this month's own growth.
    shares += monthlyContribution / price;

    timeline.push({
      date: addMonthsClamped(startDate, i),
      price,
      shares,
      cashDividendsAccrued,
      value: shares * price + cashDividendsAccrued,
    });
  }

  const endingValue = timeline[timeline.length - 1].value;
  const totalContributed = initialInvestment + monthlyContribution * months;
  const totalGrowth = endingValue - totalContributed;

  return {
    timeline,
    months,
    endingValue,
    totalContributed,
    totalGrowth,
    totalGrowthPct: totalContributed > 0 ? (totalGrowth / totalContributed) * 100 : 0,
    totalDividendsCollected,
    endingShares: shares,
    warnings,
  };
}
