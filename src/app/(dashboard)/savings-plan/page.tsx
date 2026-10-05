import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import { SavingsPlanPageClient } from "@/components/savings/savings-plan-page-client";
import type { SavingsBucket, Group } from "@/types/database";

export default async function SavingsPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const [{ data: buckets }, { data: groups }] = await Promise.all([
    supabase.from("savings_buckets").select("*").eq("account_id", accountId ?? "").eq("is_active", true).order("created_at"),
    supabase.from("groups").select("*").eq("account_id", accountId ?? "").order("name"),
  ]);

  return (
    <SavingsPlanPageClient
      initialBuckets={(buckets ?? []) as SavingsBucket[]}
      groups={(groups ?? []) as Group[]}
    />
  );
}
