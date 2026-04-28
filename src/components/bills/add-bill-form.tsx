"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecurringSection } from "./recurring-section";
import type { EndsType } from "./recurring-section";
import { BillerPresets, fetchBillerLogo } from "./biller-presets";
import { createBillAction, createRecurringBillAction } from "@/app/(dashboard)/bills/actions";
import { CategorySelectWithAdd } from "@/components/categories/category-select-with-add";
import type { Category, Group } from "@/types/database";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

interface AddBillFormProps {
  categories: Category[];
  groups: Group[];
}

export function AddBillForm({ categories, groups }: AddBillFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [billName, setBillName]   = useState("");
  const [logoUrl, setLogoUrl]     = useState<string | null>(null);
  const logoSetByPreset           = useRef(false);

  function handlePresetSelect(name: string, url: string | null) {
    logoSetByPreset.current = true;
    setBillName(name);
    setLogoUrl(url);
  }

  useEffect(() => {
    if (billName.length < 3 || logoSetByPreset.current) return;
    const timer = setTimeout(async () => {
      const url = await fetchBillerLogo(billName);
      setLogoUrl(url);
    }, 600);
    return () => clearTimeout(timer);
  }, [billName]);

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency]     = useState("monthly");
  const [dueDay, setDueDay]           = useState(today.getDate());
  const [dueDate, setDueDate]         = useState(todayStr);
  const [endsType, setEndsType]       = useState<EndsType>("never");
  const [endDate, setEndDate]         = useState("");
  const [endCount, setEndCount]       = useState(12);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isRecurring
        ? await createRecurringBillAction(formData)
        : await createBillAction(formData);
      if (result?.error) setError(result.error);
      else router.push("/dashboard");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Bill Name</Label>
        <BillerPresets selectedName={billName} onSelect={handlePresetSelect} />
        {logoUrl && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--color-muted)] w-fit">
            <img src={logoUrl} className="w-4 h-4 object-contain" alt="" />
            <span className="text-xs text-[var(--color-muted-foreground)]">Logo found</span>
            <button type="button" onClick={() => { setLogoUrl(null); logoSetByPreset.current = false; }}>
              <X className="w-3 h-3 text-[var(--color-muted-foreground)]" />
            </button>
          </div>
        )}
        <input type="hidden" name="logo_url" value={logoUrl ?? ""} />
        <Input
          id="name" name="name" placeholder="e.g., Electricity" required autoFocus
          value={billName}
          onChange={(e) => { logoSetByPreset.current = false; setBillName(e.target.value); setLogoUrl(null); }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date" name="due_date" type="date"
            defaultValue={todayStr}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (e.target.value) setDueDay(new Date(e.target.value + "T00:00:00").getDate());
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="group_id">Group</Label>
          <select id="group_id" name="group_id" defaultValue="" className={selectCls}>
            <option value="">No group</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue="pending" className={selectCls}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Input id="payment_method" name="payment_method" placeholder="e.g., Bofa Checking" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <CategorySelectWithAdd
            id="category_id"
            name="category_id"
            categories={categories}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional notes..." />
      </div>

      <RecurringSection
        enabled={isRecurring}     onToggle={setIsRecurring}
        frequency={frequency}     onFrequency={setFrequency}
        dueDay={dueDay}           onDueDay={setDueDay}
        dueDate={dueDate}
        endsType={endsType}       onEndsType={setEndsType}
        endDate={endDate}         onEndDate={setEndDate}
        endCount={endCount}       onEndCount={setEndCount}
      />

      <div className="flex flex-col gap-2 pt-1">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving..." : isRecurring ? "Add Recurring Bill" : "Add Bill"}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/dashboard")} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
