"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBillAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const status = (formData.get("status") as string) || "pending";
  const { error } = await supabase.from("bills").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    due_date: formData.get("due_date") as string,
    status,
    payment_method: (formData.get("payment_method") as string) || null,
    category_id: (formData.get("category_id") as string) || null,
    group_id: (formData.get("group_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
    is_recurring: false,
    paid_at: status === "paid" ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function updateBillAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = formData.get("id") as string;

  const status = (formData.get("status") as string) || "pending";
  const { error } = await supabase
    .from("bills")
    .update({
      name: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string),
      due_date: formData.get("due_date") as string,
      status,
      payment_method: (formData.get("payment_method") as string) || null,
      category_id: (formData.get("category_id") as string) || null,
      group_id: (formData.get("group_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function deleteBillAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function markBillPaidAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bills")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function markBillPendingAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bills")
    .update({ status: "pending", paid_at: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}
