"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";
import { generateContributionDates, dateAfterOccurrences } from "@/lib/savings-plan";
import { createSavingsPlanBillsAction } from "@/app/(dashboard)/calculators/stock/actions";
import { formatCurrency } from "@/lib/utils";
import type { ContributionFrequency } from "@/lib/future-projection";
import type { Group } from "@/types/database";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

interface SavingsPlanFormProps {
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  startDate: string;
  endDate: string;
  groups: Group[];
}

interface CreatedResult {
  name: string;
  created: number;
  capped: boolean;
  totalPlanned: number;
  isSeries: boolean;
}

export function SavingsPlanForm({ contributionAmount, contributionFrequency, startDate, endDate, groups }: SavingsPlanFormProps) {
  const dict = useDict();
  const t = dict.calculator;
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [planStartDate, setPlanStartDate] = useState(startDate);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreatedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Original occurrence count, frozen at the calculated plan's own dates —
  // shifting the start date preserves this count rather than silently
  // changing how many contributions the plan represents.
  const originalOccurrenceCount = useMemo(
    () => generateContributionDates(startDate, endDate, contributionFrequency).dates.length,
    [startDate, endDate, contributionFrequency]
  );

  const effectiveEndDate = useMemo(
    () => dateAfterOccurrences(planStartDate, contributionFrequency, originalOccurrenceCount),
    [planStartDate, contributionFrequency, originalOccurrenceCount]
  );

  const preview = generateContributionDates(planStartDate, effectiveEndDate, contributionFrequency);
  const isQuarterly = contributionFrequency === "quarterly";

  function handleCreate() {
    setError(null);
    setResult(null);
    const planName = name.trim();
    startTransition(async () => {
      const res = await createSavingsPlanBillsAction({
        name: planName,
        amount: contributionAmount,
        frequency: contributionFrequency,
        startDate: planStartDate,
        endDate: effectiveEndDate,
        groupId: groupId || null,
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
        isSeries: !!res.isSeries,
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
          .replace("{start}", planStartDate)
          .replace("{end}", effectiveEndDate)}
      </p>

      {isQuarterly && (
        <p className="text-xs text-[var(--color-warning)]">{t.planQuarterlyNote}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="plan-name">{t.planNameLabel}</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.planNamePlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-start-date">{t.planStartDateLabel}</Label>
          <Input
            id="plan-start-date"
            type="date"
            value={planStartDate}
            onChange={(e) => setPlanStartDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-group">{t.planGroupLabel}</Label>
        <select
          id="plan-group"
          className={selectCls}
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        >
          <option value="">{dict.bills.noGroup}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
        {isPending ? t.creatingBills : t.createBillsButton}
      </Button>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

      {result && (
        <div className="text-xs text-[var(--color-success)] space-y-1">
          <p>
            {(result.isSeries ? t.seriesCreatedSuccess : t.billsCreatedSuccess)
              .replace("{n}", String(result.created))
              .replace("{name}", result.name)}
          </p>
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
