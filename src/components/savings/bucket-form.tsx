"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createBucketAction, updateBucketAction, createSavingsPlanBillsAction } from "@/app/(dashboard)/savings-plan/actions";
import { BucketCompoundFields, type BucketCalcResult } from "./bucket-compound-fields";
import { BucketStockFields } from "./bucket-stock-fields";
import { useDict } from "@/components/language-provider";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { SavingsBucket, BucketContributionFrequency, BucketProjectionType } from "@/types/database";
import type { Group } from "@/types/database";
import { Plus } from "lucide-react";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-base md:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

type Method = "basic" | "compound" | "stock";

interface BucketFormProps {
  bucket?: SavingsBucket;
  groups?: Group[];
  trigger?: React.ReactNode;
  onSaved?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BucketForm({ bucket, groups = [], trigger, onSaved, open: externalOpen, onOpenChange }: BucketFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const isControlled = externalOpen !== undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!bucket;
  const dict = useDict();
  const t = dict.savingsPlan;
  const freqOptions = dict.calculator.contributionFrequencyOptions;

  const [name, setName] = useState(bucket?.name ?? "");
  const [method, setMethod] = useState<Method>("basic");

  const [targetAmount, setTargetAmount] = useState(String(bucket?.target_amount ?? ""));
  const [currentAmount, setCurrentAmount] = useState(String(bucket?.current_amount ?? 0));
  const [targetDate, setTargetDate] = useState(bucket?.target_date ?? "");
  const [contributionAmount, setContributionAmount] = useState(String(bucket?.contribution_amount ?? ""));
  const [contributionFrequency, setContributionFrequency] = useState<BucketContributionFrequency | "">(bucket?.contribution_frequency ?? "");

  const [projectionType, setProjectionType] = useState<BucketProjectionType | null>(null);
  const [projectionInput, setProjectionInput] = useState<Record<string, unknown> | null>(null);
  const [projectedValue, setProjectedValue] = useState<number | null>(null);
  const [projectedDate, setProjectedDate] = useState<string | null>(null);

  const [addBills, setAddBills] = useState(false);
  const [billsStartDate, setBillsStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [billsGroupId, setBillsGroupId] = useState("");

  function resetAndClose(o: boolean) {
    if (isControlled) onOpenChange?.(o);
    else setInternalOpen(o);
    if (!o) {
      setError(null);
      setMethod("basic");
      setProjectionType(null);
      setProjectionInput(null);
      setProjectedValue(null);
      setProjectedDate(null);
      setAddBills(false);
    }
  }

  function handleCalcResult(method: "compound" | "stock", result: BucketCalcResult) {
    setTargetAmount(String(result.targetAmount));
    setCurrentAmount(String(result.currentAmount));
    setTargetDate(result.targetDate);
    setContributionAmount(String(result.contributionAmount));
    setContributionFrequency(result.contributionFrequency as BucketContributionFrequency);
    setProjectionType(method);
    setProjectionInput(result.projectionInput);
    setProjectedValue(result.projectedValue);
    setProjectedDate(result.projectedDate);
  }

  const hasContribution = (parseFloat(contributionAmount) || 0) > 0;
  const canSubmit = method === "basic" || projectedValue !== null;

  async function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      if (isEdit) fd.set("id", bucket.id);
      fd.set("name", name);
      fd.set("target_amount", targetAmount);
      fd.set("current_amount", currentAmount);
      fd.set("target_date", targetDate);
      fd.set("contribution_amount", contributionAmount);
      fd.set("contribution_frequency", contributionFrequency);
      if (projectionType) fd.set("projection_type", projectionType);
      if (projectionInput) fd.set("projection_input", JSON.stringify(projectionInput));
      if (projectedValue !== null) fd.set("projected_value", String(projectedValue));
      if (projectedDate) fd.set("projected_date", projectedDate);

      const billsEndDate = projectedDate ?? targetDate;
      const shouldCreateBills = addBills && hasContribution && billsEndDate;

      const [bucketRes, billsRes] = await Promise.all([
        isEdit ? updateBucketAction(fd) : createBucketAction(fd),
        shouldCreateBills
          ? createSavingsPlanBillsAction({
              name,
              amount: parseFloat(contributionAmount) || 0,
              frequency: contributionFrequency as BucketContributionFrequency,
              startDate: billsStartDate,
              endDate: billsEndDate,
              groupId: billsGroupId || null,
            })
          : Promise.resolve(null),
      ]);

      if (bucketRes?.error) { setError(bucketRes.error); return; }
      if (billsRes?.error) { setError(billsRes.error); return; }

      onSaved?.();
      resetAndClose(false);
    });
  }

  const methods: { value: Method; label: string }[] = [
    { value: "basic", label: t.methodBasic },
    { value: "compound", label: t.methodCompound },
    { value: "stock", label: t.methodStock },
  ];

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? <Button><Plus className="w-4 h-4" />{t.addBucket}</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editBucket : t.addBucket}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bucket-name">{t.nameLabel}</Label>
            <Input id="bucket-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} required />
          </div>

          <div className="inline-flex rounded-lg border border-[var(--color-border)] p-1 bg-[var(--color-muted)] w-full">
            {methods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                  method === m.value
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === "basic" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bucket-target">{t.targetAmountLabel}</Label>
                  <Input id="bucket-target" type="number" step="0.01" min="0" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bucket-current">{t.currentAmountLabel}</Label>
                  <Input id="bucket-current" type="number" step="0.01" min="0" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bucket-target-date">{t.targetDateLabel}</Label>
                <Input id="bucket-target-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bucket-contribution">{t.contributionAmountLabel}</Label>
                  <Input id="bucket-contribution" type="number" step="0.01" min="0" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bucket-frequency">{t.contributionFrequencyLabel}</Label>
                  <select
                    id="bucket-frequency"
                    value={contributionFrequency}
                    onChange={(e) => setContributionFrequency(e.target.value as BucketContributionFrequency)}
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
            </>
          )}

          {method === "compound" && (
            <BucketCompoundFields
              initialPrincipal={bucket?.current_amount}
              initialContribution={bucket?.contribution_amount ?? undefined}
              onResult={(r) => handleCalcResult("compound", r)}
            />
          )}

          {method === "stock" && (
            <BucketStockFields
              initialInvestment={bucket?.current_amount}
              initialContribution={bucket?.contribution_amount ?? undefined}
              onResult={(r) => handleCalcResult("stock", r)}
            />
          )}

          {method !== "basic" && projectedValue !== null && projectedDate && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {t.projectedSummary.replace("{amount}", formatCurrency(projectedValue)).replace("{date}", formatDate(projectedDate))}
            </p>
          )}

          {hasContribution && (
            <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addBills}
                  onChange={(e) => setAddBills(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-foreground)]">{t.addAsBillsLabel}</span>
              </label>

              {addBills && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bucket-bills-start">{dict.calculator.planStartDateLabel}</Label>
                    <Input id="bucket-bills-start" type="date" value={billsStartDate} onChange={(e) => setBillsStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bucket-bills-group">{dict.calculator.planGroupLabel}</Label>
                    <select
                      id="bucket-bills-group"
                      value={billsGroupId}
                      onChange={(e) => setBillsGroupId(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">{dict.bills.noGroup}</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  {method === "basic" && !targetDate && (
                    <p className="col-span-2 text-xs text-[var(--color-warning)]">{t.billsNeedTargetDate}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isPending || !canSubmit || !name.trim() || (addBills && method === "basic" && !targetDate)}
            >
              {isPending ? dict.common.saving : isEdit ? t.saveChanges : t.addBucket}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{dict.common.cancel}</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
