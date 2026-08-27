import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import { computeSnowballPlan } from "@/lib/debt-snowball";
import { DebtsPageClient } from "@/components/debts/debts-page-client";
import type { Debt } from "@/types/database";

export default async function DebtsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const [{ data: debtsData }, { data: settingsRow }] = await Promise.all([
    supabase.from("debts").select("*").eq("account_id", accountId ?? "").eq("is_active", true).order("balance"),
    supabase.from("debt_settings").select("extra_monthly_payment").eq("account_id", accountId ?? "").maybeSingle(),
  ]);

  const debts = (debtsData ?? []) as Debt[];
  const extraMonthlyPayment = settingsRow?.extra_monthly_payment ?? 0;
  const plan = computeSnowballPlan(debts, extraMonthlyPayment);

  return (
    <DebtsPageClient
      initialDebts={debts}
      initialExtraPayment={extraMonthlyPayment}
      initialPlan={plan}
    />
  );
}
