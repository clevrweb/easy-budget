import Link from "next/link";
import { RefreshCcw, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { CollapsibleSummary } from "@/components/dashboard/collapsible-summary";
import { BillsHeader } from "@/components/bills/bills-header";
import { BillsGroupedList } from "@/components/bills/bills-grouped-list";
import { GenerateButton } from "@/components/recurring/generate-button";
import { formatCurrency } from "@/lib/utils";
import type { Bill, Category, Group, RecurringTemplate } from "@/types/database";
import type { ViewMode, StatusFilter } from "@/components/bills/bills-header";

function getDateRange(view: ViewMode, date: string): { start: string; end: string } | null {
  if (view === "all") return null;
  if (view === "month") {
    const [y, m] = date.split("-").map(Number);
    return {
      start: `${y}-${String(m).padStart(2, "0")}-01`,
      end: new Date(y, m, 0).toISOString().split("T")[0],
    };
  }
  if (view === "week") {
    const endDate = new Date(date + "T00:00:00");
    endDate.setDate(endDate.getDate() + 6);
    return { start: date, end: endDate.toISOString().split("T")[0] };
  }
  if (view === "day") return { start: date, end: date };
  return null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; status?: string; q?: string }>;
}) {
  const { view: rawView, date: rawDate, status: rawStatus, q = "" } = await searchParams;

  const view   = (["day", "week", "month", "all"].includes(rawView ?? "") ? rawView : "month") as ViewMode;
  const status = (["all", "pending", "paid", "overdue"].includes(rawStatus ?? "") ? rawStatus : "all") as StatusFilter;
  const now    = new Date();

  const defaultDate = view === "month"
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    : now.toISOString().split("T")[0];
  const date  = rawDate ?? defaultDate;
  const today = now.toISOString().split("T")[0];

  const supabase = await createClient();

  // Summary: current month bills + prior overdue
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const weekEnd    = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const [
    { data: monthBills },
    { data: overdueBills },
    { data: categories },
    { data: groups },
    { data: templates },
  ] = await Promise.all([
    supabase.from("bills").select("*").gte("due_date", monthStart).lte("due_date", monthEnd).order("due_date"),
    supabase.from("bills").select("*").lt("due_date", monthStart).eq("status", "pending"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("groups").select("*").order("name"),
    supabase.from("recurring_templates").select("*").eq("is_active", true),
  ]);

  const allCurrentBills = [...(monthBills ?? []), ...(overdueBills ?? [])] as Bill[];

  const summary = {
    dueToday:    allCurrentBills.filter((b) => b.due_date === today && b.status !== "paid"),
    dueThisWeek: allCurrentBills.filter((b) => b.due_date > today && b.due_date <= weekEnd.toISOString().split("T")[0] && b.status !== "paid"),
    dueThisMonth: allCurrentBills.filter((b) => b.due_date >= monthStart && b.due_date <= monthEnd && b.status !== "paid"),
    paid:        allCurrentBills.filter((b) => b.status === "paid" && b.due_date >= monthStart),
    pending:     allCurrentBills.filter((b) => b.status === "pending" && b.due_date >= monthStart && b.due_date >= today),
    overdue:     allCurrentBills.filter((b) => b.status === "pending" && b.due_date < today),
  };

  // Bills list: filtered by view/date/status/q
  const range = getDateRange(view, date);
  let billsQuery = supabase.from("bills").select("*").order("due_date");
  if (range)  billsQuery = billsQuery.gte("due_date", range.start).lte("due_date", range.end);
  if (q)      billsQuery = billsQuery.ilike("name", `%${q}%`);
  const { data: filteredBillsRaw } = await billsQuery;

  const filteredBills = ((filteredBillsRaw ?? []) as Bill[]).filter((b) => {
    if (status === "all") return true;
    const isOverdue  = b.status === "pending" && b.due_date < today;
    const effective  = isOverdue ? "overdue" : b.status;
    return effective === status;
  });

  // Recurring quick bar
  const activeTemplates = (templates ?? []) as RecurringTemplate[];
  const monthlyTotal    = activeTemplates.reduce((s, t) => s + t.amount, 0);
  const selectedMonth   = view === "month" ? date : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <Topbar title="Dashboard" />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Collapsible summary */}
        <CollapsibleSummary summary={summary} />

        {/* Recurring quick bar */}
        {activeTemplates.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#4caf5018" }}>
              <RefreshCcw className="w-4 h-4 text-[var(--color-success)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--color-foreground)]">Recurring</span>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {activeTemplates.length} active ·{" "}
              <span className="font-semibold text-[var(--color-foreground)]">
                {formatCurrency(monthlyTotal)}/mo
              </span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <GenerateButton month={selectedMonth} />
              <Link
                href="/recurring"
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                Manage
              </Link>
            </div>
          </div>
        )}

        {/* Bills filter + list */}
        <BillsHeader view={view} date={date} status={status} search={q} basePath="/dashboard" />

        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          <BillsGroupedList
            bills={filteredBills}
            categories={(categories ?? []) as Category[]}
            groups={(groups ?? []) as Group[]}
          />
        </div>
      </main>

      {/* Floating action button */}
      <Link
        href="/bills/new"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all z-30"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </>
  );
}
