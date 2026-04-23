"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    color: (formData.get("color") as string) || "#4f46e5",
    icon: (formData.get("icon") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      color: formData.get("color") as string,
      icon: (formData.get("icon") as string) || null,
    })
    .eq("id", formData.get("id") as string)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/categories");
  return { success: true };
}
