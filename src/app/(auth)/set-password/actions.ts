"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function completeInviteSignupAction(input: { full_name: string; language: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login");

  const admin = createAdminClient();
  const lang = input.language === "es" ? "es" : "en";

  await supabase.from("profiles").upsert(
    { user_id: user.id, full_name: input.full_name || "", language: lang },
    { onConflict: "user_id" }
  );

  const { data: existingMembership } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingMembership) {
    const { data: account } = await admin
      .from("accounts")
      .insert({ name: input.full_name || "My Budget", is_personal: true, created_by: user.id })
      .select("id")
      .single();
    if (account) {
      await admin.from("account_members").insert({ account_id: account.id, user_id: user.id });
    }
  }

  const { data: invites } = await admin
    .from("account_invites")
    .select("id, account_id")
    .eq("status", "pending")
    .eq("email", user.email.toLowerCase());

  for (const invite of invites ?? []) {
    await admin
      .from("account_members")
      .upsert({ account_id: invite.account_id, user_id: user.id }, { onConflict: "account_id,user_id" });
    await admin
      .from("account_invites")
      .update({ status: "accepted", invited_user_id: user.id, responded_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  const store = await cookies();
  store.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  redirect("/choose-account");
}
