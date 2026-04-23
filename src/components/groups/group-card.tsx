"use client";

import { useTransition } from "react";
import { deleteGroupAction } from "@/app/(dashboard)/groups/actions";
import { GroupForm } from "./group-form";
import type { Group } from "@/types/database";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GroupCardProps {
  group: Group;
  billCount: number;
}

export function GroupCard({ group, billCount }: GroupCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${group.name}"? Bills in this group will become ungrouped.`)) return;
    startTransition(async () => { await deleteGroupAction(group.id); });
  }

  return (
    <div className={`bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 flex flex-col gap-4 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Color swatch + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: group.color + "22", border: `2px solid ${group.color}` }}
        >
          <Users className="w-4 h-4" style={{ color: group.color }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">{group.name}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {billCount} {billCount === 1 ? "bill" : "bills"}
          </p>
        </div>
      </div>

      {/* Color chip */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: group.color }} />
        <span className="text-xs font-mono text-[var(--color-muted-foreground)]">{group.color}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1 border-t border-[var(--color-border)]">
        <GroupForm
          group={group}
          trigger={
            <Button variant="ghost" size="sm" className="flex-1 text-xs">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          }
        />
        <Button variant="ghost" size="sm" onClick={handleDelete} className="flex-1 text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
