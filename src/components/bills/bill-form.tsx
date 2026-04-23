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
import { RecurringSection } from "./recurring-section";
import type { EndsType } from "./recurring-section";
import { createBillAction, createRecurringBillAction, updateBillAction } from "@/app/(dashboard)/bills/actions";
import type { Bill, Category, Group } from "@/types/database";
import { Plus } from "lucide-react";
import { CategorySelectWithAdd } from "@/components/categories/category-select-with-add";

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

  const isEdit      = !!bill;
  const isControlled = externalOpen !== undefined;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Recurring state (only for create)
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency]     = useState("monthly");
  const [dueDay, setDueDay]           = useState(now.getDate());
  const [dueDate, setDueDate]         = useState(bill?.due_date ?? todayStr);
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
              Add Bill
            </Button>
          )}
        </DialogTrigger>
      )}
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
              <Input
                id="bf-due" name="due_date" type="date"
                defaultValue={bill?.due_date ?? todayStr}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (e.target.value) setDueDay(new Date(e.target.value + "T00:00:00").getDate());
                }}
              />
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
              <CategorySelectWithAdd
                id="bf-category"
                name="category_id"
                categories={categories}
                defaultValue={bill?.category_id ?? ""}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-notes">Notes</Label>
            <Textarea id="bf-notes" name="notes" placeholder="Optional notes..." defaultValue={bill?.notes ?? ""} />
          </div>

          {/* Recurring toggle — only on create */}
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
              {isPending ? "Saving..." : isEdit ? "Save Changes" : isRecurring ? "Add Recurring Bill" : "Add Bill"}
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
