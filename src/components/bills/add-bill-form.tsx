"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBillAction } from "@/app/(dashboard)/bills/actions";
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
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createBillAction(formData);
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

      {/* Bill Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Bill Name</Label>
        <Input id="name" name="name" placeholder="e.g., Electricity" required autoFocus />
      </div>

      {/* Amount + Due Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due Date</Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={today} required />
        </div>
      </div>

      {/* Group + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="group_id">Group</Label>
          <select id="group_id" name="group_id" defaultValue="" className={selectCls}>
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
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

      {/* Payment Method + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Input id="payment_method" name="payment_method" placeholder="e.g., Bofa Checking" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <select id="category_id" name="category_id" defaultValue="" className={selectCls}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional notes..." />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Saving..." : "Add Bill"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
