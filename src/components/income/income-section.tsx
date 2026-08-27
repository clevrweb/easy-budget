import Link from "next/link";
import { TrendingUp, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getServerDict } from "@/lib/i18n/server";
import { getIncomeOccurrences, groupOccurrencesBySource } from "@/lib/income-utils";
import type { IncomeSource } from "@/types/database";

interface IncomeSectionProps {
  incomeSources: IncomeSource[];
  billsTotal: number;
  range: { start: string; end: string };
}

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  twice_monthly: "2× / mo",
  monthly: "Monthly",
};

export async function IncomeSection({ incomeSources, billsTotal, range }: IncomeSectionProps) {
  const dict = await getServerDict();
  const t = dict.income;

  const occurrences = getIncomeOccurrences(incomeSources, range.start, range.end);
  const grouped = groupOccurrencesBySource(occurrences);
  const incomeTotal = grouped.reduce((s, g) => s + g.total, 0);
  const net = incomeTotal - billsTotal;

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
      {/* Income header row */}
      <div
        className="flex items-center justify-between pl-3 pr-4 py-2.5 border-b border-[var(--color-border)]"
        style={{ borderLeft: "4px solid #10b981" }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            {t.incomeSectionTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatCurrency(incomeTotal)}
          </span>
          <Link
            href="/income"
            className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/40 transition-colors"
            title={t.addIncome}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </Link>
        </div>
      </div>

      {/* Income source rows */}
      {grouped.length > 0 ? (
        <div className="divide-y divide-[var(--color-border)]">
          {grouped.map(({ source, count, total }) => (
            <div key={source.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-foreground)] truncate leading-tight">
                  {source.name}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {FREQ_LABELS[source.frequency] ?? source.frequency}
                  {count > 1 ? ` · ${count}×` : ""}
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                +{formatCurrency(total)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.noPeriodIncome}</p>
          <Link
            href="/income"
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            {t.addIncome}
          </Link>
        </div>
      )}

      {/* Net total footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-muted)]/50">
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(incomeTotal)}</span>
            {" income"}
          </span>
          <span>−</span>
          <span>
            <span className="font-semibold text-[var(--color-foreground)]">{formatCurrency(billsTotal)}</span>
            {" bills"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--color-muted-foreground)] font-medium">{t.netLabel}</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: net >= 0 ? "var(--color-success)" : "var(--color-danger)" }}
          >
            {net >= 0 ? "+" : ""}{formatCurrency(net)}
          </span>
        </div>
      </div>
    </div>
  );
}
