"use client";

import { useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { deleteTemplateAction, toggleTemplateActiveAction } from "@/app/(dashboard)/recurring/actions";
import { TemplateForm } from "./template-form";
import type { RecurringTemplate, Category, Group } from "@/types/database";
import { Pencil, Trash2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const frequencyLabel: Record<string, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  yearly: "Yearly",
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface TemplateRowProps {
  template: RecurringTemplate;
  categories: Category[];
  groups: Group[];
}

export function TemplateRow({ template, categories, groups }: TemplateRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${template.name}"?`)) return;
    startTransition(async () => { await deleteTemplateAction(template.id); });
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleTemplateActiveAction(template.id, !template.is_active);
    });
  }

  return (
    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-muted)] transition-colors duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Active toggle */}
      <button
        onClick={handleToggle}
        title={template.is_active ? "Deactivate" : "Activate"}
        className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 shrink-0 ${
          template.is_active ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full bg-white shadow-sm mx-1 transition-transform duration-200 ${
            template.is_active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      {/* Icon */}
      <div className={`p-1.5 rounded-lg shrink-0 ${template.is_active ? "bg-indigo-50 dark:bg-indigo-950 text-[var(--color-primary)]" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"}`}>
        <RefreshCcw className="w-3.5 h-3.5" />
      </div>

      {/* Name + schedule */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${template.is_active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)] line-through"}`}>
          {template.name}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {frequencyLabel[template.frequency]} · due {ordinal(template.due_day)}
        </p>
      </div>

      {/* Amount */}
      <span className="font-semibold text-sm text-[var(--color-foreground)] shrink-0">
        {formatCurrency(template.amount)}
      </span>

      {/* Frequency badge */}
      <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)] hidden sm:inline-flex shrink-0">
        {frequencyLabel[template.frequency]}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <TemplateForm
          template={template}
          categories={categories}
          groups={groups}
          trigger={
            <Button variant="ghost" size="icon" title="Edit template">
              <Pencil className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            </Button>
          }
        />
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete template">
          <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
        </Button>
      </div>
    </div>
  );
}
