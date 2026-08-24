"use client";

import { useState, useTransition } from "react";
import { sendTestSmsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

export function TestSmsForm() {
  const dict = useDict();
  const t = dict.admin;
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData();
    formData.set("phone", phone);
    startTransition(async () => {
      const res = await sendTestSmsAction(formData);
      setResult(res);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.testSmsSectionDesc}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="test-sms-phone">{t.testSmsPhoneLabel}</Label>
          <Input
            id="test-sms-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 555 5555"
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? t.testSmsSending : t.testSmsButton}
          </Button>
          {result?.success && <p className="text-xs text-[var(--color-primary)]">{t.testSmsSuccess}</p>}
        </div>
        {result?.error && (
          <p className="text-xs text-[var(--color-danger)]">{result.error}</p>
        )}
      </form>
    </div>
  );
}
