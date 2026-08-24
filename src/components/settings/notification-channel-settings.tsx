"use client";

import { useState, useTransition } from "react";
import { updateNotificationChannelAction, updatePhoneNumberAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NotificationChannel } from "@/types/database";

interface NotificationChannelSettingsProps {
  initialChannel: NotificationChannel;
  initialPhoneNumber: string;
}

export function NotificationChannelSettings({ initialChannel, initialPhoneNumber }: NotificationChannelSettingsProps) {
  const dict = useDict();
  const t = dict.settings;
  const [channel, setChannel] = useState<NotificationChannel>(initialChannel);
  const [phone, setPhone] = useState(initialPhoneNumber);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const OPTIONS: { value: NotificationChannel; label: string }[] = [
    { value: "push", label: t.channelPush },
    { value: "email", label: t.channelEmail },
    { value: "sms", label: t.channelSms },
  ];

  function handleChannelChange(value: NotificationChannel) {
    setSaved(false);
    setChannel(value);
    startTransition(async () => {
      await updateNotificationChannelAction(value);
      setSaved(true);
    });
  }

  function handlePhoneBlur() {
    setSaved(false);
    startTransition(async () => {
      await updatePhoneNumberAction(phone);
      setSaved(true);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.notificationChannelDesc}</p>
      <div className="flex gap-2">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => handleChannelChange(value)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
              channel === value
                ? "text-white"
                : "border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
            style={channel === value ? { backgroundColor: "var(--color-primary)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {channel === "sms" && (
        <div className="space-y-1.5">
          <Label htmlFor="phone-number">{t.phoneNumberLabel}</Label>
          <Input
            id="phone-number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder={t.phoneNumberPlaceholder}
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.phoneNumberDesc}</p>
        </div>
      )}

      {saved && <p className="text-xs text-[var(--color-primary)]">{t.notificationChannelUpdated}</p>}
    </div>
  );
}
