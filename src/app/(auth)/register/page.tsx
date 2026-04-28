import { registerAction } from "@/lib/supabase/actions";
import { getServerDict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const dict = await getServerDict();
  const t = dict.auth;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M16 6L10 12H13V21H10L16 27L22 21H19V12H22L16 6Z" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[var(--color-foreground)]">
              Easy Budget
            </span>
          </div>
          <p className="text-[var(--color-muted-foreground)] text-sm">
            {dict.appTagline}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border)] p-8">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">
            {t.registerTitle}
          </h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-[var(--color-success)]">
              {message}
            </div>
          )}

          <form action={registerAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">{t.fullName}</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder={t.fullNamePlaceholder}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
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
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            {/* Language selector */}
            <div className="space-y-1.5">
              <Label>{t.preferredLanguage}</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "en", label: t.english },
                  { value: "es", label: t.spanish },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center justify-center gap-2 h-10 rounded-lg border border-[var(--color-input)] cursor-pointer has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] transition-colors"
                  >
                    <input
                      type="radio"
                      name="language"
                      value={value}
                      defaultChecked={value === "en"}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-2">
              {t.createAccount}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-muted-foreground)] mt-6">
            {t.alreadyHaveAccount}{" "}
            <Link
              href="/login"
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              {t.signInLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
