"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createBucketAction, updateBucketAction } from "@/app/(dashboard)/savings-plan/actions";
import { useDict } from "@/components/language-provider";
import type { SavingsBucket, BucketContributionFrequency } from "@/types/database";
import { Plus } from "lucide-react";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

interface BucketFormProps {
  bucket?: SavingsBucket;
  trigger?: React.ReactNode;
  onSaved?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BucketForm({ bucket, trigger, onSaved, open: externalOpen, onOpenChange }: BucketFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const isControlled = externalOpen !== undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [frequency, setFrequency] = useState<BucketContributionFrequency | "">(bucket?.contribution_frequency ?? "");
  const isEdit = !!bucket;
  const dict = useDict();
  const t = dict.savingsPlan;
  const freqOptions = dict.calculator.contributionFrequencyOptions;

  function resetAndClose(o: boolean) {
    if (isControlled) onOpenChange?.(o);
    else setInternalOpen(o);
    if (!o) setError(null);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateBucketAction(formData) : await createBucketAction(formData);
      if (result?.error) { setError(result.error); return; }
      onSaved?.();
      resetAndClose(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? <Button><Plus className="w-4 h-4" />{t.addBucket}</Button>}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editBucket : t.addBucket}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={bucket.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="bucket-name">{t.nameLabel}</Label>
            <Input id="bucket-name" name="name" placeholder={t.namePlaceholder} defaultValue={bucket?.name} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bucket-target">{t.targetAmountLabel}</Label>
              <Input id="bucket-target" name="target_amount" type="number" step="0.01" min="0" defaultValue={bucket?.target_amount} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bucket-current">{t.currentAmountLabel}</Label>
              <Input id="bucket-current" name="current_amount" type="number" step="0.01" min="0" defaultValue={bucket?.current_amount ?? 0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bucket-target-date">{t.targetDateLabel}</Label>
            <Input id="bucket-target-date" name="target_date" type="date" defaultValue={bucket?.target_date ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bucket-contribution">{t.contributionAmountLabel}</Label>
              <Input id="bucket-contribution" name="contribution_amount" type="number" step="0.01" min="0" defaultValue={bucket?.contribution_amount ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bucket-frequency">{t.contributionFrequencyLabel}</Label>
              <select
                id="bucket-frequency"
                name="contribution_frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BucketContributionFrequency)}
                className={selectCls}
              >
                <option value="">—</option>
                <option value="weekly">{freqOptions.weekly}</option>
                <option value="biweekly">{freqOptions.biweekly}</option>
                <option value="monthly">{freqOptions.monthly}</option>
                <option value="quarterly">{freqOptions.quarterly}</option>
                <option value="annually">{freqOptions.annually}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? dict.common.saving : isEdit ? t.saveChanges : t.addBucket}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{dict.common.cancel}</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
