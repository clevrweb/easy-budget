import type { DividendMode, PricePoint, TimelinePoint } from "./compound-calculator";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const MAX_ESTIMATE_YEARS = 20;
const MAX_PROJECTION_MONTHS = 600; // 50-year safety cap, same convention as debt-snowball.ts

export class FutureProjectionError extends Error {}

export type DividendFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "none";

const FREQUENCY_PAYMENTS_PER_YEAR: Record<DividendFrequency, number> = {
  monthly: 12, quarterly: 4, semiannual: 2, annual: 1, none: 0,
};
const FREQUENCY_PERIOD_MONTHS: Record<DividendFrequency, number> = {
  monthly: 1, quarterly: 3, semiannual: 6, annual: 12, none: 0,
};

export interface StockSnapshot {
  lastPrice: number;
  lastDividendAmount: number; // most recent nonzero per-share payment, 0 if none ever
  dividendFrequency: DividendFrequency;
  currentDividendYieldPct: number; // lastDividendAmount * paymentsPerYear / lastPrice * 100
  currentDividendAnnualAmount: number; // lastDividendAmount * paymentsPerYear
  measuredDividendGrowthPct: number; // CAGR of annual dividend totals, 0 fallback
  measuredPriceGrowthPct: number; // same methodology as before
  yearsOfHistory: number;
  sinceDate: string;
  cappedAtYears: number | null;
  insufficientHistory: boolean; // years < 1 — price estimate unreliable
  insufficientDividendHistory: boolean; // fewer than 2 usable nonzero-dividend years
}

function inferDividendFrequency(windowed: PricePoint[]): DividendFrequency {
  const monthsConsidered = Math.min(24, windowed.length);
  const recent = windowed.slice(windowed.length - monthsConsidered);
  const nonzeroCount = recent.filter((p) => p.dividend > 0).length;
  if (nonzeroCount === 0) return "none";

  const paymentsPerYear = nonzeroCount / (monthsConsidered / 12);
  const candidates: DividendFrequency[] = ["monthly", "quarterly", "semiannual", "annual"];
  let best: DividendFrequency = "annual";
  let bestDiff = Infinity;
  for (const candidate of candidates) {
    const diff = Math.abs(FREQUENCY_PAYMENTS_PER_YEAR[candidate] - paymentsPerYear);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best;
}

function computeDividendGrowth(windowed: PricePoint[]): { measuredDividendGrowthPct: number; insufficientDividendHistory: boolean } {
  const totalsByYear = new Map<number, number>();
  for (const p of windowed) {
    const year = Number(p.date.slice(0, 4));
    totalsByYear.set(year, (totalsByYear.get(year) ?? 0) + p.dividend);
  }

  let years = Array.from(totalsByYear.entries())
    .filter(([, total]) => total > 0)
    .sort((a, b) => a[0] - b[0]);

  // Window boundaries rarely land on calendar-year edges, so the first/last
  // bucketed years are usually partial and would distort a CAGR. Trim them
  // when there's enough interior data to still get a valid 2-point comparison.
  if (years.length >= 4) years = years.slice(1, -1);

  if (years.length < 2) {
    return { measuredDividendGrowthPct: 0, insufficientDividendHistory: true };
  }

  const [firstYear, firstTotal] = years[0];
  const [lastYear, lastTotal] = years[years.length - 1];
  const span = lastYear - firstYear;
  if (span < 1 || firstTotal <= 0) {
    return { measuredDividendGrowthPct: 0, insufficientDividendHistory: true };
  }

  const measuredDividendGrowthPct = (Math.pow(lastTotal / firstTotal, 1 / span) - 1) * 100;
  return { measuredDividendGrowthPct, insufficientDividendHistory: false };
}

export function analyzeStock(prices: PricePoint[]): StockSnapshot {
  if (prices.length < 2) {
    throw new FutureProjectionError("Not enough price history to analyze this stock");
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

  const measuredPriceGrowthPct = (Math.pow(last.close / first.close, 1 / safeYears) - 1) * 100;

  const lastPrice = sorted[sorted.length - 1].close;
  let lastDividendAmount = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].dividend > 0) {
      lastDividendAmount = sorted[i].dividend;
      break;
    }
  }

  const dividendFrequency = inferDividendFrequency(windowed);
  const paymentsPerYear = FREQUENCY_PAYMENTS_PER_YEAR[dividendFrequency];
  const currentDividendAnnualAmount = lastDividendAmount * paymentsPerYear;
  const currentDividendYieldPct = lastPrice > 0 ? (currentDividendAnnualAmount / lastPrice) * 100 : 0;

  const { measuredDividendGrowthPct, insufficientDividendHistory } = computeDividendGrowth(windowed);

  return {
    lastPrice,
    lastDividendAmount,
    dividendFrequency,
    currentDividendYieldPct,
    currentDividendAnnualAmount,
    measuredDividendGrowthPct,
    measuredPriceGrowthPct,
    yearsOfHistory: years,
    sinceDate: first.date,
    cappedAtYears: sorted[0].date < cutoffStr ? MAX_ESTIMATE_YEARS : null,
    insufficientHistory: years < 1,
    insufficientDividendHistory,
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

export type ContributionFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";

const CONTRIBUTION_PERIOD_MONTHS: Record<Exclude<ContributionFrequency, "weekly" | "biweekly">, number> = {
  monthly: 1, quarterly: 3, annually: 12,
};
const WEEKS_PER_YEAR = 52.1786;

export interface FutureProjectionInput {
  referencePrice: number; // "Share Price" — directly editable
  priceGrowthPct: number; // "Share Price Growth"
  startingDividendPerShare: number; // "Dividend Amount" — $ per payment
  dividendGrowthPct: number; // may be negative (dividend cut), must be > -100
  dividendFrequency: DividendFrequency;
  initialInvestment: number;
  contributionAmount: number; // per contributionFrequency period
  contributionFrequency: ContributionFrequency;
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
    referencePrice, priceGrowthPct, startingDividendPerShare, dividendGrowthPct, dividendFrequency,
    initialInvestment, contributionAmount, contributionFrequency, startDate, endDate, dividendMode,
  } = input;

  if (referencePrice <= 0) {
    throw new FutureProjectionError("A valid share price is required");
  }
  if (startingDividendPerShare < 0) {
    throw new FutureProjectionError("Dividend amount cannot be negative");
  }
  if (dividendGrowthPct <= -100) {
    throw new FutureProjectionError("Dividend growth rate must be greater than -100%");
  }
  if (initialInvestment < 0 || contributionAmount < 0) {
    throw new FutureProjectionError("Investment and contribution amounts cannot be negative");
  }
  if (initialInvestment === 0 && contributionAmount === 0) {
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

  const monthlyPriceReturn = Math.pow(1 + priceGrowthPct / 100, 1 / 12) - 1;
  const periodMonths = FREQUENCY_PERIOD_MONTHS[dividendFrequency];
  const periodDividendGrowth =
    dividendFrequency === "none" ? 0 : Math.pow(1 + dividendGrowthPct / 100, periodMonths / 12) - 1;

  let price = referencePrice;
  let shares = initialInvestment / price;
  let cashDividendsAccrued = 0;
  let totalDividendsCollected = 0;
  let paymentCount = 0;
  let totalContributed = initialInvestment;

  const timeline: TimelinePoint[] = [
    { date: startDate, price, shares, cashDividendsAccrued: 0, value: shares * price },
  ];

  for (let i = 1; i <= months; i++) {
    price *= 1 + monthlyPriceReturn;

    if (dividendFrequency !== "none" && periodMonths > 0 && i % periodMonths === 0) {
      const perShareDividend = startingDividendPerShare * Math.pow(1 + periodDividendGrowth, paymentCount);
      paymentCount++;

      // Dividend for this payment is based on shares held before this
      // month's contribution — that contribution hasn't been invested yet.
      const dividendCash = shares * perShareDividend;
      totalDividendsCollected += dividendCash;
      if (dividendMode === "drip" && dividendCash > 0) {
        shares += dividendCash / price;
      } else if (dividendMode === "cash" && dividendCash > 0) {
        cashDividendsAccrued += dividendCash;
      }
    }

    // Contribution lands at the end of the month, so it starts compounding
    // the following month rather than earning this month's own growth.
    let contributionThisMonth = 0;
    if (contributionFrequency === "weekly") {
      contributionThisMonth = contributionAmount * (WEEKS_PER_YEAR / 12);
    } else if (contributionFrequency === "biweekly") {
      contributionThisMonth = contributionAmount * (WEEKS_PER_YEAR / 2 / 12);
    } else {
      const contributionPeriodMonths = CONTRIBUTION_PERIOD_MONTHS[contributionFrequency];
      if (i % contributionPeriodMonths === 0) contributionThisMonth = contributionAmount;
    }
    shares += contributionThisMonth / price;
    totalContributed += contributionThisMonth;

    timeline.push({
      date: addMonthsClamped(startDate, i),
      price,
      shares,
      cashDividendsAccrued,
      value: shares * price + cashDividendsAccrued,
    });
  }

  const endingValue = timeline[timeline.length - 1].value;
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
