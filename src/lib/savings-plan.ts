import { addMonthsClamped, type ContributionFrequency } from "./future-projection";

export interface ContributionDatesResult {
  dates: string[];
  capped: boolean;
  totalPlanned: number;
}

const DAYS_STEP: Partial<Record<ContributionFrequency, number>> = {
  weekly: 7,
  biweekly: 14,
};

const MONTHS_STEP: Partial<Record<ContributionFrequency, number>> = {
  monthly: 1,
  quarterly: 3,
  annually: 12,
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Generates the exact calendar dates a recurring contribution would fall on,
 * from `startDate` through `endDate` inclusive, at the given frequency.
 * Capped at `maxOccurrences` to prevent runaway bill creation for long
 * duration/high frequency combinations (e.g. weekly over decades).
 */
export function generateContributionDates(
  startDate: string,
  endDate: string,
  frequency: ContributionFrequency,
  maxOccurrences = 60
): ContributionDatesResult {
  const dates: string[] = [];
  let current = startDate;
  let totalPlanned = 0;

  const daysStep = DAYS_STEP[frequency];
  const monthsStep = MONTHS_STEP[frequency];

  while (current <= endDate) {
    totalPlanned++;
    if (dates.length < maxOccurrences) dates.push(current);
    current = daysStep ? addDays(current, daysStep) : addMonthsClamped(current, monthsStep ?? 1);
  }

  return {
    dates,
    capped: totalPlanned > dates.length,
    totalPlanned,
  };
}
