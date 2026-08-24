import { BirdClient } from "@messagebird/sdk";
import { getAppConfig } from "@/lib/config/app-config";

export interface BirdConfig {
  apiKey?: string;
  from?: string;
}

export async function getBirdConfig() {
  return getAppConfig<BirdConfig>("bird");
}

export async function sendSms(to: string, text: string): Promise<{ success: boolean; error?: string }> {
  const config = await getBirdConfig();
  const apiKey = config?.apiKey || process.env.BIRD_API_KEY;
  const from = config?.from || process.env.BIRD_FROM;

  if (!apiKey || !from) {
    return { success: false, error: "Bird SMS is not configured yet." };
  }

  try {
    const bird = new BirdClient({ apiKey });
    await bird.sms.send({ to, from, text, category: "transactional" });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to reach Bird API" };
  }
}
