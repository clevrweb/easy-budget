"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { deleteBucketAction } from "@/app/(dashboard)/savings-plan/actions";
import { BucketForm } from "./bucket-form";
import { useDict } from "@/components/language-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SavingsBucket } from "@/types/database";
import { Pencil, Trash2, PiggyBank, LineChart, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeableRow, type SwipeAction } from "@/components/ui/swipeable-row";
import { useConfirmAction } from "@/lib/use-confirm-action";

interface BucketCardProps {
  bucket: SavingsBucket;
  onChanged?: () => void;
}

export function BucketCard({ bucket, onChanged }: BucketCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const dict = useDict();
  const t = dict.savingsPlan;

  const deleteConfirm = useConfirmAction(() => {
    startTransition(async () => {
      const result = await deleteBucketAction(bucket.id);
      if (!result?.error) onChanged?.();
    });
  });

  const swipeActions: SwipeAction[] = [
    {
      key: "edit",
      label: dict.common.edit,
      icon: <Pencil className="w-4 h-4" />,
      onActivate: () => setEditOpen(true),
      className: "bg-slate-500",
    },
    {
      key: "delete",
      label: deleteConfirm.armed ? dict.common.confirmAgain : dict.common.delete,
      icon: <Trash2 className="w-4 h-4" />,
      onActivate: deleteConfirm.trigger,
      className: deleteConfirm.armed ? "bg-red-700" : "bg-[var(--color-danger)]",
    },
  ];

  const pct = bucket.target_amount > 0 ? Math.min(100, (bucket.current_amount / bucket.target_amount) * 100) : 0;

  return (
    <SwipeableRow
      actions={swipeActions}
      disabled={isPending}
      onClose={deleteConfirm.reset}
      className="rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200"
    >
      <div className={`bg-[var(--color-card)] p-5 flex flex-col gap-4 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#0d3b66]/10 border-2 border-[#0d3b66]">
            <PiggyBank className="w-4 h-4 text-[#0d3b66]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">{bucket.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {formatCurrency(bucket.current_amount)} / {formatCurrency(bucket.target_amount)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div className="h-full bg-[#0d3b66] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-[var(--color-muted-foreground)] text-right">{Math.round(pct)}%</p>
        </div>

        {bucket.projected_value && bucket.projected_date && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t.projectedSummary.replace("{amount}", formatCurrency(bucket.projected_value)).replace("{date}", formatDate(bucket.projected_date))}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/calculators/compound?bucketId=${bucket.id}`}>
              <Percent className="w-3.5 h-3.5" /> {t.projectWithCompound}
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/calculators/stock-projection?bucketId=${bucket.id}`}>
              <LineChart className="w-3.5 h-3.5" /> {t.projectWithStock}
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 mt-auto pt-1 border-t border-[var(--color-border)]">
          <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5" /> {dict.common.edit}
          </Button>
          <Button variant="ghost" size="sm" onClick={deleteConfirm.trigger} className="flex-1 text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]">
            <Trash2 className="w-3.5 h-3.5" /> {deleteConfirm.armed ? dict.common.confirmAgain : dict.common.delete}
          </Button>
        </div>
      </div>
      <BucketForm bucket={bucket} onSaved={onChanged} open={editOpen} onOpenChange={setEditOpen} />
    </SwipeableRow>
  );
}
