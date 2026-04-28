import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { MonthlyChart } from "@/components/reports/monthly-chart";
import { CategoryChart } from "@/components/reports/category-chart";
import { StatusBreakdown } from "@/components/reports/status-breakdown";
import { MonthPicker } from "@/components/ui/month-picker";
import type { Bill, Category } from "@/types/database";
import type { MonthlyDataPoint } from "@/components/reports/monthly-chart";
import type { CategoryDataPoint } from "@/components/reports/category-chart";
import { getServerDict } from "@/lib/i18n";

const FALLBACK_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ month }, dict] = await Promise.all([
    searchParams,
    getServerDict(),
  ]);
  const t = dict.reports;

  const now = new Date();
  const selectedMonth =
    month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selYear, selMon] = selectedMonth.split("-").map(Number);

  // Build 6-month date range ending at selected month
  const months: { year: number; mon: number; label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(selYear, selMon - 1 - i, 1);
    months.push({
      year: d.getFullYear(),
      mon: d.getMonth() + 1,
      label: d.toLocaleString(dict.locale, { month: "short", year: "2-digit" }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }

  const rangeStart = `${months[0].year}-${String(months[0].mon).padStart(2, "0")}-01`;
  const rangeEnd = new Date(selYear, selMon, 0).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const supabase = await createClient();

  const [{ data: bills }, { data: categories }] = await Promise.all([
    supabase.from("bills").select("*").gte("due_date", rangeStart).lte("due_date", rangeEnd),
    supabase.from("categories").select("*"),
  ]);

  const allBills = (bills ?? []) as Bill[];
  const allCategories = (categories ?? []) as Category[];

  // --- Monthly trend data ---
  const monthlyData: MonthlyDataPoint[] = months.map(({ label, year, mon }) => {
    const start = `${year}-${String(mon).padStart(2, "0")}-01`;
    const end = new Date(year, mon, 0).toISOString().split("T")[0];
    const monthBills = allBills.filter((b) => b.due_date >= start && b.due_date <= end);

    return {
      month: label,
      paid: monthBills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0),
      pending: monthBills.filter((b) => b.status === "pending" && b.due_date >= today).reduce((s, b) => s + b.amount, 0),
      overdue: monthBills.filter((b) => b.status === "pending" && b.due_date < today).reduce((s, b) => s + b.amount, 0),
    };
  });

  // --- Selected month bills ---
  const selStart = `${selYear}-${String(selMon).padStart(2, "0")}-01`;
  const selEnd = new Date(selYear, selMon, 0).toISOString().split("T")[0];
  const selBills = allBills.filter((b) => b.due_date >= selStart && b.due_date <= selEnd);

  const totalAmount = selBills.reduce((s, b) => s + b.amount, 0);
  const paidAmount = selBills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const pendingAmount = selBills.filter((b) => b.status === "pending" && b.due_date >= today).reduce((s, b) => s + b.amount, 0);
  const overdueAmount = selBills.filter((b) => b.status === "pending" && b.due_date < today).reduce((s, b) => s + b.amount, 0);

  // --- Category breakdown ---
  const catMap = new Map(allCategories.map((c) => [c.id, c]));
  const categoryTotals = new Map<string, { name: string; value: number; color: string }>();

  selBills.forEach((bill) => {
    const key = bill.category_id ?? "__none__";
    const cat = bill.category_id ? catMap.get(bill.category_id) : null;
    const name = cat?.name ?? t.uncategorized;
    const color = cat?.color ?? "#94a3b8";

    const existing = categoryTotals.get(key);
    if (existing) existing.value += bill.amount;
    else categoryTotals.set(key, { name, value: bill.amount, color });
  });

  const categoryData: CategoryDataPoint[] = Array.from(categoryTotals.values())
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({
      ...item,
      color: item.color !== "#94a3b8" ? item.color : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }));

  const monthLabel = new Date(selYear, selMon - 1).toLocaleString(dict.locale, { month: "long", year: "numeric" });

  return (
    <>
      <Topbar title={t.title} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Month picker */}
        <MonthPicker value={selectedMonth} label={monthLabel} />

        {/* Status breakdown */}
        <StatusBreakdown
          total={totalAmount}
          paid={paidAmount}
          pending={pendingAmount}
          overdue={overdueAmount}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly trend */}
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
            <h2 className="font-semibold text-[var(--color-foreground)] mb-1">{t.monthlyTrend}</h2>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-5">{t.last6Months}</p>
            <MonthlyChart data={monthlyData} />
          </div>

          {/* Category breakdown */}
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
            <h2 className="font-semibold text-[var(--color-foreground)] mb-1">{t.byCategory}</h2>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-5">{monthLabel}</p>
            <CategoryChart data={categoryData} />
          </div>
        </div>

        {/* Top categories table */}
        {categoryData.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-semibold text-[var(--color-foreground)]">{t.categoryBreakdown}</h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {categoryData.map((cat) => {
                const pct = totalAmount > 0 ? (cat.value / totalAmount) * 100 : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm text-[var(--color-foreground)]">{cat.name}</span>
                    <div className="w-32 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-[var(--color-muted-foreground)] w-10 text-right shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                    <span className="font-semibold text-sm text-[var(--color-foreground)] w-24 text-right shrink-0">
                      ${cat.value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
