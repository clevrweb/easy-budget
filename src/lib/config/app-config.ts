import { createAdminClient } from "@/lib/supabase/admin";

export async function getAppConfig<T>(key: string): Promise<T | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("app_config").select("value").eq("key", key).single();
  return (data?.value as T) ?? null;
}

export async function setAppConfig(key: string, value: unknown) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return { error: error?.message ?? null };
}
