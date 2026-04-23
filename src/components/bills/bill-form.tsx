"use client";

import { useState, useTransition } from "react";
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
import { createBillAction, updateBillAction } from "@/app/(dashboard)/bills/actions";
import type { Bill, Category, Group } from "@/types/database";
import { Plus } from "lucide-react";

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

  const isEdit = !!bill;
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateBillAction(formData) : await createBillAction(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="w-4 h-4" />
            Add Bill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Bill" : "Add Bill"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={bill.id} />}

          {/* Bill Name */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-name">Bill Name</Label>
            <Input id="bf-name" name="name" placeholder="e.g., Electricity" defaultValue={bill?.name} required />
          </div>

          {/* Amount + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-amount">Amount (USD)</Label>
              <Input id="bf-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" defaultValue={bill?.amount} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-due">Due Date</Label>
              <Input id="bf-due" name="due_date" type="date" defaultValue={bill?.due_date ?? today} required />
            </div>
          </div>

          {/* Group + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-group">Group</Label>
              <select id="bf-group" name="group_id" defaultValue={bill?.group_id ?? ""} className={selectCls}>
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-status">Status</Label>
              <select id="bf-status" name="status" defaultValue={bill?.status ?? "pending"} className={selectCls}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Payment Method + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-payment">Payment Method</Label>
              <Input id="bf-payment" name="payment_method" placeholder="e.g., Bofa Checking" defaultValue={bill?.payment_method ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-category">Category</Label>
              <select id="bf-category" name="category_id" defaultValue={bill?.category_id ?? ""} className={selectCls}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-notes">Notes</Label>
            <Textarea id="bf-notes" name="notes" placeholder="Optional notes..." defaultValue={bill?.notes ?? ""} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Bill"}
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
