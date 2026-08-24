"use client";

import { useState, useTransition } from "react";
import { saveBirdConfigAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

interface BirdConfigFormProps {
  initialAccessKey: string;
  initialWorkspaceId: string;
  initialChannelId: string;
}

export function BirdConfigForm({ initialAccessKey, initialWorkspaceId, initialChannelId }: BirdConfigFormProps) {
  const dict = useDict();
  const t = dict.admin;
  const [accessKey, setAccessKey] = useState(initialAccessKey);
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [channelId, setChannelId] = useState(initialChannelId);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const formData = new FormData();
    formData.set("accessKey", accessKey);
    formData.set("workspaceId", workspaceId);
    formData.set("channelId", channelId);
    startTransition(async () => {
      await saveBirdConfigAction(formData);
      setSaved(true);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.birdSectionDesc}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bird-access-key">{t.birdAccessKeyLabel}</Label>
          <Input
            id="bird-access-key"
            type="password"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bird-workspace-id">{t.birdWorkspaceIdLabel}</Label>
          <Input id="bird-workspace-id" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bird-channel-id">{t.birdChannelIdLabel}</Label>
          <Input id="bird-channel-id" value={channelId} onChange={(e) => setChannelId(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? t.saving : t.saveButton}
          </Button>
          {saved && <p className="text-xs text-[var(--color-primary)]">{t.saved}</p>}
        </div>
      </form>
    </div>
  );
}
