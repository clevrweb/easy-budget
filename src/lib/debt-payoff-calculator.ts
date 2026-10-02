export interface DebtPayoffInput {
  balance: number;
  annualRatePct: number;
  monthlyPayment: number;
}

export interface DebtPayoffResult {
  timeline: { date: string; value: number }[];
  monthsToPayoff: number | null;
  payoffDate: string | null;
  totalInterestPaid: number;
  totalPaid: number;
  neverPaidOff: boolean;
}

export class DebtPayoffError extends Error {}

const MAX_MONTHS = 600;

/** Standalone "what-if" payoff calculator -- not tied to saved `debts` rows. */
export function computeDebtPayoff(input: DebtPayoffInput): DebtPayoffResult {
  const { balance, annualRatePct, monthlyPayment } = input;

  if (balance <= 0) throw new DebtPayoffError("Balance must be greater than 0");
  if (monthlyPayment <= 0) throw new DebtPayoffError("Monthly payment must be greater than 0");

  const monthlyRate = annualRatePct / 100 / 12;
  const today = new Date();
  function dateAtMonth(m: number): string {
    return new Date(today.getFullYear(), today.getMonth() + m, 1).toISOString().split("T")[0];
  }

  let bal = balance;
  let totalInterest = 0;
  let month = 0;
  let neverPaidOff = false;
  const timeline: { date: string; value: number }[] = [{ date: dateAtMonth(0), value: bal }];

  while (bal > 0) {
    month++;
    const interest = bal * monthlyRate;
    if (monthlyPayment <= interest || month > MAX_MONTHS) {
      neverPaidOff = true;
      break;
    }
    totalInterest += interest;
    bal = bal + interest - monthlyPayment;
    if (bal < 0) bal = 0;
    timeline.push({ date: dateAtMonth(month), value: bal });
  }

  if (neverPaidOff) {
    return { timeline, monthsToPayoff: null, payoffDate: null, totalInterestPaid: 0, totalPaid: 0, neverPaidOff: true };
  }

  return {
    timeline,
    monthsToPayoff: month,
    payoffDate: dateAtMonth(month),
    totalInterestPaid: totalInterest,
    totalPaid: balance + totalInterest,
    neverPaidOff: false,
  };
}
