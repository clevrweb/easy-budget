import { cookies } from "next/headers";
import { createClient } from "./server";

export const ACCOUNT_COOKIE = "account_id";

export async function getActiveAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const store = await cookies();
  const cookieId = store.get(ACCOUNT_COOKIE)?.value;
  if (cookieId) return cookieId;

  const { data } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return data?.account_id ?? null;
}
