import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { TemplateForm } from "@/components/recurring/template-form";
import { TemplateRow } from "@/components/recurring/template-row";
import { GenerateButton } from "@/components/recurring/generate-button";
import { MonthPicker } from "@/components/ui/month-picker";
import { formatCurrency } from "@/lib/utils";
import type { RecurringTemplate, Category, Group } from "@/types/database";
import { getServerDict } from "@/lib/i18n/server";
import { getActiveAccountId } from "@/lib/supabase/account";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const dict = await getServerDict();
  const t = dict.recurring;

  const now = new Date();
  const selectedMonth =
    month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = selectedMonth.split("-").map(Number);
  const monthLabel = new Date(year, mon - 1).toLocaleString(dict.locale, {
    month: "long",
    year: "numeric",
  });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const [{ data: templates }, { data: categories }, { data: groups }] = await Promise.all([
    supabase.from("recurring_templates").select("*").eq("account_id", accountId ?? "").order("name"),
    supabase.from("categories").select("*").eq("account_id", accountId ?? "").order("name"),
    supabase.from("groups").select("*").eq("account_id", accountId ?? "").order("name"),
  ]);

  const allTemplates = (templates ?? []) as RecurringTemplate[];
  const active = allTemplates.filter((tpl) => tpl.is_active);
  const inactive = allTemplates.filter((tpl) => !tpl.is_active);
  const monthlyTotal = active.reduce((s, tpl) => s + tpl.amount, 0);

  return (
    <>
      <Topbar title={t.title}>
        <TemplateForm
          categories={categories as Category[] ?? []}
          groups={groups as Group[] ?? []}
        />
      </Topbar>

      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Month picker + generate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <MonthPicker value={selectedMonth} label={monthLabel} />
          <GenerateButton month={selectedMonth} />
        </div>

        {/* Summary bar */}
        {active.length > 0 && (
          <div className="flex flex-wrap gap-4 px-5 py-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">{t.active}</p>
              <p className="text-lg font-bold text-[var(--color-foreground)]">{active.length}</p>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">{t.monthlyTotalLabel}</p>
              <p className="text-lg font-bold text-[var(--color-primary)]">{formatCurrency(monthlyTotal)}</p>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">{t.inactive}</p>
              <p className="text-lg font-bold text-[var(--color-muted-foreground)]">{inactive.length}</p>
            </div>
          </div>
        )}

        {/* Template list */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          {allTemplates.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[var(--color-muted-foreground)] text-sm">{t.noTemplates}</p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-1">
                {t.noTemplatesHint}
              </p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-[var(--color-muted)] border-b border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                      {t.active} ({active.length})
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {active.map((tpl) => (
                      <TemplateRow
                        key={tpl.id}
                        template={tpl}
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
                      {t.inactive} ({inactive.length})
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {inactive.map((tpl) => (
                      <TemplateRow
                        key={tpl.id}
                        template={tpl}
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
