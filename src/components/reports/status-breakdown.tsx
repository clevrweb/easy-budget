import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, Receipt } from "lucide-react";

interface StatusBreakdownProps {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export function StatusBreakdown({ total, paid, pending, overdue }: StatusBreakdownProps) {
  const stats = [
    { label: "Total", value: total, icon: Receipt, color: "text-[var(--color-primary)]", bar: "bg-[var(--color-primary)]" },
    { label: "Paid", value: paid, icon: CheckCircle2, color: "text-[var(--color-success)]", bar: "bg-[var(--color-success)]" },
    { label: "Pending", value: pending, icon: Clock, color: "text-yellow-500", bar: "bg-yellow-500" },
    { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-[var(--color-danger)]", bar: "bg-[var(--color-danger)]" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bar }) => {
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div key={label} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
            {label !== "Total" && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                  <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{pct}% of total</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
