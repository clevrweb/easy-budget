"use client";

import { Calendar, CalendarDays, CalendarRange, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDict } from "@/components/language-provider";
import type { Bill } from "@/types/database";

interface Summary {
  dueToday: Bill[];
  dueThisWeek: Bill[];
  dueThisMonth: Bill[];
  paid: Bill[];
  pending: Bill[];
  overdue: Bill[];
}

interface SummaryCardProps {
  label: string;
  bills: Bill[];
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ label, bills, icon, color }: SummaryCardProps) {
  const total = bills.reduce((sum, b) => sum + b.amount, 0);
  return (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4 flex flex-col gap-3 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "18", color }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + "18", color }}
        >
          {bills.length}
        </span>
      </div>
      <div>
        <p className="text-xl font-bold text-[var(--color-foreground)] tabular-nums">
          {formatCurrency(total)}
        </p>
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const dict = useDict();
  const d = dict.dashboard;

  const cards = [
    { label: d.dueToday,     bills: summary.dueToday,     icon: <Calendar className="w-4 h-4" />,      color: "#4f46e5" },
    { label: d.dueThisWeek,  bills: summary.dueThisWeek,  icon: <CalendarDays className="w-4 h-4" />,  color: "#ff9800" },
    { label: d.dueThisMonth, bills: summary.dueThisMonth, icon: <CalendarRange className="w-4 h-4" />, color: "#0891b2" },
    { label: d.paid,         bills: summary.paid,          icon: <CheckCircle2 className="w-4 h-4" />, color: "#4caf50" },
    { label: d.pending,      bills: summary.pending,       icon: <Clock className="w-4 h-4" />,        color: "#94a3b8" },
    { label: d.overdue,      bills: summary.overdue,       icon: <AlertCircle className="w-4 h-4" />,  color: "#f44336" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
