"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./server";
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
