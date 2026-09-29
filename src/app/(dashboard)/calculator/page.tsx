import { CalculatorPageClient } from "@/components/calculator/calculator-page-client";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import type { Group } from "@/types/database";

export default async function CalculatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accountId = user ? await getActiveAccountId(supabase, user.id) : null;

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .eq("account_id", accountId ?? "")
    .order("name");

  return <CalculatorPageClient groups={(groups ?? []) as Group[]} />;
}
