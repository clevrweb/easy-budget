import { StockProjectionClient } from "@/components/calculators/stock/stock-projection-client";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import type { Group, SavingsBucket } from "@/types/database";

export default async function StockProjectionPage({
  searchParams,
}: {
  searchParams: Promise<{ bucketId?: string }>;
}) {
  const { bucketId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const [{ data: groups }, { data: bucket }] = await Promise.all([
    supabase.from("groups").select("*").eq("account_id", accountId ?? "").order("name"),
    bucketId
      ? supabase.from("savings_buckets").select("*").eq("id", bucketId).eq("account_id", accountId ?? "").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <StockProjectionClient
      groups={(groups ?? []) as Group[]}
      bucket={(bucket ?? null) as SavingsBucket | null}
    />
  );
}
