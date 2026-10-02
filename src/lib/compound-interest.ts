export type CompoundingFrequency = "monthly" | "quarterly" | "annually";

export interface CompoundInterestInput {
  principal: number;
  monthlyContribution: number;
  annualRatePct: number;
  years: number;
  compoundingFrequency: CompoundingFrequency;
}

export interface CompoundInterestTimelinePoint {
  date: string;
  value: number;
}

export interface CompoundInterestResult {
  timeline: CompoundInterestTimelinePoint[];
  endingValue: number;
  totalContributed: number;
  totalGrowth: number;
}

export class CompoundInterestError extends Error {}

const PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

/**
 * Textbook fixed-rate compound growth, distinct from compound-calculator.ts
 * (which replays a real stock's historical prices). Contributions are added
 * every month; interest is credited at each compounding-period boundary on
 * whatever balance exists at that point.
 */
export function computeCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const { principal, monthlyContribution, annualRatePct, years, compoundingFrequency } = input;

  if (principal < 0 || monthlyContribution < 0) {
    throw new CompoundInterestError("Amounts cannot be negative");
  }
  if (principal === 0 && monthlyContribution === 0) {
    throw new CompoundInterestError("Enter a starting amount or a monthly contribution greater than 0");
  }
  if (years <= 0) {
    throw new CompoundInterestError("Years must be greater than 0");
  }

  const periodsPerYear = PERIODS_PER_YEAR[compoundingFrequency];
  const monthsPerPeriod = 12 / periodsPerYear;
  const ratePerPeriod = annualRatePct / 100 / periodsPerYear;
  const totalMonths = Math.round(years * 12);

  const today = new Date();
  function dateAtMonth(m: number): string {
    return new Date(today.getFullYear(), today.getMonth() + m, 1).toISOString().split("T")[0];
  }

  let balance = principal;
  let totalContributed = principal;
  const timeline: CompoundInterestTimelinePoint[] = [{ date: dateAtMonth(0), value: balance }];

  for (let m = 1; m <= totalMonths; m++) {
    balance += monthlyContribution;
    totalContributed += monthlyContribution;
    if (m % monthsPerPeriod === 0) {
      balance += balance * ratePerPeriod;
    }
    timeline.push({ date: dateAtMonth(m), value: balance });
  }

  return {
    timeline,
    endingValue: balance,
    totalContributed,
    totalGrowth: balance - totalContributed,
  };
}
