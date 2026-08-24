"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/lib/supabase/actions";
import { useDict } from "@/components/language-provider";

export default function ForgotPasswordPage() {
  const dict = useDict();
  const t = dict.auth;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      await requestPasswordResetAction(formData);
      setSent(true);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M16 6L10 12H13V21H10L16 27L22 21H19V12H22L16 6Z" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[var(--color-foreground)]">Budget Whisperer</span>
          </div>
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border)] p-8">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-1">{t.forgotPasswordTitle}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">{t.forgotPasswordSubtitle}</p>

          {sent ? (
            <div className="px-4 py-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-[var(--color-success)]">
              {t.forgotPasswordSent}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isPending}>
                {isPending ? t.forgotPasswordSending : t.forgotPasswordButton}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-[var(--color-muted-foreground)] mt-6">
            <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
              {dict.account.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
