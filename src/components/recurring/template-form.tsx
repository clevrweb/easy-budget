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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { createTemplateAction, updateTemplateAction } from "@/app/(dashboard)/recurring/actions";
import type { RecurringTemplate, Category, Group } from "@/types/database";
import { Plus } from "lucide-react";
import { useDict } from "@/components/language-provider";

interface TemplateFormProps {
  template?: RecurringTemplate;
  categories: Category[];
  groups: Group[];
  trigger?: React.ReactNode;
}

export function TemplateForm({ template, categories, groups, trigger }: TemplateFormProps) {
  const dict = useDict();
  const t = dict.recurring;
  const tb = dict.bills;
  const tc = dict.common;

  const FREQUENCIES = [
    { value: "monthly", label: t.monthly },
    { value: "weekly", label: t.weekly },
    { value: "yearly", label: t.yearly },
  ];

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [frequency, setFrequency] = useState<string>(template?.frequency ?? "monthly");
  const [dueDay, setDueDay] = useState(template?.due_day ?? 1);
  const isEdit = !!template;

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateTemplateAction(formData)
        : await createTemplateAction(formData);

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
            {t.addTemplate}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editTemplate : t.addRecurringTemplate}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={template.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="name">{tb.nameLabel}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t.namePlaceholderTemplate}
              defaultValue={template?.name}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="creditor">{tb.creditorLabel}</Label>
            <Input
              id="creditor"
              name="creditor"
              placeholder={tb.creditorPlaceholder}
              defaultValue={template?.creditor ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">{tb.amountLabel}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              defaultValue={template?.amount}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="frequency">{t.frequency}</Label>
            <select
              id="frequency"
              name="frequency"
              value={frequency}
              onChange={(e) => {
                const next = e.target.value;
                setFrequency(next);
                if (next === "weekly") setDueDay(1);
                else setDueDay(template?.due_day ?? 1);
              }}
              className="flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {frequency === "monthly" || frequency === "yearly" ? (
            <div className="space-y-1.5">
              <Label htmlFor="due_day">{t.dueDayLabel}</Label>
              <Input
                id="due_day"
                name="due_day"
                type="number"
                min="1"
                max="31"
                placeholder="1–31"
                value={dueDay}
                onChange={(e) => setDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="due_day">{t.repeatEveryLabel}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="due_day"
                  name="due_day"
                  type="number"
                  min="1"
                  max="52"
                  value={dueDay}
                  onChange={(e) => setDueDay(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                  className="w-24"
                  required
                />
                <span className="text-sm text-[var(--color-muted-foreground)]">{t.weekIntervalUnit}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="payment_method">{tb.paymentMethodLabel}</Label>
            <Input
              id="payment_method"
              name="payment_method"
              placeholder="e.g., Bofa Checking"
              defaultValue={template?.payment_method ?? ""}
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="category_id">{tb.categoryLabel}</Label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={template?.category_id ?? ""}
                className="flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                <option value="">{tb.noCategory}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {groups.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="group_id">{tb.groupLabel}</Label>
              <select
                id="group_id"
                name="group_id"
                defaultValue={template?.group_id ?? ""}
                className="flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                <option value="">{tb.noGroup}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? tc.saving : isEdit ? tb.saveChanges : t.addTemplate}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{tc.cancel}</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
