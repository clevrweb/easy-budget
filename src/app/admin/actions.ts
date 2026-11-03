"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/supabase/admin-guard";
import { getAppConfig, setAppConfig } from "@/lib/config/app-config";
import { sendSms } from "@/lib/sms/bird";
import { createAdminClient } from "@/lib/supabase/admin";

interface ResendConfigShape {
  apiKey?: string;
  fromEmail?: string;
}

interface BirdConfigShape {
  apiKey?: string;
  from?: string;
}

export async function getAdminConfigAction() {
  await requireSuperadmin();
  const [resend, bird] = await Promise.all([
    getAppConfig<ResendConfigShape>("resend"),
    getAppConfig<BirdConfigShape>("bird"),
  ]);
  return {
    resend: { apiKey: resend?.apiKey ?? "", fromEmail: resend?.fromEmail ?? "" },
    bird: { apiKey: bird?.apiKey ?? "", from: bird?.from ?? "" },
  };
}

export async function saveResendConfigAction(formData: FormData) {
  await requireSuperadmin();
  const apiKey = ((formData.get("apiKey") as string) || "").trim();
  const fromEmail = ((formData.get("fromEmail") as string) || "").trim();

  const { error } = await setAppConfig("resend", { apiKey, fromEmail });
  if (error) return { error };

  revalidatePath("/admin");
  return { success: true };
}

export async function saveBirdConfigAction(formData: FormData) {
  await requireSuperadmin();
  const apiKey = ((formData.get("apiKey") as string) || "").trim();
  const from = ((formData.get("from") as string) || "").trim();

  const { error } = await setAppConfig("bird", { apiKey, from });
  if (error) return { error };

  revalidatePath("/admin");
  return { success: true };
}

export async function sendTestSmsAction(formData: FormData) {
  await requireSuperadmin();
  const phone = ((formData.get("phone") as string) || "").trim();
  if (!phone) return { error: "Enter a phone number." };

  return sendSms(phone, "Test message from Budget Whisperer's admin panel.");
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  accountCount: number;
  isSuperadmin: boolean;
}

export async function listAllUsersAction(): Promise<AdminUserRow[]> {
  await requireSuperadmin();
  const admin = createAdminClient();

  const [{ data: usersPage }, { data: profiles }, { data: memberships }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("profiles").select("user_id, full_name, is_superadmin"),
    admin.from("account_members").select("user_id"),
  ]);

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const accountCountByUserId = new Map<string, number>();
  for (const m of memberships ?? []) {
    accountCountByUserId.set(m.user_id, (accountCountByUserId.get(m.user_id) ?? 0) + 1);
  }

  return (usersPage?.users ?? [])
    .map((u) => {
      const profile = profileByUserId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        fullName: profile?.full_name ?? "",
        createdAt: u.created_at,
        accountCount: accountCountByUserId.get(u.id) ?? 0,
        isSuperadmin: profile?.is_superadmin ?? false,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function hardDeleteUserAction(targetUserId: string, confirmEmail: string) {
  const callerUser = await requireSuperadmin();
  const admin = createAdminClient();

  if (targetUserId === callerUser.id) return { error: "self" as const };

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("is_superadmin")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (targetProfile?.is_superadmin) return { error: "superadmin" as const };

  const { data: targetUserRes } = await admin.auth.admin.getUserById(targetUserId);
  const targetEmail = targetUserRes?.user?.email;
  if (!targetEmail || confirmEmail.trim().toLowerCase() !== targetEmail.toLowerCase()) {
    return { error: "email_mismatch" as const };
  }

  // Same cascade as a user deleting their own account (deleteMyAccountAction
  // in the settings actions): delete any account where this user is the last
  // remaining member, leave shared accounts intact for the other members.
  // The user's own membership rows disappear automatically when their auth
  // user is deleted below.
  const { data: memberships } = await admin
    .from("account_members")
    .select("account_id")
    .eq("user_id", targetUserId);

  for (const membership of memberships ?? []) {
    const { count } = await admin
      .from("account_members")
      .select("*", { count: "exact", head: true })
      .eq("account_id", membership.account_id);
    if ((count ?? 0) <= 1) {
      await admin.from("accounts").delete().eq("id", membership.account_id);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);
  if (deleteError) return { error: "generic" as const };

  revalidatePath("/admin");
  return { success: true };
}
