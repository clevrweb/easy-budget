"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { saveSubscriptionAction, deleteSubscriptionAction } from "@/app/(dashboard)/settings/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

interface NotificationSettingsProps {
  initialEnabled: boolean;
}

export function NotificationSettings({ initialEnabled }: NotificationSettingsProps) {
  const [enabled, setEnabled]         = useState(initialEnabled);
  const [permission, setPermission]   = useState<NotificationPermission>("default");
  const [isPending, startTransition]  = useTransition();
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  async function handleEnable() {
    setError(null);

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Push notifications are not supported in this browser.");
      return;
    }

    let perm = permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }

    if (perm !== "granted") {
      setError("Notification permission denied. Please enable it in your browser settings.");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      startTransition(async () => {
        const result = await saveSubscriptionAction(sub.toJSON());
        if (result?.error) setError(result.error);
        else setEnabled(true);
      });
    } catch {
      setError("Failed to subscribe to notifications. Please try again.");
    }
  }

  function handleDisable() {
    startTransition(async () => {
      await deleteSubscriptionAction();
      setEnabled(false);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: enabled ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-muted)" }}
          >
            {enabled
              ? <Bell className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              : <BellOff className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">Bills due today</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Get notified each morning when bills are due
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={enabled ? handleDisable : handleEnable}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
            enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted-foreground)]/30"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {permission === "denied" && (
        <p className="text-xs text-[var(--color-danger)] bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
          Notifications are blocked. Open your browser/phone settings and allow notifications for this site.
        </p>
      )}

      {error && (
        <p className="text-xs text-[var(--color-danger)] bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {enabled && !error && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          You will receive a notification at 9 AM on days when you have bills due.
        </p>
      )}
    </div>
  );
}
