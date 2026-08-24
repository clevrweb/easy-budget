"use client";

import { useState, useTransition } from "react";
import { saveBirdConfigAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

interface BirdConfigFormProps {
  initialApiKey: string;
  initialFrom: string;
}

export function BirdConfigForm({ initialApiKey, initialFrom }: BirdConfigFormProps) {
  const dict = useDict();
  const t = dict.admin;
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [from, setFrom] = useState(initialFrom);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const formData = new FormData();
    formData.set("apiKey", apiKey);
    formData.set("from", from);
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
          <Label htmlFor="bird-api-key">{t.birdApiKeyLabel}</Label>
          <Input
            id="bird-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="bk_xxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bird-from">{t.birdFromLabel}</Label>
          <Input
            id="bird-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder={t.birdFromPlaceholder}
          />
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
