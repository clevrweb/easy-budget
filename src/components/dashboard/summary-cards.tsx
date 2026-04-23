import { Calendar, CalendarDays, CalendarRange, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
  accentClass: string;
  borderClass: string;
}

function SummaryCard({ label, bills, icon, accentClass, borderClass }: SummaryCardProps) {
  const total = bills.reduce((sum, b) => sum + b.amount, 0);
  return (
    <div
      className={`bg-[var(--color-card)] rounded-xl border-l-4 ${borderClass} shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 transition-all duration-200 p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {label}
        </span>
        <span className={`${accentClass}`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${accentClass}`}>{formatCurrency(total)}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
        {bills.length} {bills.length === 1 ? "bill" : "bills"}
      </p>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    {
      label: "Due Today",
      bills: summary.dueToday,
      icon: <Calendar className="w-4 h-4" />,
      accentClass: "text-[var(--color-primary)]",
      borderClass: "border-[var(--color-primary)]",
    },
    {
      label: "Due This Week",
      bills: summary.dueThisWeek,
      icon: <CalendarDays className="w-4 h-4" />,
      accentClass: "text-[var(--color-warning)]",
      borderClass: "border-[var(--color-warning)]",
    },
    {
      label: "Due This Month",
      bills: summary.dueThisMonth,
      icon: <CalendarRange className="w-4 h-4" />,
      accentClass: "text-blue-500",
      borderClass: "border-blue-500",
    },
    {
      label: "Paid",
      bills: summary.paid,
      icon: <CheckCircle2 className="w-4 h-4" />,
      accentClass: "text-[var(--color-success)]",
      borderClass: "border-[var(--color-success)]",
    },
    {
      label: "Pending",
      bills: summary.pending,
      icon: <Clock className="w-4 h-4" />,
      accentClass: "text-[var(--color-muted-foreground)]",
      borderClass: "border-[var(--color-muted-foreground)]",
    },
    {
      label: "Overdue",
      bills: summary.overdue,
      icon: <AlertCircle className="w-4 h-4" />,
      accentClass: "text-[var(--color-danger)]",
      borderClass: "border-[var(--color-danger)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
