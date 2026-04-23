"use client";

import { useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteBillAction, markBillPaidAction, markBillPendingAction } from "@/app/(dashboard)/bills/actions";
import { BillForm } from "./bill-form";
import type { Bill, Category, Group } from "@/types/database";
import { CheckCircle2, Clock, AlertCircle, Pencil, Trash2, CheckCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig = {
  paid: { label: "Paid", icon: CheckCircle2, pill: "text-[var(--color-success)] bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
  pending: { label: "Pending", icon: Clock, pill: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" },
  overdue: { label: "Overdue", icon: AlertCircle, pill: "text-[var(--color-danger)] bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
};

interface BillRowProps {
  bill: Bill;
  categories: Category[];
  groups: Group[];
}

export function BillRow({ bill, categories, groups }: BillRowProps) {
  const [isPending, startTransition] = useTransition();
  const status = statusConfig[bill.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  const today = new Date().toISOString().split("T")[0];
  const isActuallyOverdue = bill.status === "pending" && bill.due_date < today;
  const displayStatus = isActuallyOverdue ? statusConfig.overdue : status;
  const DisplayIcon = displayStatus.icon;

  function handleDelete() {
    if (!confirm(`Delete "${bill.name}"?`)) return;
    startTransition(async () => { await deleteBillAction(bill.id); });
  }

  function handleMarkPaid() {
    startTransition(async () => { await markBillPaidAction(bill.id); });
  }

  function handleMarkPending() {
    startTransition(async () => { await markBillPendingAction(bill.id); });
  }

  return (
    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-muted)] transition-colors duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Status icon */}
      <div className={`p-1.5 rounded-lg border ${displayStatus.pill} shrink-0`}>
        <DisplayIcon className="w-3.5 h-3.5" />
      </div>

      {/* Name + date */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[var(--color-foreground)] truncate">{bill.name}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">Due {formatDate(bill.due_date)}</p>
      </div>

      {/* Amount */}
      <span className="font-semibold text-sm text-[var(--color-foreground)] shrink-0">
        {formatCurrency(bill.amount)}
      </span>

      {/* Status pill */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${displayStatus.pill} shrink-0 hidden sm:inline-flex`}>
        {isActuallyOverdue ? "Overdue" : displayStatus.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {bill.status !== "paid" ? (
          <Button variant="ghost" size="icon" onClick={handleMarkPaid} title="Mark as paid">
            <CheckCheck className="w-4 h-4 text-[var(--color-success)]" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleMarkPending} title="Mark as pending">
            <RotateCcw className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </Button>
        )}
        <BillForm
          bill={bill}
          categories={categories}
          groups={groups}
          trigger={
            <Button variant="ghost" size="icon" title="Edit bill">
              <Pencil className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            </Button>
          }
        />
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete bill">
          <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
        </Button>
      </div>
    </div>
  );
}
