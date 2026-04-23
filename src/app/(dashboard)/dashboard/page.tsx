import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BillsList } from "@/components/dashboard/bills-list";
import { BillForm } from "@/components/bills/bill-form";
import type { Bill, Category, Group } from "@/types/database";

function computeSummary(bills: Bill[]) {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  return {
    dueToday: bills.filter((b) => b.due_date === today && b.status !== "paid"),
    dueThisWeek: bills.filter((b) => b.due_date > today && b.due_date <= weekEnd.toISOString().split("T")[0] && b.status !== "paid"),
    dueThisMonth: bills.filter((b) => b.due_date >= monthStart && b.due_date <= monthEnd && b.status !== "paid"),
    paid: bills.filter((b) => b.status === "paid" && b.due_date >= monthStart && b.due_date <= monthEnd),
    pending: bills.filter((b) => b.status === "pending" && b.due_date >= monthStart && b.due_date <= monthEnd),
    overdue: bills.filter((b) => b.status === "overdue" || (b.status === "pending" && b.due_date < today)),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: bills = [] } = await supabase
    .from("bills")
    .select("*")
    .gte("due_date", monthStart)
    .lte("due_date", monthEnd)
    .order("due_date", { ascending: true });

  // Also fetch overdue from prior months
  const { data: overdueBills = [] } = await supabase
    .from("bills")
    .select("*")
    .lt("due_date", monthStart)
    .eq("status", "pending");

  const allBills = [...(bills ?? []), ...(overdueBills ?? [])] as Bill[];
  const summary = computeSummary(allBills);

  const [{ data: categories }, { data: groups }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("groups").select("*").order("name"),
  ]);

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <Topbar title="Dashboard">
        <BillForm categories={categories as Category[] ?? []} groups={groups as Group[] ?? []} />
      </Topbar>
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
            {monthLabel}
          </h2>
        </div>

        <SummaryCards summary={summary} />
        <BillsList bills={bills as Bill[]} title="Bills This Month" />
      </main>
    </>
  );
}
