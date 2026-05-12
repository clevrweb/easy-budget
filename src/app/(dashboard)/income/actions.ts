"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createIncomeSourceAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("income_sources").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    frequency: formData.get("frequency") as string,
    start_date: formData.get("start_date") as string,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/income");
  return { success: true };
}

export async function updateIncomeSourceAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  const { error } = await supabase
    .from("income_sources")
    .update({
      name: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string),
      frequency: formData.get("frequency") as string,
      start_date: formData.get("start_date") as string,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/income");
  return { success: true };
}

export async function deleteIncomeSourceAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("income_sources")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/income");
  return { success: true };
}

export async function toggleIncomeSourceActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("income_sources")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/income");
  return { success: true };
}
