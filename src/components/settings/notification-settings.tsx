"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
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
  const [enabled, setEnabled]        = useState(initialEnabled);
  const [permission, setPermission]  = useState<NotificationPermission>("default");
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy]              = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [status, setStatus]          = useState<string | null>(null);

  const isLoading = busy || isPending;

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  async function handleEnable() {
    setError(null);
    setStatus(null);

    if (!window.isSecureContext) {
      setError("Notifications require a secure connection (HTTPS).");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Push notifications are not supported in this browser.");
      return;
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setError("Notification configuration is missing. Please contact support.");
      return;
    }

    setBusy(true);
    try {
      let perm = Notification.permission;
      if (perm !== "granted") {
        setStatus("Waiting for permission…");
        perm = await Notification.requestPermission();
        setPermission(perm);
      }

      if (perm !== "granted") {
        setError("Notification permission was denied. Enable it in your device settings and try again.");
        return;
      }

      setStatus("Setting up notifications…");
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      setBusy(false);
      startTransition(async () => {
        const result = await saveSubscriptionAction(sub.toJSON() as object);
        if (result?.error) {
          setError(`Could not save subscription: ${result.error}`);
        } else {
          setEnabled(true);
          setStatus(null);
        }
      });
    } catch (err) {
      setError(`Subscription failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
      if (!enabled) setStatus(null);
    }
  }

  function handleDisable() {
    setError(null);
    startTransition(async () => {
      await deleteSubscriptionAction();
      setEnabled(false);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: enabled ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-muted)" }}
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin text-[var(--color-muted-foreground)]" />
              : enabled
              ? <Bell className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              : <BellOff className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">Bills due today</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {status ?? "Get notified each morning when bills are due"}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={enabled ? handleDisable : handleEnable}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 ${
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

      {permission === "denied" && !error && (
        <p className="text-xs text-[var(--color-danger)] bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
          Notifications are blocked. Go to your device settings → app/browser permissions and allow notifications for this site.
        </p>
      )}

      {error && (
        <p className="text-xs text-[var(--color-danger)] bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {enabled && !error && !isLoading && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          You will receive a notification at 9 AM on days when you have bills due.
        </p>
      )}
    </div>
  );
}
