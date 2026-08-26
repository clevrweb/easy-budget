"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createGroupAction, updateGroupAction } from "@/app/(dashboard)/groups/actions";
import { GroupBillsPicker } from "./group-bills-picker";
import { useDict } from "@/components/language-provider";
import type { Group } from "@/types/database";
import { Plus } from "lucide-react";

const COLOR_PRESETS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6b7280", "#1e293b", "#4caf50",
];

interface GroupFormProps {
  group?: Group;
  trigger?: React.ReactNode;
}

export function GroupForm({ group, trigger }: GroupFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(group?.color ?? "#4f46e5");
  const [isPending, startTransition] = useTransition();
  const [createdGroup, setCreatedGroup] = useState<{ id: string; name: string } | null>(null);
  const isEdit = !!group;
  const dict = useDict();
  const t = dict.groups;

  function resetAndClose(o: boolean) {
    setOpen(o);
    if (!o) {
      setColor(group?.color ?? "#4f46e5");
      setCreatedGroup(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("color", color);
    startTransition(async () => {
      if (isEdit) {
        const result = await updateGroupAction(formData);
        if (result?.error) setError(result.error);
        else resetAndClose(false);
        return;
      }

      const result = await createGroupAction(formData);
      if (result?.error) { setError(result.error); return; }
      // After creating, offer to add existing bills/templates to the new
      // group right away instead of closing immediately.
      setCreatedGroup({ id: result.id, name: formData.get("name") as string });
    });
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="w-4 h-4" />{t.addGroup}</Button>}
      </DialogTrigger>
      <DialogContent>
        {createdGroup ? (
          <GroupBillsPicker
            groupId={createdGroup.id}
            groupName={createdGroup.name}
            onDone={() => resetAndClose(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isEdit ? t.editGroup : t.addGroup}</DialogTitle>
            </DialogHeader>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              {isEdit && <input type="hidden" name="id" value={group.id} />}

              <div className="space-y-1.5">
                <Label htmlFor="grp-name">{t.nameLabel}</Label>
                <Input id="grp-name" name="name" placeholder="e.g. Household, Business, Personal" defaultValue={group?.name} required />
              </div>

              <div className="space-y-2">
                <Label>{t.colorLabel}</Label>
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
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: color }} />
                  <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{color}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? t.saving : isEdit ? t.saveChanges : t.addGroup}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">{t.cancel}</Button>
                </DialogClose>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
