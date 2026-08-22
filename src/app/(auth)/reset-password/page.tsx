"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

export default function ResetPasswordPage() {
  const dict = useDict();
  const t = dict.auth;
  const router = useRouter();

  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The recovery link's tokens arrive as a URL hash fragment (implicit
    // grant), but @supabase/ssr's browser client hardcodes flowType:
    // "pkce" with no way to override it -- so the SDK's own automatic
    // detectSessionInUrl handling throws AuthPKCEGrantCodeExchangeError on
    // this exact URL shape (caught internally, silently leaving no
    // session). Bypass that entirely: parse the hash ourselves and call
    // setSession() directly, which has no flow-type gate.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setStatus("invalid");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ data, error }) => {
      window.history.replaceState(null, "", window.location.pathname);
      setStatus(!error && data.session?.user ? "ready" : "invalid");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    if (password.length < 8) {
      setError(t.passwordMin);
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

    router.push("/dashboard");
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
            <p className="text-sm text-[var(--color-muted-foreground)]">{dict.common.saving}</p>
          )}

          {status === "invalid" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[var(--color-danger)]">{t.resetPasswordInvalidLink}</p>
              <Link href="/forgot-password" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                {t.forgotPasswordLink}
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-1">{t.resetPasswordTitle}</h1>
              <p className="text-sm text-[var(--color-muted-foreground)] mb-6">{t.resetPasswordSubtitle}</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordMin}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
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
                <Button type="submit" className="w-full mt-2" disabled={saving}>
                  {saving ? dict.common.saving : t.resetPasswordButton}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
