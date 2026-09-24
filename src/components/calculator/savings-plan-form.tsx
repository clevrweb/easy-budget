"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";
import { generateContributionDates } from "@/lib/savings-plan";
import { createSavingsPlanBillsAction } from "@/app/(dashboard)/calculator/actions";
import { formatCurrency } from "@/lib/utils";
import type { ContributionFrequency } from "@/lib/future-projection";

interface SavingsPlanFormProps {
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  startDate: string;
  endDate: string;
}

interface CreatedResult {
  name: string;
  created: number;
  capped: boolean;
  totalPlanned: number;
}

export function SavingsPlanForm({ contributionAmount, contributionFrequency, startDate, endDate }: SavingsPlanFormProps) {
  const dict = useDict();
  const t = dict.calculator;
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreatedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = generateContributionDates(startDate, endDate, contributionFrequency);

  function handleCreate() {
    setError(null);
    setResult(null);
    const planName = name.trim();
    startTransition(async () => {
      const res = await createSavingsPlanBillsAction({
        name: planName,
        amount: contributionAmount,
        frequency: contributionFrequency,
        startDate,
        endDate,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult({
        name: planName,
        created: res.created ?? 0,
        capped: !!res.capped,
        totalPlanned: res.totalPlanned ?? res.created ?? 0,
      });
      setName("");
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-[var(--color-foreground)]">{t.savingsPlanTitle}</h2>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{t.savingsPlanDesc}</p>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        {t.planPreview
          .replace("{count}", String(preview.totalPlanned))
          .replace("{amount}", formatCurrency(contributionAmount))
          .replace("{frequency}", t.contributionFrequencyOptions[contributionFrequency])
          .replace("{start}", startDate)
          .replace("{end}", endDate)}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="plan-name">{t.planNameLabel}</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.planNamePlaceholder}
          />
        </div>
        <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
          {isPending ? t.creatingBills : t.createBillsButton}
        </Button>
      </div>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

      {result && (
        <div className="text-xs text-[var(--color-success)] space-y-1">
          <p>{t.billsCreatedSuccess.replace("{n}", String(result.created)).replace("{name}", result.name)}</p>
          {result.capped && (
            <p className="text-[var(--color-warning)]">
              {t.billsCappedWarning
                .replace("{created}", String(result.created))
                .replace("{total}", String(result.totalPlanned))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
