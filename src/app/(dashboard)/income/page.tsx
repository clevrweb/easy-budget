import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { IncomeForm } from "@/components/income/income-form";
import { IncomeRow } from "@/components/income/income-row";
import { formatCurrency } from "@/lib/utils";
import { getServerDict } from "@/lib/i18n/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import type { IncomeSource } from "@/types/database";

export default async function IncomePage() {
  const [supabase, dict] = await Promise.all([createClient(), getServerDict()]);
  const t = dict.income;

  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const { data } = await supabase
    .from("income_sources")
    .select("*")
    .eq("account_id", accountId ?? "")
    .order("created_at");

  const sources = (data ?? []) as IncomeSource[];
  const active = sources.filter((s) => s.is_active);
  const inactive = sources.filter((s) => !s.is_active);

  // Approximate monthly income (for summary display)
  const monthlyEstimate = active.reduce((sum, s) => {
    const multiplier: Record<string, number> = {
      weekly: 4.33,
      biweekly: 2.17,
      twice_monthly: 2,
      monthly: 1,
    };
    return sum + s.amount * (multiplier[s.frequency] ?? 1);
  }, 0);

  return (
    <>
      <Topbar title={t.title}>
        <IncomeForm />
      </Topbar>

      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Summary bar */}
        {active.length > 0 && (
          <div className="flex flex-wrap gap-4 px-5 py-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Active</p>
              <p className="text-lg font-bold text-[var(--color-foreground)]">{active.length}</p>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">~Monthly</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyEstimate)}</p>
            </div>
            {inactive.length > 0 && (
              <>
                <div className="w-px bg-[var(--color-border)]" />
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Inactive</p>
                  <p className="text-lg font-bold text-[var(--color-muted-foreground)]">{inactive.length}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sources list */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
          {sources.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[var(--color-muted-foreground)] text-sm">{t.noIncome}</p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-1">{t.noIncomeHint}</p>
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
                    {active.map((s) => (
                      <IncomeRow key={s.id} source={s} />
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
                    {inactive.map((s) => (
                      <IncomeRow key={s.id} source={s} />
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
