"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveAccountId, ACCOUNT_COOKIE } from "@/lib/supabase/account";

export async function saveSubscriptionAction(subscription: object) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, subscription, enabled: true }, { onConflict: "user_id" });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteSubscriptionAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  revalidatePath("/settings");
  return { success: true };
}

export async function getNotificationStatusAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { enabled: false };

  const { data } = await supabase
    .from("push_subscriptions")
    .select("enabled")
    .eq("user_id", user.id)
    .single();

  return { enabled: !!data?.enabled };
}

export async function updateLanguageAction(lang: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase.from("profiles").upsert({ user_id: user.id, language: lang }, { onConflict: "user_id" });

  const store = await cookies();
  store.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function getSharedAccessDataAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return null;

  const [{ data: account }, { data: memberRows }, { data: invites }, { data: allMemberships }] = await Promise.all([
    supabase.from("accounts").select("id, name, is_personal").eq("id", accountId).single(),
    supabase.from("account_members").select("user_id").eq("account_id", accountId),
    supabase.from("account_invites").select("id, email, status, created_at").eq("account_id", accountId).eq("status", "pending"),
    supabase.from("account_members").select("accounts(id, name, is_personal, created_by)").eq("user_id", user.id),
  ]);

  const admin = createAdminClient();
  const members = await Promise.all(
    (memberRows ?? []).map(async (m: { user_id: string }) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return { userId: m.user_id, email: data.user?.email ?? "" };
    })
  );

  const accounts = ((allMemberships ?? []) as unknown as { accounts: { id: string; name: string; is_personal: boolean; created_by: string | null } | null }[])
    .map((m) => m.accounts)
    .filter((a): a is { id: string; name: string; is_personal: boolean; created_by: string | null } => a !== null)
    .map((a) => ({ id: a.id, name: a.name, is_personal: a.is_personal && a.created_by === user.id }));

  return {
    accountId,
    accountName: account?.name ?? "My Budget",
    isPersonal: account?.is_personal ?? false,
    members,
    pendingInvites: invites ?? [],
    accounts,
    currentUserId: user.id,
  };
}

export async function inviteToAccountAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "invalid_email" as const };
  if (email === user.email?.toLowerCase()) return { error: "self" as const };

  const admin = createAdminClient();
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/set-password`,
  });

  if (inviteError) {
    const message = inviteError.message?.toLowerCase() ?? "";
    const alreadyExists = message.includes("already been registered") || message.includes("already registered");
    if (!alreadyExists) return { error: "generic" as const };

    const { error: dbError } = await admin.from("account_invites").insert({
      account_id: accountId,
      email,
      invited_by: user.id,
      status: "pending",
    });
    if (dbError) {
      if (dbError.code === "23505") return { error: "already_pending" as const };
      return { error: "generic" as const };
    }
    revalidatePath("/settings");
    return { success: true, mode: "existing_user" as const };
  }

  const { error: dbError } = await admin.from("account_invites").insert({
    account_id: accountId,
    email,
    invited_by: user.id,
    invited_user_id: inviteData.user.id,
    status: "pending",
  });
  if (dbError) {
    if (dbError.code === "23505") return { error: "already_pending" as const };
    return { error: "generic" as const };
  }

  revalidatePath("/settings");
  return { success: true, mode: "new_email" as const };
}

export async function revokeInviteAction(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("account_invites")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function exportMyDataAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const [{ data: bills }, { data: categories }, { data: groups }, { data: recurringTemplates }, { data: incomeSources }] =
    await Promise.all([
      supabase.from("bills").select("*").eq("account_id", accountId),
      supabase.from("categories").select("*").eq("account_id", accountId),
      supabase.from("groups").select("*").eq("account_id", accountId),
      supabase.from("recurring_templates").select("*").eq("account_id", accountId),
      supabase.from("income_sources").select("*").eq("account_id", accountId),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    bills: bills ?? [],
    categories: categories ?? [],
    groups: groups ?? [],
    recurringTemplates: recurringTemplates ?? [],
    incomeSources: incomeSources ?? [],
  };
}

export async function deleteMyAccountAction(confirmEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "not_authenticated" as const };
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { error: "email_mismatch" as const };
  }

  const admin = createAdminClient();

  // For every account this user belongs to, delete the account outright if
  // they're the last remaining member -- otherwise it'd be orphaned data
  // nobody could ever reach again. Accounts with other members are left
  // alone; the user's own membership row disappears automatically when
  // their auth user is deleted below (account_members.user_id cascades).
  const { data: memberships } = await admin
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id);

  for (const membership of memberships ?? []) {
    const { count } = await admin
      .from("account_members")
      .select("*", { count: "exact", head: true })
      .eq("account_id", membership.account_id);
    if ((count ?? 0) <= 1) {
      await admin.from("accounts").delete().eq("id", membership.account_id);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return { error: "generic" as const };

  await supabase.auth.signOut();
  const store = await cookies();
  store.delete("lang");
  store.delete(ACCOUNT_COOKIE);
  redirect("/login");
}

export async function getDefaultViewAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "month" as const;

  const { data } = await supabase
    .from("profiles")
    .select("default_view")
    .eq("user_id", user.id)
    .single();

  return (data?.default_view ?? "month") as "day" | "week" | "month";
}

export async function updateDefaultViewAction(view: "day" | "week" | "month") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase.from("profiles").upsert({ user_id: user.id, default_view: view }, { onConflict: "user_id" });

  revalidatePath("/dashboard");
  return { success: true };
}
