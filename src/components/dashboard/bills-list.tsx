import { formatCurrency, formatDate } from "@/lib/utils";
import type { Bill } from "@/types/database";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const statusConfig = {
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "text-[var(--color-success)] bg-green-50 dark:bg-green-950",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-[var(--color-warning)] bg-yellow-50 dark:bg-yellow-950",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    className: "text-[var(--color-danger)] bg-red-50 dark:bg-red-950",
  },
};

export function BillsList({ bills, title }: { bills: Bill[]; title: string }) {
  if (bills.length === 0) {
    return (
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-12 text-center">
        <p className="text-[var(--color-muted-foreground)] text-sm">No bills for this month.</p>
        <p className="text-[var(--color-muted-foreground)] text-xs mt-1">
          Use <strong>Add Bill</strong> or <strong>Generate Recurring</strong> to populate this month.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <h2 className="font-semibold text-[var(--color-foreground)]">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {bills.map((bill) => {
          const status = statusConfig[bill.status] ?? statusConfig.pending;
          const StatusIcon = status.icon;
          return (
            <div
              key={bill.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-muted)] transition-colors duration-150"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-1.5 rounded-lg ${status.className}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[var(--color-foreground)] truncate">
                    {bill.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Due {formatDate(bill.due_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="font-semibold text-sm text-[var(--color-foreground)]">
                  {formatCurrency(bill.amount)}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
