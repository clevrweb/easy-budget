"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInviteAction(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("account_invites")
    .select("id, account_id, email, status")
    .eq("id", inviteId)
    .single();

  if (!invite || invite.status !== "pending" || invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: "Invalid invite" };
  }

  await admin.from("account_members").upsert(
    { account_id: invite.account_id, user_id: user.id },
    { onConflict: "account_id,user_id" }
  );
  await admin
    .from("account_invites")
    .update({ status: "accepted", invited_user_id: user.id, responded_at: new Date().toISOString() })
    .eq("id", invite.id);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function declineInviteAction(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("account_invites")
    .select("id, email, status")
    .eq("id", inviteId)
    .single();

  if (!invite || invite.status !== "pending" || invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: "Invalid invite" };
  }

  await admin
    .from("account_invites")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", invite.id);

  revalidatePath("/", "layout");
  return { success: true };
}
