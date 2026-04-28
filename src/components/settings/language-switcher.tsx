"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLanguageAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";

interface LanguageSwitcherProps {
  label: string;
  updatedLabel: string;
}

export function LanguageSwitcher({ label, updatedLabel }: LanguageSwitcherProps) {
  const dict = useDict();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(lang: string) {
    setSaved(false);
    startTransition(async () => {
      await updateLanguageAction(lang);
      setSaved(true);
      router.refresh();
    });
  }

  const current = dict.locale.startsWith("es") ? "es" : "en";

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <div className="flex gap-2">
        {(["en", "es"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            disabled={isPending}
            onClick={() => handleChange(lang)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
              current === lang
                ? "text-white"
                : "border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
            style={current === lang ? { backgroundColor: "var(--color-primary)" } : undefined}
          >
            {lang === "en" ? dict.auth.english : dict.auth.spanish}
          </button>
        ))}
      </div>
      {saved && (
        <p className="text-xs text-[var(--color-primary)]">{updatedLabel}</p>
      )}
    </div>
  );
}
