import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { BillsGroupedList } from "@/components/bills/bills-grouped-list";
import { BillsHeader } from "@/components/bills/bills-header";
import type { Bill, Category, Group } from "@/types/database";
import type { ViewMode, StatusFilter, GroupBy } from "@/components/bills/bills-header";
import { getServerDict } from "@/lib/i18n/server";

function getDateRange(view: ViewMode, date: string): { start: string; end: string } | null {
  if (view === "all") return null;

  if (view === "month") {
    const [y, m] = date.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end   = new Date(y, m, 0).toISOString().split("T")[0];
    return { start, end };
  }

  if (view === "week") {
    const start = date;
    const endDate = new Date(date + "T00:00:00");
    endDate.setDate(endDate.getDate() + 6);
    return { start, end: endDate.toISOString().split("T")[0] };
  }

  if (view === "day") {
    return { start: date, end: date };
  }

  return null;
}

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; status?: string; q?: string; groupBy?: string }>;
}) {
  const [{ view: rawView, date: rawDate, status: rawStatus, q = "", groupBy: rawGroupBy }, dict] = await Promise.all([
    searchParams,
    getServerDict(),
  ]);

  const view    = (["day", "week", "month", "all"].includes(rawView ?? "") ? rawView : "month") as ViewMode;
  const status  = (["all", "pending", "paid", "overdue"].includes(rawStatus ?? "") ? rawStatus : "all") as StatusFilter;
  const groupBy = (rawGroupBy === "day" ? "day" : "group") as GroupBy;

  const now = new Date();
  const defaultDate = view === "month"
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    : now.toISOString().split("T")[0];
  const date = rawDate ?? defaultDate;

  const range = getDateRange(view, date);
  const today = now.toISOString().split("T")[0];

  const supabase = await createClient();

  let query = supabase.from("bills").select("*").order("due_date");
  if (range) {
    query = query.gte("due_date", range.start).lte("due_date", range.end);
  }
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const [{ data: bills }, { data: categories }, { data: groups }] = await Promise.all([
    query,
    supabase.from("categories").select("*").order("name"),
    supabase.from("groups").select("*").order("name"),
  ]);

  const allBills = (bills ?? []) as Bill[];

  const filtered = allBills.filter((b) => {
    if (status === "all") return true;
    const isOverdue = b.status === "pending" && b.due_date < today;
    const effective = isOverdue ? "overdue" : b.status;
    return effective === status;
  });

  return (
    <>
      <Topbar title={dict.bills.title} />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        <BillsHeader view={view} date={date} status={status} search={q} groupBy={groupBy} />

        {/* Bills list */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          <BillsGroupedList
            bills={filtered}
            categories={(categories ?? []) as Category[]}
            groups={(groups ?? []) as Group[]}
            groupBy={groupBy}
          />
        </div>
      </main>

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
