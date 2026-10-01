"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDict } from "@/components/language-provider";
import { CircularProgress } from "./circular-progress";

interface HomeOverviewProps {
  firstName: string;
  incomeTotal: number;
  billsTotal: number;
  paidTotal: number;
  /** Human label for the currently selected Bills view (Day/Week/Month/All). */
  periodLabel: string;
}

function greetingKey(hour: number): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour < 12) return "greetingMorning";
  if (hour < 18) return "greetingAfternoon";
  return "greetingEvening";
}

export function HomeOverview({ firstName, incomeTotal, billsTotal, paidTotal, periodLabel }: HomeOverviewProps) {
  const dict = useDict();
  const t = dict.dashboard;
  const now = new Date();
  const greeting = t[greetingKey(now.getHours())];
  const dateStr = now.toLocaleDateString(dict.locale, { weekday: "long", month: "long", day: "numeric" });

  const leftToSpend = incomeTotal - billsTotal;
  // % of the selected period's income already committed to bills -- the most
  // meaningful "progress" metric available from existing data (no
  // spending-limit/budget feature exists to measure against instead).
  const committedPercent = incomeTotal > 0 ? (billsTotal / incomeTotal) * 100 : 0;
  const paidPercent = billsTotal > 0 ? (paidTotal / billsTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)] capitalize">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] capitalize">{dateStr}</p>
      </div>

      <div className="rounded-2xl p-5 text-white shadow-[var(--shadow-card)]" style={{ backgroundColor: "var(--color-primary)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">{t.leftToSpendTitle}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums truncate">{formatCurrency(leftToSpend)}</p>
            <p className="text-xs text-white/80 mt-1">{periodLabel}</p>
          </div>
          <CircularProgress percent={committedPercent} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--color-success)]" />
            {dict.nav.income}
          </div>
          <p className="text-lg font-bold text-[var(--color-foreground)] mt-1 tabular-nums">{formatCurrency(incomeTotal)}</p>
        </div>
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-danger)]" />
            {t.billsAndSpendingLabel}
          </div>
          <p className="text-lg font-bold text-[var(--color-foreground)] mt-1 tabular-nums">{formatCurrency(billsTotal)}</p>
        </div>
      </div>

      {billsTotal > 0 && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-muted-foreground)] mb-2">
            <span>{t.billsPaidLabel}</span>
            <span className="tabular-nums">{formatCurrency(paidTotal)} / {formatCurrency(billsTotal)}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-success)]"
              style={{ width: `${Math.min(100, paidPercent)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
