export type DividendMode = "none" | "cash" | "drip";

export interface PricePoint {
  date: string; // "YYYY-MM-DD"
  close: number; // raw (unadjusted) close price
  dividend: number; // dividend amount paid in this period, 0 if none
}

export interface CompoundCalculatorInput {
  prices: PricePoint[];
  initialInvestment: number;
  startDate: string;
  endDate: string;
  dividendMode: DividendMode;
}

export interface TimelinePoint {
  date: string;
  price: number;
  shares: number;
  cashDividendsAccrued: number;
  value: number;
}

export interface CompoundCalculatorResult {
  timeline: TimelinePoint[];
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  initialShares: number;
  endingShares: number;
  endingValue: number;
  totalReturnPct: number;
  cagr: number;
  yearsElapsed: number;
  totalDividendsCollected: number;
  warnings: string[];
}

export class CompoundCalculatorError extends Error {}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function computeCompoundGrowth(input: CompoundCalculatorInput): CompoundCalculatorResult {
  const { prices, initialInvestment, startDate, endDate, dividendMode } = input;

  if (initialInvestment <= 0) {
    throw new CompoundCalculatorError("Initial investment must be greater than 0");
  }
  if (prices.length === 0) {
    throw new CompoundCalculatorError("No price data available");
  }
  if (startDate >= endDate) {
    throw new CompoundCalculatorError("Start date must be before end date");
  }

  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
  const warnings: string[] = [];

  let startIndex = sorted.findIndex((p) => p.date >= startDate);
  if (startIndex === -1) {
    startIndex = sorted.length - 1;
  }
  if (sorted[startIndex].date !== startDate && startIndex === 0 && sorted[0].date > startDate) {
    warnings.push(`startDateClamped:${sorted[0].date}`);
  }

  let endIndex = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].date <= endDate) {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    endIndex = sorted.length - 1;
  }
  if (sorted[endIndex].date !== endDate && endIndex === sorted.length - 1 && sorted[endIndex].date < endDate) {
    warnings.push(`endDateClamped:${sorted[endIndex].date}`);
  }

  if (startIndex >= endIndex) {
    throw new CompoundCalculatorError("No overlapping price data for the selected date range");
  }

  const windowed = sorted.slice(startIndex, endIndex + 1);
  const startPrice = windowed[0].close;
  const initialShares = initialInvestment / startPrice;

  let shares = initialShares;
  let cashDividendsAccrued = 0;
  let totalDividendsCollected = 0;

  const timeline: TimelinePoint[] = [
    {
      date: windowed[0].date,
      price: windowed[0].close,
      shares,
      cashDividendsAccrued: 0,
      value: shares * windowed[0].close,
    },
  ];

  for (let i = 1; i < windowed.length; i++) {
    const point = windowed[i];
    const dividendCash = shares * point.dividend;
    totalDividendsCollected += dividendCash;

    if (dividendMode === "drip" && point.dividend > 0) {
      shares += dividendCash / point.close;
    } else if (dividendMode === "cash" && point.dividend > 0) {
      cashDividendsAccrued += dividendCash;
    }

    timeline.push({
      date: point.date,
      price: point.close,
      shares,
      cashDividendsAccrued,
      value: shares * point.close + cashDividendsAccrued,
    });
  }

  const last = timeline[timeline.length - 1];
  const endingValue = last.value;
  const endPrice = windowed[windowed.length - 1].close;
  const yearsElapsed = (Date.parse(last.date) - Date.parse(timeline[0].date)) / MS_PER_YEAR;
  const totalReturnPct = ((endingValue - initialInvestment) / initialInvestment) * 100;
  const cagr = yearsElapsed > 0 ? (Math.pow(endingValue / initialInvestment, 1 / yearsElapsed) - 1) * 100 : 0;

  return {
    timeline,
    startDate: timeline[0].date,
    endDate: last.date,
    startPrice,
    endPrice,
    initialShares,
    endingShares: shares,
    endingValue,
    totalReturnPct,
    cagr,
    yearsElapsed,
    totalDividendsCollected,
    warnings,
  };
}
