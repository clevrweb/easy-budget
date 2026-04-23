"use client";

import { useState, useTransition } from "react";
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
import { updateRecurringSeriesAction } from "@/app/(dashboard)/bills/actions";
import type { Bill, Category, Group } from "@/types/database";

interface RecurringSeriesFormProps {
  bill: Bill;
  categories: Category[];
  groups: Group[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

export function RecurringSeriesForm({ bill, categories, groups, open, onOpenChange }: RecurringSeriesFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateRecurringSeriesAction(formData);
      if (result?.error) setError(result.error);
      else onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Entire Series</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-[var(--color-muted-foreground)] -mt-1">
          Updates the template and all pending bills in this recurring series.
        </p>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="template_id" value={bill.recurring_template_id!} />

          <div className="space-y-1.5">
            <Label htmlFor="rs-name">Bill Name</Label>
            <Input id="rs-name" name="name" placeholder="e.g., Electricity" defaultValue={bill.name} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rs-amount">Amount (USD)</Label>
            <Input id="rs-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" defaultValue={bill.amount} required />
          </div>

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

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving..." : "Update Series"}
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
