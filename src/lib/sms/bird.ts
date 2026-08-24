import { getAppConfig } from "@/lib/config/app-config";

export interface BirdConfig {
  accessKey?: string;
  workspaceId?: string;
  channelId?: string;
  originator?: string;
}

export async function getBirdConfig() {
  return getAppConfig<BirdConfig>("bird");
}

export async function sendSms(to: string, text: string): Promise<{ success: boolean; error?: string }> {
  const config = await getBirdConfig();
  if (!config?.accessKey || !config.workspaceId || !config.channelId) {
    return { success: false, error: "Bird SMS is not configured yet." };
  }

  try {
    const res = await fetch(
      `https://api.bird.com/workspaces/${config.workspaceId}/channels/${config.channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `AccessKey ${config.accessKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: { contacts: [{ identifierValue: to }] },
          body: { type: "text", text: { text } },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { success: false, error: `Bird API error ${res.status}: ${errText || res.statusText}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to reach Bird API" };
  }
}
