"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/supabase/admin-guard";
import { getAppConfig, setAppConfig } from "@/lib/config/app-config";
import { sendSms } from "@/lib/sms/bird";

interface ResendConfigShape {
  apiKey?: string;
  fromEmail?: string;
}

interface BirdConfigShape {
  accessKey?: string;
  workspaceId?: string;
  channelId?: string;
}

export async function getAdminConfigAction() {
  await requireSuperadmin();
  const [resend, bird] = await Promise.all([
    getAppConfig<ResendConfigShape>("resend"),
    getAppConfig<BirdConfigShape>("bird"),
  ]);
  return {
    resend: { apiKey: resend?.apiKey ?? "", fromEmail: resend?.fromEmail ?? "" },
    bird: {
      accessKey: bird?.accessKey ?? "",
      workspaceId: bird?.workspaceId ?? "",
      channelId: bird?.channelId ?? "",
    },
  };
}

export async function saveResendConfigAction(formData: FormData) {
  await requireSuperadmin();
  const apiKey = ((formData.get("apiKey") as string) || "").trim();
  const fromEmail = ((formData.get("fromEmail") as string) || "").trim();

  const { error } = await setAppConfig("resend", { apiKey, fromEmail });
  if (error) return { error };

  revalidatePath("/admin");
  return { success: true };
}

export async function saveBirdConfigAction(formData: FormData) {
  await requireSuperadmin();
  const accessKey = ((formData.get("accessKey") as string) || "").trim();
  const workspaceId = ((formData.get("workspaceId") as string) || "").trim();
  const channelId = ((formData.get("channelId") as string) || "").trim();

  const { error } = await setAppConfig("bird", { accessKey, workspaceId, channelId });
  if (error) return { error };

  revalidatePath("/admin");
  return { success: true };
}

export async function sendTestSmsAction(formData: FormData) {
  await requireSuperadmin();
  const phone = ((formData.get("phone") as string) || "").trim();
  if (!phone) return { error: "Enter a phone number." };

  return sendSms(phone, "Test message from Budget Whisperer's admin panel.");
}
