import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import { CompoundCalculatorClient } from "@/components/calculators/compound-calculator-client";
import type { SavingsBucket } from "@/types/database";

export default async function CompoundCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ bucketId?: string }>;
}) {
  const { bucketId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const { data: bucket } = bucketId
    ? await supabase.from("savings_buckets").select("*").eq("id", bucketId).eq("account_id", accountId ?? "").maybeSingle()
    : { data: null };

  return <CompoundCalculatorClient bucket={bucket as SavingsBucket | null} />;
}
