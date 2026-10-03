"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import type { BucketProjectionType, BucketContributionFrequency } from "@/types/database";

export async function createBucketAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const contributionAmount = formData.get("contribution_amount") as string;
  const targetDate = formData.get("target_date") as string;
  const contributionFrequency = formData.get("contribution_frequency") as string;

  const { data, error } = await supabase
    .from("savings_buckets")
    .insert({
      account_id: accountId,
      user_id: user.id,
      name: formData.get("name") as string,
      target_amount: parseFloat(formData.get("target_amount") as string),
      current_amount: parseFloat(formData.get("current_amount") as string) || 0,
      target_date: targetDate || null,
      contribution_amount: contributionAmount ? parseFloat(contributionAmount) : null,
      contribution_frequency: contributionFrequency || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/savings-plan");
  return { success: true, id: data.id };
}

export async function updateBucketAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const id = formData.get("id") as string;
  const contributionAmount = formData.get("contribution_amount") as string;
  const targetDate = formData.get("target_date") as string;
  const contributionFrequency = formData.get("contribution_frequency") as string;

  const { error } = await supabase
    .from("savings_buckets")
    .update({
      name: formData.get("name") as string,
      target_amount: parseFloat(formData.get("target_amount") as string),
      current_amount: parseFloat(formData.get("current_amount") as string) || 0,
      target_date: targetDate || null,
      contribution_amount: contributionAmount ? parseFloat(contributionAmount) : null,
      contribution_frequency: contributionFrequency || null,
    })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/savings-plan");
  return { success: true };
}

export async function deleteBucketAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase.from("savings_buckets").delete().eq("id", id).eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/savings-plan");
  return { success: true };
}

export async function getBucketsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return [];

  const { data } = await supabase
    .from("savings_buckets")
    .select("*")
    .eq("account_id", accountId)
    .eq("is_active", true)
    .order("created_at");

  return data ?? [];
}

export interface CreateBucketFromProjectionInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  contributionAmount: number;
  contributionFrequency: BucketContributionFrequency;
  projectionType: BucketProjectionType;
  projectionInput: Record<string, unknown>;
  projectedValue: number;
  projectedDate: string;
}

export async function createBucketFromProjectionAction(input: CreateBucketFromProjectionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  if (!input.name.trim()) return { error: "A bucket name is required" };
  if (input.targetAmount <= 0) return { error: "Target amount must be greater than 0" };

  const { error } = await supabase.from("savings_buckets").insert({
    account_id: accountId,
    user_id: user.id,
    name: input.name.trim(),
    target_amount: input.targetAmount,
    current_amount: input.currentAmount,
    target_date: input.targetDate,
    contribution_amount: input.contributionAmount || null,
    contribution_frequency: input.contributionAmount ? input.contributionFrequency : null,
    projection_type: input.projectionType,
    projection_input: input.projectionInput,
    projected_value: input.projectedValue,
    projected_date: input.projectedDate,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/savings-plan");
  return { success: true };
}

export interface SaveBucketProjectionInput {
  bucketId: string;
  projectionType: BucketProjectionType;
  projectionInput: Record<string, unknown>;
  projectedValue: number;
  projectedDate: string;
}

export async function saveBucketProjectionAction(input: SaveBucketProjectionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("savings_buckets")
    .update({
      projection_type: input.projectionType,
      projection_input: input.projectionInput,
      projected_value: input.projectedValue,
      projected_date: input.projectedDate,
    })
    .eq("id", input.bucketId)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/savings-plan");
  return { success: true };
}
