import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { CollapsibleSummary } from "@/components/dashboard/collapsible-summary";
import { BillsHeader } from "@/components/bills/bills-header";
import { BillsGroupedList } from "@/components/bills/bills-grouped-list";
import { IncomeSection } from "@/components/income/income-section";
import type { Bill, Category, Group, IncomeSource } from "@/types/database";
import type { ViewMode, StatusFilter, GroupBy } from "@/components/bills/bills-header";
import { getServerDict } from "@/lib/i18n/server";
import { getDefaultViewAction } from "@/app/(dashboard)/settings/actions";
import { getActiveAccountId } from "@/lib/supabase/account";

function getMondayOf(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split("T")[0];
}

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

function applyStatusFilter(bills: Bill[], status: StatusFilter, today: string): Bill[] {
  if (status === "all") return bills;
  return bills.filter((b) => {
    const isOverdue = b.status === "pending" && b.due_date < today;
    const effective = isOverdue ? "overdue" : b.status;
    return effective === status;
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; status?: string; q?: string; groupBy?: string }>;
}) {
  const [{ view: rawView, date: rawDate, status: rawStatus, q = "", groupBy: rawGroupBy }, dict, defaultView] = await Promise.all([
    searchParams,
    getServerDict(),
    getDefaultViewAction(),
  ]);

  const view    = (rawView && ["day", "week", "month", "all"].includes(rawView) ? rawView : defaultView) as ViewMode;
  const status  = (["all", "pending", "paid", "overdue"].includes(rawStatus ?? "") ? rawStatus : "all") as StatusFilter;
  const groupBy = (rawGroupBy === "day" ? "day" : "group") as GroupBy;
  const now    = new Date();

  const defaultDate = view === "month"
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    : view === "week"
      ? getMondayOf(now)
      : now.toISOString().split("T")[0];
  const date  = rawDate ?? defaultDate;
  const today = now.toISOString().split("T")[0];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

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
    { data: incomeSources },
  ] = await Promise.all([
    supabase.from("bills").select("*").eq("account_id", accountId ?? "").gte("due_date", monthStart).lte("due_date", monthEnd).order("due_date"),
    supabase.from("bills").select("*").eq("account_id", accountId ?? "").lt("due_date", monthStart).eq("status", "pending"),
    supabase.from("categories").select("*").eq("account_id", accountId ?? "").order("name"),
    supabase.from("groups").select("*").eq("account_id", accountId ?? "").order("name"),
    supabase.from("income_sources").select("*").eq("account_id", accountId ?? "").eq("is_active", true),
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
  let billsQuery = supabase.from("bills").select("*").eq("account_id", accountId ?? "").order("due_date");
  if (range)  billsQuery = billsQuery.gte("due_date", range.start).lte("due_date", range.end);
  if (q)      billsQuery = billsQuery.ilike("name", `%${q}%`);

  // Past due: still-pending bills due before the selected period, clamped to
  // "today" so navigating into a future period never pulls in not-yet-due
  // bills under a "Past Due" label.
  let pastDueQuery = range
    ? supabase.from("bills").select("*").eq("account_id", accountId ?? "").eq("status", "pending")
        .lt("due_date", range.start < today ? range.start : today).order("due_date")
    : null;
  if (pastDueQuery && q) pastDueQuery = pastDueQuery.ilike("name", `%${q}%`);

  const [{ data: filteredBillsRaw }, pastDueResult] = await Promise.all([
    billsQuery,
    pastDueQuery ?? Promise.resolve({ data: [] as Bill[] }),
  ]);

  const filteredBills = applyStatusFilter((filteredBillsRaw ?? []) as Bill[], status, today);
  const pastDueBills   = applyStatusFilter((pastDueResult.data ?? []) as Bill[], status, today);

  const billsTotal = filteredBills.reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <Topbar title={dict.dashboard.title} />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Collapsible summary */}
        <CollapsibleSummary summary={summary} />

        {/* Bills filter + list */}
        <BillsHeader view={view} date={date} status={status} search={q} groupBy={groupBy} basePath="/dashboard" />

        {/* Income + net total section */}
        {range && (
          <IncomeSection
            incomeSources={(incomeSources ?? []) as IncomeSource[]}
            billsTotal={billsTotal}
            range={range}
          />
        )}

        <div className={groupBy === "day" || view === "month" || view === "day" ? "" : "bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden"}>
          <BillsGroupedList
            bills={filteredBills}
            categories={(categories ?? []) as Category[]}
            groups={(groups ?? []) as Group[]}
            groupBy={groupBy}
          />
        </div>

        {/* Past due bills, shown after the regular list */}
        {range && (
          <BillsGroupedList
            bills={pastDueBills}
            categories={(categories ?? []) as Category[]}
            groups={(groups ?? []) as Group[]}
            groupBy={groupBy}
            variant="pastDue"
          />
        )}
      </main>

      {/* Floating action button */}
      <Link
        href="/bills/new"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all z-30"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Plus className="w-4 h-4 text-white" />
      </Link>
    </>
  );
}
