"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
