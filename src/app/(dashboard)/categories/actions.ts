"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data, error } = await supabase.from("categories").insert({
    account_id: accountId,
    user_id: user.id,
    name: formData.get("name") as string,
    color: (formData.get("color") as string) || "#4f46e5",
    icon: (formData.get("icon") as string) || null,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath("/categories");
  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return { success: true, category: data };
}

export async function updateCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      color: formData.get("color") as string,
      icon: (formData.get("icon") as string) || null,
    })
    .eq("id", formData.get("id") as string)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/categories");
  return { success: true };
}

const DEFAULT_CATEGORIES = [
  { name: "Housing",        color: "#0891b2" },
  { name: "Utilities",      color: "#f59e0b" },
  { name: "Groceries",      color: "#16a34a" },
  { name: "Transportation", color: "#6366f1" },
  { name: "Insurance",      color: "#0284c7" },
  { name: "Healthcare",     color: "#ef4444" },
  { name: "Entertainment",  color: "#ec4899" },
  { name: "Phone",          color: "#6b7280" },
  { name: "Subscriptions",  color: "#8b5cf6" },
  { name: "Dining Out",     color: "#f97316" },
  { name: "Education",      color: "#eab308" },
  { name: "Personal Care",  color: "#14b8a6" },
];

export async function seedDefaultCategoriesAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return;

  const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, account_id: accountId, user_id: user.id, icon: null }));
  await supabase.from("categories").insert(rows);

  revalidatePath("/categories");
  revalidatePath("/bills");
  revalidatePath("/dashboard");
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/categories");
  return { success: true };
}
