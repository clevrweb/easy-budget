import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { TemplateForm } from "@/components/recurring/template-form";
import { TemplateRow } from "@/components/recurring/template-row";
import { GenerateButton } from "@/components/recurring/generate-button";
import { formatCurrency } from "@/lib/utils";
import type { RecurringTemplate, Category, Group } from "@/types/database";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const now = new Date();
  const selectedMonth =
    month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = selectedMonth.split("-").map(Number);
  const monthLabel = new Date(year, mon - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const supabase = await createClient();

  const [{ data: templates }, { data: categories }, { data: groups }] = await Promise.all([
    supabase.from("recurring_templates").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("groups").select("*").order("name"),
  ]);

  const allTemplates = (templates ?? []) as RecurringTemplate[];
  const active = allTemplates.filter((t) => t.is_active);
  const inactive = allTemplates.filter((t) => !t.is_active);
  const monthlyTotal = active.reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Topbar title="Recurring">
        <TemplateForm
          categories={categories as Category[] ?? []}
          groups={groups as Group[] ?? []}
        />
      </Topbar>

      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Month picker + generate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--color-muted-foreground)] font-medium">Month</label>
            <form method="get">
              <input
                type="month"
                name="month"
                defaultValue={selectedMonth}
                onChange={(e) => (e.target.form as HTMLFormElement).submit()}
                className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
            </form>
            <span className="text-sm text-[var(--color-muted-foreground)]">{monthLabel}</span>
          </div>
          <GenerateButton month={selectedMonth} />
        </div>

        {/* Summary bar */}
        {active.length > 0 && (
          <div className="flex flex-wrap gap-4 px-5 py-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Active</p>
              <p className="text-lg font-bold text-[var(--color-foreground)]">{active.length}</p>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Monthly Total</p>
              <p className="text-lg font-bold text-[var(--color-primary)]">{formatCurrency(monthlyTotal)}</p>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Inactive</p>
              <p className="text-lg font-bold text-[var(--color-muted-foreground)]">{inactive.length}</p>
            </div>
          </div>
        )}

        {/* Template list */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          {allTemplates.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[var(--color-muted-foreground)] text-sm">No recurring templates yet.</p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-1">
                Add a template to automatically generate bills each month.
              </p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-[var(--color-muted)] border-b border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                      Active ({active.length})
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {active.map((t) => (
                      <TemplateRow
                        key={t.id}
                        template={t}
                        categories={categories as Category[] ?? []}
                        groups={groups as Group[] ?? []}
                      />
                    ))}
                  </div>
                </div>
              )}

              {inactive.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-[var(--color-muted)] border-y border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                      Inactive ({inactive.length})
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {inactive.map((t) => (
                      <TemplateRow
                        key={t.id}
                        template={t}
                        categories={categories as Category[] ?? []}
                        groups={groups as Group[] ?? []}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
