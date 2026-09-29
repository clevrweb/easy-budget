"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useDict } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dict = useDict();
  const t = dict.errorPage;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <Image src="/logo.png" alt="Budget Whisperer" width={80} height={80} className="w-10 h-10 rounded-xl shadow-lg" />
          <span className="text-2xl font-bold text-[var(--color-foreground)]">Budget Whisperer</span>
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border)] p-8">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">{t.title}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">{t.description}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => reset()}>{t.retryButton}</Button>
            <Button variant="outline" onClick={() => { window.location.href = "/dashboard"; }}>
              {t.homeButton}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
