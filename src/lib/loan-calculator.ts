export interface LoanInput {
  amount: number;
  annualRatePct: number;
  termYears: number;
}

export interface LoanResult {
  timeline: { date: string; value: number }[];
  monthlyPayment: number;
  totalInterestPaid: number;
  totalPaid: number;
}

export class LoanCalculatorError extends Error {}

export function computeLoanPayment(input: LoanInput): LoanResult {
  const { amount, annualRatePct, termYears } = input;

  if (amount <= 0) throw new LoanCalculatorError("Loan amount must be greater than 0");
  if (termYears <= 0) throw new LoanCalculatorError("Term must be greater than 0");

  const n = Math.round(termYears * 12);
  const r = annualRatePct / 100 / 12;
  const monthlyPayment = r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));

  const today = new Date();
  function dateAtMonth(m: number): string {
    return new Date(today.getFullYear(), today.getMonth() + m, 1).toISOString().split("T")[0];
  }

  let balance = amount;
  const timeline: { date: string; value: number }[] = [{ date: dateAtMonth(0), value: balance }];
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    balance = Math.max(0, balance + interest - monthlyPayment);
    timeline.push({ date: dateAtMonth(m), value: balance });
  }

  const totalPaid = monthlyPayment * n;
  return { timeline, monthlyPayment, totalInterestPaid: totalPaid - amount, totalPaid };
}
