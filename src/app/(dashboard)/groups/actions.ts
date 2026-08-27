"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";

export async function createGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data, error } = await supabase
    .from("groups")
    .insert({
      account_id: accountId,
      user_id: user.id,
      name: formData.get("name") as string,
      color: (formData.get("color") as string) || "#4f46e5",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { success: true, id: data.id };
}

export async function updateGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("groups")
    .update({
      name: formData.get("name") as string,
      color: formData.get("color") as string,
    })
    .eq("id", formData.get("id") as string)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { success: true };
}

export async function getAssignableBillsAction(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bills: [], templates: [] };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { bills: [], templates: [] };

  // Only offer ungrouped items plus whatever's already in this group --
  // reassigning something out of a *different* group isn't this picker's job.
  // Bills generated from a recurring template are excluded here (is_recurring
  // = false only) -- those are represented by their template instead, so
  // assigning the template covers all of its generated bills at once rather
  // than listing every individual monthly instance.
  const [{ data: bills }, { data: templates }] = await Promise.all([
    supabase
      .from("bills")
      .select("id, name, amount, due_date, is_recurring, group_id")
      .eq("account_id", accountId)
      .eq("is_recurring", false)
      .or(`group_id.is.null,group_id.eq.${groupId}`)
      .order("due_date", { ascending: false }),
    supabase
      .from("recurring_templates")
      .select("id, name, amount, frequency, group_id")
      .eq("account_id", accountId)
      .or(`group_id.is.null,group_id.eq.${groupId}`)
      .order("name"),
  ]);

  return { bills: bills ?? [], templates: templates ?? [] };
}

export async function assignBillsToGroupAction(groupId: string, billIds: string[], templateIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const [{ data: currentBills }, { data: currentTemplates }] = await Promise.all([
    supabase.from("bills").select("id").eq("group_id", groupId).eq("account_id", accountId),
    supabase.from("recurring_templates").select("id").eq("group_id", groupId).eq("account_id", accountId),
  ]);

  const billsToRemove = (currentBills ?? []).map((b) => b.id).filter((id) => !billIds.includes(id));
  const templatesToRemove = (currentTemplates ?? []).map((t) => t.id).filter((id) => !templateIds.includes(id));

  // Removals and additions must run sequentially, not raced via Promise.all,
  // since "clear everyone currently in this group" and "add the checked ones"
  // touch overlapping rows and would otherwise be order-dependent.
  if (billsToRemove.length) {
    const { error } = await supabase.from("bills").update({ group_id: null }).in("id", billsToRemove).eq("account_id", accountId);
    if (error) return { error: error.message };
  }
  if (billIds.length) {
    const { error } = await supabase.from("bills").update({ group_id: groupId }).in("id", billIds).eq("account_id", accountId);
    if (error) return { error: error.message };
  }
  if (templatesToRemove.length) {
    const { error } = await supabase.from("recurring_templates").update({ group_id: null }).in("id", templatesToRemove).eq("account_id", accountId);
    if (error) return { error: error.message };
  }
  if (templateIds.length) {
    const { error } = await supabase.from("recurring_templates").update({ group_id: groupId }).in("id", templateIds).eq("account_id", accountId);
    if (error) return { error: error.message };
  }

  // A template's group only steers bills generated *after* this point unless
  // we also cascade it to bills already generated from that template -- so
  // do that here. Removal only touches bills still sitting in this exact
  // group, so a bill someone manually moved elsewhere isn't clobbered.
  if (templatesToRemove.length) {
    const { error } = await supabase
      .from("bills")
      .update({ group_id: null })
      .in("recurring_template_id", templatesToRemove)
      .eq("group_id", groupId)
      .eq("account_id", accountId);
    if (error) return { error: error.message };
  }
  if (templateIds.length) {
    const { error } = await supabase
      .from("bills")
      .update({ group_id: groupId })
      .in("recurring_template_id", templateIds)
      .eq("account_id", accountId);
    if (error) return { error: error.message };
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteGroupAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { success: true };
}
