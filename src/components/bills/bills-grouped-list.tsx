"use client";

import { formatCurrency } from "@/lib/utils";
import { BillRow } from "./bill-row";
import type { Bill, Category, Group } from "@/types/database";

interface BillsGroupedListProps {
  bills: Bill[];
  categories: Category[];
  groups: Group[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function BillsGroupedList({ bills, categories, groups }: BillsGroupedListProps) {
  if (bills.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--color-muted-foreground)] text-sm">No bills found.</p>
        <p className="text-[var(--color-muted-foreground)] text-xs mt-1">
          Try a different period or add a new bill.
        </p>
      </div>
    );
  }

  // Build ordered group buckets preserving due_date order within each group
  const groupMap = new Map<string | null, Bill[]>();
  const groupOrder: (string | null)[] = [];

  for (const bill of bills) {
    const key = bill.group_id ?? null;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      groupOrder.push(key);
    }
    groupMap.get(key)!.push(bill);
  }

  return (
    <div className="space-y-4 bg-[var(--color-background)]">
      {groupOrder.map((groupId) => {
        const groupBills = groupMap.get(groupId)!;
        const group = groupId ? groups.find((g) => g.id === groupId) : null;
        const total = groupBills.reduce((s, b) => s + b.amount, 0);
        const color = group?.color ?? "#94a3b8";
        const rgb = hexToRgb(color);
        const bgStyle = rgb
          ? { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)` }
          : { backgroundColor: "#94a3b810" };

        return (
          <div key={groupId ?? "__ungrouped__"} className="bg-[var(--color-card)] border border-[var(--color-border)]">
            {/* Group header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={bgStyle}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {group?.name ?? "Ungrouped"}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  · {groupBills.length} {groupBills.length === 1 ? "bill" : "bills"}
                </span>
              </div>
              <span className="text-sm font-bold text-[var(--color-foreground)] tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Bills in this group */}
            <div className="divide-y divide-[var(--color-border)]">
              {groupBills.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  categories={categories}
                  groups={groups}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
