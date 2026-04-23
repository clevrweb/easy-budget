"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SummaryCards } from "./summary-cards";
import type { Bill } from "@/types/database";

interface Summary {
  dueToday: Bill[];
  dueThisWeek: Bill[];
  dueThisMonth: Bill[];
  paid: Bill[];
  pending: Bill[];
  overdue: Bill[];
}

export function CollapsibleSummary({ summary }: { summary: Summary }) {
  const [expanded, setExpanded] = useState(false);

  const todayTotal   = summary.dueToday.reduce((s, b) => s + b.amount, 0);
  const overdueTotal = summary.overdue.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-muted)] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#4f46e518" }}>
          <LayoutGrid className="w-4 h-4 text-[var(--color-primary)]" />
        </div>

        <span className="text-sm font-semibold text-[var(--color-foreground)]">Summary</span>

        <span className="text-sm text-[var(--color-muted-foreground)]">
          Today{" "}
          <span className="font-semibold text-[var(--color-foreground)]">
            {formatCurrency(todayTotal)}
          </span>
        </span>

        {overdueTotal > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-[var(--color-danger)]">
            <AlertTriangle className="w-3 h-3" />
            {formatCurrency(overdueTotal)} overdue
          </span>
        )}

        {expanded
          ? <ChevronUp className="w-4 h-4 text-[var(--color-muted-foreground)] ml-auto shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[var(--color-muted-foreground)] ml-auto shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[var(--color-border)]">
          <SummaryCards summary={summary} />
        </div>
      )}
    </div>
  );
}
