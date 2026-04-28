"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { X } from "lucide-react";
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
import { BillerPresets, fetchBillerLogo } from "./biller-presets";
import { updateRecurringSeriesAction, getRecurringTemplateAction } from "@/app/(dashboard)/bills/actions";
import type { Bill, Category, Group } from "@/types/database";
import type { EndsType } from "./recurring-section";

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

function previewText(frequency: string, dueDay: number, dueDate: string) {
  if (frequency === "monthly") return `Every month on the ${ordinal(dueDay)}`;
  if (frequency === "weekly") {
    const day = dueDate ? new Date(dueDate + "T00:00:00").toLocaleString("en-US", { weekday: "long" }) : "selected day";
    return `Every week on ${day}`;
  }
  if (frequency === "yearly") {
    const label = dueDate ? new Date(dueDate + "T00:00:00").toLocaleString("en-US", { month: "long", day: "numeric" }) : "the same date";
    return `Every year on ${label}`;
  }
  return "";
}

export function RecurringSeriesForm({ bill, categories, groups, open, onOpenChange }: RecurringSeriesFormProps) {
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading]   = useState(false);

  const defaultDueDay = new Date(bill.due_date + "T00:00:00").getDate();
  const [billName, setBillName]   = useState(bill.name);
  const [logoUrl, setLogoUrl]     = useState<string | null>(bill.logo_url ?? null);
  const logoSetByPreset           = useRef(false);
  const [frequency, setFrequency] = useState("monthly");
  const [dueDay, setDueDay]       = useState(defaultDueDay);
  const [startDate, setStartDate] = useState(bill.due_date);
  const [endsType, setEndsType]   = useState<EndsType>("never");
  const [endDate, setEndDate]     = useState("");
  const [endCount, setEndCount]   = useState(12);

  // Reset to bill's current values each time the dialog opens
  useEffect(() => {
    if (!open) return;
    logoSetByPreset.current = true;
    setBillName(bill.name);
    setLogoUrl(bill.logo_url ?? null);
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
    getRecurringTemplateAction(bill.recurring_template_id).then((result) => {
      if (result?.template) {
        setFrequency(result.template.frequency);
        setDueDay(result.template.due_day);
      }
      setLoading(false);
    });
  }, [open, bill.recurring_template_id]);

  useEffect(() => {
    if (billName.length < 3 || logoSetByPreset.current) return;
    const timer = setTimeout(async () => {
      const url = await fetchBillerLogo(billName);
      if (url) setLogoUrl(url);
    }, 600);
    return () => clearTimeout(timer);
  }, [billName]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateRecurringSeriesAction(formData);
      if (result?.error) setError(result.error);
      else onOpenChange(false);
    });
  }

  const preview = previewText(frequency, dueDay, bill.due_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Entire Series</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-[var(--color-muted-foreground)] -mt-1">
          Updates the template and regenerates all pending bills.
        </p>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="template_id" value={bill.recurring_template_id!} />

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="rs-name">Bill Name</Label>
            <BillerPresets selectedName={billName} onSelect={(name, url) => { logoSetByPreset.current = true; setBillName(name); setLogoUrl(url); }} />
            <input type="hidden" name="logo_url" value={logoUrl ?? ""} />
            <div className="flex items-center gap-2">
              <Input
                id="rs-name" name="name" placeholder="e.g., Electricity" required
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

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="rs-amount">Amount (USD)</Label>
            <Input id="rs-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" defaultValue={bill.amount} required />
          </div>

          {/* Group + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rs-group">Group</Label>
              <select id="rs-group" name="group_id" defaultValue={bill.group_id ?? ""} className={selectCls}>
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-category">Category</Label>
              <CategorySelectWithAdd
                id="rs-category"
                name="category_id"
                categories={categories}
                defaultValue={bill.category_id ?? ""}
              />
            </div>
          </div>

          {/* Recurrence settings */}
          <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Recurrence
            </p>

            {loading ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Loading…</p>
            ) : (
              <>
                {/* Starting date */}
                <div className="space-y-1.5">
                  <Label htmlFor="rs-start-date">Starting from</Label>
                  <Input
                    id="rs-start-date"
                    name="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Pending bills will be regenerated from this date forward.
                  </p>
                </div>

                {/* Frequency */}
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <select
                    name="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className={selectCls}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Day of month (monthly only) */}
                {frequency === "monthly" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-due-day">Day of month</Label>
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

                {/* Ends */}
                <div className="space-y-2">
                  <Label>Ends</Label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio" name="ends_type" value="never"
                      checked={endsType === "never"} onChange={() => setEndsType("never")}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--color-foreground)]">Never</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio" name="ends_type" value="date"
                      checked={endsType === "date"} onChange={() => setEndsType("date")}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--color-foreground)] shrink-0">On date</span>
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
                    <span className="text-sm text-[var(--color-foreground)] shrink-0">After</span>
                    <input
                      type="number" name="end_count" min={1} value={endCount}
                      onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={endsType !== "count"}
                      className="w-16 h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] text-center disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />
                    <span className="text-sm text-[var(--color-foreground)]">occurrences</span>
                  </label>
                </div>

                {/* Preview */}
                <div
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}
                >
                  {preview}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending || loading}>
              {isPending ? "Saving…" : "Update Series"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
