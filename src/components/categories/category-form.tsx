"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createCategoryAction, updateCategoryAction } from "@/app/(dashboard)/categories/actions";
import type { Category } from "@/types/database";
import { Plus } from "lucide-react";

const COLOR_PRESETS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6b7280", "#1e293b", "#4caf50",
];

interface CategoryFormProps {
  category?: Category;
  trigger?: React.ReactNode;
}

export function CategoryForm({ category, trigger }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(category?.color ?? "#4f46e5");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!category;

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("color", color);
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoryAction(formData)
        : await createCategoryAction(formData);
      if (result?.error) setError(result.error);
      else { setOpen(false); setColor("#4f46e5"); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setColor(category?.color ?? "#4f46e5"); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="w-4 h-4" />Add Category</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={category.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" name="name" placeholder="e.g. Housing, Food, Transport" defaultValue={category?.name} required />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
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
                title="Custom color"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-md" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Category"}
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
