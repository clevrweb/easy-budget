"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("groups").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    color: (formData.get("color") as string) || "#4f46e5",
  });

  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { success: true };
}

export async function updateGroupAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("groups")
    .update({
      name: formData.get("name") as string,
      color: formData.get("color") as string,
    })
    .eq("id", formData.get("id") as string)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { success: true };
}

export async function deleteGroupAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { success: true };
}
