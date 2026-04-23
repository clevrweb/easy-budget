import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { BillForm } from "@/components/bills/bill-form";
import { BillRow } from "@/components/bills/bill-row";
import { MonthPicker } from "@/components/ui/month-picker";
import type { Bill, Category, Group } from "@/types/database";

type FilterStatus = "all" | "pending" | "paid" | "overdue";

const tabs: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; month?: string }>;
}) {
  const { status = "all", month } = await searchParams;

  const supabase = await createClient();

  const now = new Date();
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = selectedMonth.split("-").map(Number);
  const monthStart = new Date(year, mon - 1, 1).toISOString().split("T")[0];
  const monthEnd = new Date(year, mon, 0).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const [{ data: bills }, { data: categories }, { data: groups }] = await Promise.all([
    supabase.from("bills").select("*").gte("due_date", monthStart).lte("due_date", monthEnd).order("due_date"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("groups").select("*").order("name"),
  ]);

  const allBills = (bills ?? []) as Bill[];

  const filtered = allBills.filter((b) => {
    const isActuallyOverdue = b.status === "pending" && b.due_date < today;
    const effectiveStatus = isActuallyOverdue ? "overdue" : b.status;
    if (status === "all") return true;
    return effectiveStatus === status;
  });

  const totals = {
    all: allBills.reduce((s, b) => s + b.amount, 0),
    paid: allBills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0),
    pending: allBills.filter((b) => b.status === "pending" && b.due_date >= today).reduce((s, b) => s + b.amount, 0),
    overdue: allBills.filter((b) => b.status === "pending" && b.due_date < today).reduce((s, b) => s + b.amount, 0),
  };

  const monthLabel = new Date(year, mon - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <Topbar title="Bills">
        <BillForm categories={categories as Category[] ?? []} groups={groups as Group[] ?? []} />
      </Topbar>

      <main className="flex-1 p-6 space-y-5">
        {/* Month picker */}
        <MonthPicker value={selectedMonth} label={monthLabel} />

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[var(--color-muted)] p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={`/bills?status=${tab.value}&month=${selectedMonth}`}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                status === tab.value
                  ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Bills list */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[var(--color-muted-foreground)] text-sm">No bills found.</p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-1">
                Add a bill using the button above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filtered.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  categories={categories as Category[] ?? []}
                  groups={groups as Group[] ?? []}
                />
              ))}
            </div>
          )}

          {/* Footer summary */}
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
