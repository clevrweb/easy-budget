import { Resend } from "resend";
import { getAppConfig } from "@/lib/config/app-config";

interface ResendConfig {
  apiKey?: string;
  fromEmail?: string;
}

const DEFAULT_FROM = "Budget Whisperer <noreply@budgetwhisperer.com>";

export async function getResendClient() {
  const config = await getAppConfig<ResendConfig>("resend");
  const apiKey = config?.apiKey || process.env.RESEND_API_KEY;
  return new Resend(apiKey);
}

export async function getEmailFrom() {
  const config = await getAppConfig<ResendConfig>("resend");
  return config?.fromEmail || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
}
