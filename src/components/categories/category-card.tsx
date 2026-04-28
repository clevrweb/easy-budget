"use client";

import { useTransition } from "react";
import { deleteCategoryAction } from "@/app/(dashboard)/categories/actions";
import { CategoryForm } from "./category-form";
import { useDict } from "@/components/language-provider";
import type { Category } from "@/types/database";
import { Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
  category: Category;
  billCount: number;
}

export function CategoryCard({ category, billCount }: CategoryCardProps) {
  const [isPending, startTransition] = useTransition();
  const dict = useDict();

  function handleDelete() {
    if (!confirm(`${dict.common.delete} "${category.name}"? ${dict.categories.confirmDelete}`)) return;
    startTransition(async () => { await deleteCategoryAction(category.id); });
  }

  const billWord = billCount === 1 ? dict.categories.billSingular : dict.categories.billPlural;

  return (
    <div className={`bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 flex flex-col gap-4 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: category.color + "22", border: `2px solid ${category.color}` }}
        >
          <Tag className="w-4 h-4" style={{ color: category.color }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">{category.name}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {billCount} {billWord}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: category.color }} />
        <span className="text-xs font-mono text-[var(--color-muted-foreground)]">{category.color}</span>
      </div>

      <div className="flex gap-2 mt-auto pt-1 border-t border-[var(--color-border)]">
        <CategoryForm
          category={category}
          trigger={
            <Button variant="ghost" size="sm" className="flex-1 text-xs">
              <Pencil className="w-3.5 h-3.5" /> {dict.common.edit}
            </Button>
          }
        />
        <Button variant="ghost" size="sm" onClick={handleDelete} className="flex-1 text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]">
          <Trash2 className="w-3.5 h-3.5" /> {dict.common.delete}
        </Button>
      </div>
    </div>
  );
}
