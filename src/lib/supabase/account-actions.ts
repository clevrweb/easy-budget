"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import { ACCOUNT_COOKIE } from "./account";

export async function selectAccountAction(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .maybeSingle();

  if (!data) redirect("/choose-account");

  const store = await cookies();
  store.set(ACCOUNT_COOKIE, accountId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/dashboard");
}

export async function renameAccountAction(accountId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "empty" as const };

  const { data: membership } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!membership) return { error: "Not a member" };

  const admin = createAdminClient();
  const { error } = await admin.from("accounts").update({ name: trimmed }).eq("id", accountId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
