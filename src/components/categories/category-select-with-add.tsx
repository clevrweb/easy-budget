"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategoryAction } from "@/app/(dashboard)/categories/actions";
import type { Category } from "@/types/database";

const COLOR_PRESETS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6b7280", "#1e293b", "#4caf50",
];

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

interface CategorySelectWithAddProps {
  categories: Category[];
  defaultValue?: string;
  name?: string;
  id?: string;
}

export function CategorySelectWithAdd({
  categories: initialCategories,
  defaultValue = "",
  name = "category_id",
  id = "category_id",
}: CategorySelectWithAddProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [selected, setSelected]     = useState(defaultValue);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [color, setColor]           = useState("#4f46e5");
  const [error, setError]           = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openDialog() {
    setColor("#4f46e5");
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("color", color);
    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.category) {
        const newCat = result.category as Category;
        setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
        setSelected(newCat.id);
        setDialogOpen(false);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <select
          id={id}
          name={name}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={selectCls}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={openDialog}
          title="Add new category"
          className="w-10 h-10 shrink-0 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Inline mini-dialog */}
      {dialogOpen && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">New Category</span>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <p className="text-xs text-[var(--color-danger)]">{error}</p>
          )}

          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="qac-name" className="text-xs">Name</Label>
              <Input id="qac-name" name="name" placeholder="e.g. Housing" required autoFocus />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-md transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `3px solid ${c}` : undefined,
                      outlineOffset: color === c ? "2px" : undefined,
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-md cursor-pointer border border-[var(--color-border)] p-0.5 bg-[var(--color-card)]"
                  title="Custom color"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 h-8 text-xs" disabled={isPending}>
                {isPending ? "Saving..." : "Add"}
              </Button>
              <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
