"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { RecurringSection } from "./recurring-section";
import type { EndsType } from "./recurring-section";
import { BillerPresets, fetchBillerLogo } from "./biller-presets";
import { createBillAction, createRecurringBillAction, updateBillAction } from "@/app/(dashboard)/bills/actions";
import type { Bill, Category, Group } from "@/types/database";
import { Plus, X } from "lucide-react";
import { CategorySelectWithAdd } from "@/components/categories/category-select-with-add";
import { useDict } from "@/components/language-provider";

interface BillFormProps {
  bill?: Bill;
  categories: Category[];
  groups: Group[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

export function BillForm({ bill, categories, groups, trigger, open: externalOpen, onOpenChange }: BillFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open    = externalOpen  !== undefined ? externalOpen  : internalOpen;
  const setOpen = onOpenChange  !== undefined ? onOpenChange  : setInternalOpen;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dict = useDict();
  const t = dict.bills;

  const isEdit      = !!bill;
  const isControlled = externalOpen !== undefined;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const [billName, setBillName]   = useState(bill?.name ?? "");
  const [logoUrl, setLogoUrl]     = useState<string | null>(bill?.logo_url ?? null);
  const logoSetByPreset           = useRef(false);
  const [dueDate, setDueDate]     = useState(bill?.due_date ?? todayStr);
  const [dueDay, setDueDay]       = useState(now.getDate());

  function handlePresetSelect(name: string, url: string | null) {
    logoSetByPreset.current = true;
    setBillName(name);
    setLogoUrl(url);
  }

  // Reset all controlled state when dialog opens so edits always show fresh bill data
  useEffect(() => {
    if (!open) return;
    logoSetByPreset.current = true;
    setBillName(bill?.name ?? "");
    setLogoUrl(bill?.logo_url ?? null);
    setDueDate(bill?.due_date ?? todayStr);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (billName.length < 3 || logoSetByPreset.current) return;
    const timer = setTimeout(async () => {
      const url = await fetchBillerLogo(billName);
      if (url) setLogoUrl(url);
    }, 600);
    return () => clearTimeout(timer);
  }, [billName]);

  // Recurring state (only for create)
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency]     = useState("monthly");
  const [endsType, setEndsType]       = useState<EndsType>("never");
  const [endDate, setEndDate]         = useState("");
  const [endCount, setEndCount]       = useState(12);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      let result;
      if (isEdit)           result = await updateBillAction(formData);
      else if (isRecurring) result = await createRecurringBillAction(formData);
      else                  result = await createBillAction(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="w-4 h-4" />
              {t.addBill}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editBill : t.addBill}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={bill.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="bf-name">{t.nameLabel}</Label>
            <BillerPresets selectedName={billName} onSelect={handlePresetSelect} />
            <input type="hidden" name="logo_url" value={logoUrl ?? ""} />
            <div className="flex items-center gap-2">
              <Input
                id="bf-name" name="name" placeholder={t.namePlaceholder} required
                value={billName}
                onChange={(e) => { logoSetByPreset.current = false; setBillName(e.target.value); }}
                className="flex-1"
              />
              {logoUrl && (
                <div className="relative shrink-0">
                  <img src={logoUrl} alt="" className="w-10 h-10 object-contain rounded-xl border border-[var(--color-border)]" />
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(null); logoSetByPreset.current = false; }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-muted-foreground)] flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-amount">{t.amountLabel}</Label>
              <Input id="bf-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" defaultValue={bill?.amount} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-due">{t.dueDateLabel}</Label>
              <Input
                id="bf-due" name="due_date" type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (e.target.value) setDueDay(new Date(e.target.value + "T00:00:00").getDate());
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-group">{t.groupLabel}</Label>
              <select id="bf-group" name="group_id" defaultValue={bill?.group_id ?? ""} className={selectCls}>
                <option value="">{t.noGroup}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-status">{t.statusLabel}</Label>
              <select id="bf-status" name="status" defaultValue={bill?.status ?? "pending"} className={selectCls}>
                <option value="pending">{t.pending}</option>
                <option value="paid">{t.paid}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-payment">{t.paymentMethodLabel}</Label>
              <Input id="bf-payment" name="payment_method" placeholder="e.g., Bofa Checking" defaultValue={bill?.payment_method ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-category">{t.categoryLabel}</Label>
              <CategorySelectWithAdd
                id="bf-category"
                name="category_id"
                categories={categories}
                defaultValue={bill?.category_id ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bf-notes">{t.notesLabel}</Label>
            <Textarea id="bf-notes" name="notes" placeholder={t.notesPlaceholder} defaultValue={bill?.notes ?? ""} />
          </div>

          {!isEdit && (
            <RecurringSection
              enabled={isRecurring}     onToggle={setIsRecurring}
              frequency={frequency}     onFrequency={setFrequency}
              dueDay={dueDay}           onDueDay={setDueDay}
              dueDate={dueDate}
              endsType={endsType}       onEndsType={setEndsType}
              endDate={endDate}         onEndDate={setEndDate}
              endCount={endCount}       onEndCount={setEndCount}
            />
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? t.saving : isEdit ? t.saveChanges : isRecurring ? t.addRecurringBill : t.addBill}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t.cancel}</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
