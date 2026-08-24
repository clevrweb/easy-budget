"use client";

import { useState, useTransition } from "react";
import { saveResendConfigAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

interface ResendConfigFormProps {
  initialApiKey: string;
  initialFromEmail: string;
}

export function ResendConfigForm({ initialApiKey, initialFromEmail }: ResendConfigFormProps) {
  const dict = useDict();
  const t = dict.admin;
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [fromEmail, setFromEmail] = useState(initialFromEmail);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const formData = new FormData();
    formData.set("apiKey", apiKey);
    formData.set("fromEmail", fromEmail);
    startTransition(async () => {
      await saveResendConfigAction(formData);
      setSaved(true);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.resendSectionDesc}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="resend-api-key">{t.resendApiKeyLabel}</Label>
          <Input
            id="resend-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="re_xxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resend-from-email">{t.resendFromEmailLabel}</Label>
          <Input
            id="resend-from-email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder={t.resendFromEmailPlaceholder}
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
