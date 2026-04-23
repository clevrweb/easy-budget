import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { BillRow } from "@/components/bills/bill-row";
import { BillsHeader } from "@/components/bills/bills-header";
import type { Bill, Category, Group } from "@/types/database";
import type { ViewMode, StatusFilter } from "@/components/bills/bills-header";

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
  searchParams: Promise<{ view?: string; date?: string; status?: string; q?: string }>;
}) {
  const { view: rawView, date: rawDate, status: rawStatus, q = "" } = await searchParams;

  const view = (["day", "week", "month", "all"].includes(rawView ?? "") ? rawView : "month") as ViewMode;
  const status = (["all", "pending", "paid", "overdue"].includes(rawStatus ?? "") ? rawStatus : "all") as StatusFilter;

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
      <Topbar title="Bills">
        <Link
          href="/bills/new"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Bill
        </Link>
      </Topbar>

      <main className="flex-1 p-4 md:p-6 space-y-4">
        <BillsHeader view={view} date={date} status={status} search={q} />

        {/* Bills list */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[var(--color-muted-foreground)] text-sm">No bills found.</p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-1">
                Try a different period or add a new bill.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filtered.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  categories={(categories ?? []) as Category[]}
                  groups={(groups ?? []) as Group[]}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-muted)] flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">
                {filtered.length} {filtered.length === 1 ? "bill" : "bills"}
              </span>
              <span className="font-semibold text-[var(--color-foreground)]">
                ${filtered.reduce((s, b) => s + b.amount, 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
