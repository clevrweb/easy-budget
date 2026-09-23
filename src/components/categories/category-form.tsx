"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createCategoryAction, updateCategoryAction } from "@/app/(dashboard)/categories/actions";
import { useDict } from "@/components/language-provider";
import type { Category } from "@/types/database";
import { Plus } from "lucide-react";
import { CATEGORY_COLOR_PRESETS, CATEGORY_COLOR_DEFAULT } from "@/lib/colors";

interface CategoryFormProps {
  category?: Category;
  trigger?: React.ReactNode;
}

export function CategoryForm({ category, trigger }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLOR_DEFAULT);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!category;
  const dict = useDict();
  const t = dict.categories;

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("color", color);
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoryAction(formData)
        : await createCategoryAction(formData);
      if (result?.error) setError(result.error);
      else { setOpen(false); setColor(CATEGORY_COLOR_DEFAULT); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setColor(category?.color ?? CATEGORY_COLOR_DEFAULT); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="w-4 h-4" />{t.addCategory}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editCategory : t.addCategory}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={category.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">{t.nameLabel}</Label>
            <Input id="cat-name" name="name" placeholder="e.g. Housing, Food, Transport" defaultValue={category?.name} required />
          </div>

          <div className="space-y-2">
            <Label>{t.colorLabel}</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : undefined, outlineOffset: color === c ? "2px" : undefined }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--color-border)] p-0.5 bg-[var(--color-card)]"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-md" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? t.saving : isEdit ? t.saveChanges : t.addCategory}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t.cancel}</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
