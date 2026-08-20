"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { completeInviteSignupAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

export default function SetPasswordPage() {
  const dict = useDict();
  const t = dict.account;
  const ta = dict.auth;

  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The invite email link uses the implicit hash-token flow, which the
    // browser client processes asynchronously after construction. Rather
    // than racing that with a one-shot getUser() call, listen for the auth
    // state change it triggers (falling back to an existing session, if
    // this effect re-runs after the hash was already consumed).
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setStatus(session?.user ? "ready" : "invalid");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(ta.passwordMismatch);
      return;
    }
    if (password.length < 8) {
      setError(ta.passwordMin);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await completeInviteSignupAction({ full_name: fullName, language });
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
            <span className="text-2xl font-bold text-[var(--color-foreground)]">Easy Budget</span>
          </div>
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border)] p-8">
          {status === "checking" && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t.setPasswordSaving}</p>
          )}

          {status === "invalid" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[var(--color-danger)]">{t.setPasswordInvalidLink}</p>
              <Link href="/login" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                {t.backToLogin}
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-1">{t.setPasswordTitle}</h1>
              <p className="text-sm text-[var(--color-muted-foreground)] mb-6">{t.setPasswordSubtitle}</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">{ta.fullName}</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={ta.fullNamePlaceholder}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{ta.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={ta.passwordMin}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">{ta.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{ta.preferredLanguage}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ value: "en", label: ta.english }, { value: "es", label: ta.spanish }] as const).map(
                      ({ value, label }) => (
                        <label
                          key={value}
                          className="flex items-center justify-center gap-2 h-10 rounded-lg border border-[var(--color-input)] cursor-pointer has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] transition-colors"
                        >
                          <input
                            type="radio"
                            name="language"
                            value={value}
                            checked={language === value}
                            onChange={() => setLanguage(value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2" disabled={saving}>
                  {saving ? t.setPasswordSaving : t.setPasswordButton}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
