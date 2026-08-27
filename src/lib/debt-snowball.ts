export interface SnowballDebtInput {
  id: string;
  name: string;
  balance: number;
  interest_rate: number; // annual APR, percent, e.g. 19.99
  minimum_payment: number;
}

export interface MonthSnapshot {
  month: number; // 1-based
  date: string; // ISO yyyy-mm-01
  remainingBalances: Record<string, number>;
  totalRemaining: number;
}

export interface DebtPayoffResult {
  id: string;
  name: string;
  payoffOrder: number; // 1-based, smallest starting balance first
  startingBalance: number;
  monthsToPayoff: number | null; // null if not resolved within the cap
  payoffDate: string | null;
  totalInterestPaid: number;
  totalPaid: number;
}

export interface SnowballPlan {
  debts: DebtPayoffResult[]; // sorted by payoffOrder
  totalMonths: number | null;
  debtFreeDate: string | null;
  totalInterestPaid: number;
  totalBalance: number;
  monthlyTimeline: MonthSnapshot[];
  capped: boolean;
}

const MAX_MONTHS = 600; // 50-year safety cap

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return d.toISOString().split("T")[0];
}

export function computeSnowballPlan(
  debts: SnowballDebtInput[],
  extraMonthlyPayment: number,
  startDate: Date = new Date()
): SnowballPlan {
  const extra = Math.max(0, extraMonthlyPayment);
  const totalBalance = debts.reduce((s, d) => s + Math.max(0, d.balance), 0);

  if (debts.length === 0) {
    return {
      debts: [],
      totalMonths: 0,
      debtFreeDate: addMonths(startDate, 0),
      totalInterestPaid: 0,
      totalBalance: 0,
      monthlyTimeline: [],
      capped: false,
    };
  }

  // Snowball order is fixed at the start by starting balance ascending --
  // it does not reshuffle mid-plan, matching how people actually think about
  // "who's next" rather than continuously re-ranking as balances fluctuate.
  const order = [...debts].sort((a, b) => a.balance - b.balance || debts.indexOf(a) - debts.indexOf(b));

  const remaining = new Map(order.map((d) => [d.id, round2(Math.max(0, d.balance))]));
  const interestPaid = new Map(order.map((d) => [d.id, 0]));
  const payoffMonth = new Map<string, number>();
  const monthlyTimeline: MonthSnapshot[] = [];

  let month = 0;
  let capped = false;

  while (order.some((d) => remaining.get(d.id)! > 0)) {
    month++;
    if (month > MAX_MONTHS) {
      capped = true;
      break;
    }

    // 1. accrue interest on every still-open debt
    for (const debt of order) {
      const bal = remaining.get(debt.id)!;
      if (bal <= 0) continue;
      const interest = round2(bal * (debt.interest_rate / 100 / 12));
      remaining.set(debt.id, round2(bal + interest));
      interestPaid.set(debt.id, round2(interestPaid.get(debt.id)! + interest));
    }

    // 2. pay minimums on every open debt
    for (const debt of order) {
      const bal = remaining.get(debt.id)!;
      if (bal <= 0) continue;
      const pay = Math.min(debt.minimum_payment, bal);
      remaining.set(debt.id, round2(bal - pay));
    }

    // 3. dump extra + freed-up minimums of already-paid-off debts onto the
    //    first still-open debt in snowball order, rolling leftover forward
    //    within the same month if it pays that debt off entirely.
    const freedMinimums = order
      .filter((d) => remaining.get(d.id)! <= 0)
      .reduce((s, d) => s + d.minimum_payment, 0);
    let pool = round2(extra + freedMinimums);

    for (const debt of order) {
      if (pool <= 0) break;
      const bal = remaining.get(debt.id)!;
      if (bal <= 0) continue;
      const pay = Math.min(pool, bal);
      remaining.set(debt.id, round2(bal - pay));
      pool = round2(pool - pay);
    }

    // 4. record any debt that crossed to <= 0 this month
    for (const debt of order) {
      if (remaining.get(debt.id)! <= 0 && !payoffMonth.has(debt.id)) {
        payoffMonth.set(debt.id, month);
      }
    }

    const remainingBalances: Record<string, number> = {};
    let totalRemaining = 0;
    for (const debt of order) {
      const bal = Math.max(0, remaining.get(debt.id)!);
      remainingBalances[debt.id] = bal;
      totalRemaining += bal;
    }
    monthlyTimeline.push({ month, date: addMonths(startDate, month), remainingBalances, totalRemaining: round2(totalRemaining) });
  }

  const results: DebtPayoffResult[] = order.map((debt, i) => {
    const months = payoffMonth.get(debt.id) ?? null;
    return {
      id: debt.id,
      name: debt.name,
      payoffOrder: i + 1,
      startingBalance: round2(Math.max(0, debt.balance)),
      monthsToPayoff: months,
      payoffDate: months !== null ? addMonths(startDate, months) : null,
      totalInterestPaid: round2(interestPaid.get(debt.id)!),
      totalPaid: round2(Math.max(0, debt.balance) + interestPaid.get(debt.id)!),
    };
  });

  const totalInterestPaid = round2(results.reduce((s, r) => s + r.totalInterestPaid, 0));
  const allResolved = !capped && results.every((r) => r.monthsToPayoff !== null);
  const totalMonths = allResolved ? Math.max(...results.map((r) => r.monthsToPayoff!)) : null;

  return {
    debts: results,
    totalMonths,
    debtFreeDate: totalMonths !== null ? addMonths(startDate, totalMonths) : null,
    totalInterestPaid,
    totalBalance: round2(totalBalance),
    monthlyTimeline,
    capped,
  };
}
