"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { CategorySelectWithAdd } from "@/components/categories/category-select-with-add";
import { fetchBillerLogo } from "./biller-presets";
import { updateRecurringSeriesAction, getRecurringTemplateAction } from "@/app/(dashboard)/bills/actions";
import type { Bill, Category, Group } from "@/types/database";
import type { EndsType } from "./recurring-section";
import { useDict } from "@/components/language-provider";

interface RecurringSeriesFormProps {
  bill: Bill;
  categories: Category[];
  groups: Group[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function RecurringSeriesForm({ bill, categories, groups, open, onOpenChange }: RecurringSeriesFormProps) {
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading]   = useState(false);
  const dict = useDict();
  const t = dict.recurring;
  const tb = dict.bills;

  const defaultDueDay = new Date(bill.due_date + "T00:00:00").getDate();
  const [billName, setBillName]   = useState(bill.name);
  const [biller, setBiller]   = useState(bill.biller ?? "");
  const [logoUrl, setLogoUrl]     = useState<string | null>(bill.logo_url ?? null);
  // Skips the next auto-fetch run right after a reset (dialog open, or the
  // template finishing its async load), so restoring known values doesn't
  // overwrite an already-confirmed logo.
  const skipAutoFetch             = useRef(false);
  const [frequency, setFrequency] = useState("monthly");
  const [dueDay, setDueDay]       = useState(defaultDueDay);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isAutopay, setIsAutopay] = useState(bill.is_autopay);
  const [startDate, setStartDate] = useState(bill.due_date);
  const [endsType, setEndsType]   = useState<EndsType>("never");
  const [endDate, setEndDate]     = useState("");
  const [endCount, setEndCount]   = useState(12);

  // Reset to bill's current values each time the dialog opens
  useEffect(() => {
    if (!open) return;
    skipAutoFetch.current = true;
    setBillName(bill.name);
    setBiller(bill.biller ?? "");
    setLogoUrl(bill.logo_url ?? null);
    setIsAutopay(bill.is_autopay);
    setStartDate(bill.due_date);
    setEndsType("never");
    setEndDate("");
    setEndCount(12);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !bill.recurring_template_id) return;
    setLoading(true);
    skipAutoFetch.current = true;
    getRecurringTemplateAction(bill.recurring_template_id).then((result) => {
      if (result?.template) {
        setFrequency(result.template.frequency);
        setDueDay(result.template.due_day);
        setPaymentMethod(result.template.payment_method ?? "");
        setBiller(result.template.biller ?? "");
        setIsAutopay(result.template.is_autopay);
      }
      setLoading(false);
    });
  }, [open, bill.recurring_template_id]);

  useEffect(() => {
    if (skipAutoFetch.current) { skipAutoFetch.current = false; return; }
    const lookupName = biller.trim() || billName;
    if (lookupName.length < 3) { setLogoUrl(null); return; }
    const timer = setTimeout(async () => {
      const url = await fetchBillerLogo(lookupName);
      setLogoUrl(url);
    }, 600);
    return () => clearTimeout(timer);
  }, [billName, biller]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (formData.get("is_autopay") === "on" && !paymentMethod.trim()) {
      setError(tb.autopayRequiresPaymentMethod);
      return;
    }
    startTransition(async () => {
      const result = await updateRecurringSeriesAction(formData);
      if (result?.error) setError(result.error);
      else onOpenChange(false);
    });
  }

  function previewText() {
    if (frequency === "monthly") {
      const dayLabel = t.useOrdinal ? ordinal(dueDay) : String(dueDay);
      return `${t.previewMonthlyPrefix} ${dayLabel}`;
    }
    if (frequency === "weekly") {
      const day = startDate
        ? new Date(startDate + "T00:00:00").toLocaleString(dict.locale, { weekday: "long" })
        : "selected day";
      if (dueDay <= 1) return `${t.previewWeeklyPrefix} ${day}`;
      return `${t.previewWeeklyNWeeksOn.replace("{n}", String(dueDay))} ${day}`;
    }
    if (frequency === "yearly") {
      const label = startDate
        ? new Date(startDate + "T00:00:00").toLocaleString(dict.locale, { month: "long", day: "numeric" })
        : "the same date";
      return `${t.previewYearlyPrefix} ${label}`;
    }
    return "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.editEntireSeries}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-[var(--color-muted-foreground)] -mt-1">
          {t.editSeriesSubtitle}
        </p>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="template_id" value={bill.recurring_template_id!} />

          <div className="space-y-1.5">
            <Label htmlFor="rs-name">{tb.nameLabel}</Label>
            <input type="hidden" name="logo_url" value={logoUrl ?? ""} />
            <Input
              id="rs-name" name="name" placeholder={tb.namePlaceholder} required
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rs-biller">{tb.billerLabel}</Label>
            <Input
              id="rs-biller" name="biller" placeholder={tb.billerPlaceholder}
              value={biller}
              onChange={(e) => setBiller(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rs-amount">{tb.amountLabel}</Label>
            <Input id="rs-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" defaultValue={bill.amount} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rs-payment">
              {tb.paymentMethodLabel}{isAutopay ? " *" : ""}
            </Label>
            <Input
              id="rs-payment" name="payment_method" placeholder="e.g., Bofa Checking"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" id="rs-autopay" name="is_autopay"
              checked={isAutopay}
              onChange={(e) => setIsAutopay(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-foreground)]">{tb.autopayLabel}</span>
          </label>
          {isAutopay && (
            <p className="text-xs text-[var(--color-muted-foreground)] -mt-2">{tb.autopayHint}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rs-group">{tb.groupLabel}</Label>
              <select id="rs-group" name="group_id" defaultValue={bill.group_id ?? ""} className={selectCls}>
                <option value="">{tb.noGroup}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-category">{tb.categoryLabel}</Label>
              <CategorySelectWithAdd
                id="rs-category"
                name="category_id"
                categories={categories}
                defaultValue={bill.category_id ?? ""}
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {t.recurrence}
            </p>

            {loading ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">{t.loading}</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-start-date">{t.startingFrom}</Label>
                  <Input
                    id="rs-start-date"
                    name="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {t.regenerateHint}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>{t.frequency}</Label>
                  <select
                    name="frequency"
                    value={frequency}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFrequency(next);
                      if (next === "weekly") setDueDay(1);
                      else if (next === "monthly") setDueDay(new Date(startDate + "T00:00:00").getDate() || 1);
                    }}
                    className={selectCls}
                  >
                    <option value="monthly">{t.monthly}</option>
                    <option value="weekly">{t.weekly}</option>
                    <option value="yearly">{t.yearly}</option>
                  </select>
                </div>

                {frequency === "monthly" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-due-day">{t.dayOfMonth}</Label>
                    <Input
                      id="rs-due-day"
                      name="due_day"
                      type="number"
                      min={1}
                      max={31}
                      value={dueDay}
                      onChange={(e) => setDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                    />
                  </div>
                )}

                {frequency === "weekly" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-week-interval">{t.weekIntervalLabel}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="rs-week-interval"
                        name="due_day"
                        type="number"
                        min={1}
                        max={52}
                        value={dueDay}
                        onChange={(e) => setDueDay(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                        className="w-24"
                      />
                      <span className="text-sm text-[var(--color-muted-foreground)]">{t.weekIntervalUnit}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t.ends}</Label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio" name="ends_type" value="never"
                      checked={endsType === "never"} onChange={() => setEndsType("never")}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--color-foreground)]">{t.neverShort}</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio" name="ends_type" value="date"
                      checked={endsType === "date"} onChange={() => setEndsType("date")}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--color-foreground)] shrink-0">{t.onDate}</span>
                    <input
                      type="date" name="end_date" value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={endsType !== "date"}
                      className="h-8 flex-1 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio" name="ends_type" value="count"
                      checked={endsType === "count"} onChange={() => setEndsType("count")}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--color-foreground)] shrink-0">{t.after}</span>
                    <input
                      type="number" name="end_count" min={1} value={endCount}
                      onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={endsType !== "count"}
                      className="w-16 h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] text-center disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />
                    <span className="text-sm text-[var(--color-foreground)]">{t.occurrences}</span>
                  </label>
                </div>

                <div
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}
                >
                  {previewText()}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending || loading}>
              {isPending ? t.loading : t.updateSeries}
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
