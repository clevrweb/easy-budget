"use client";

import { formatCurrency } from "@/lib/utils";
import { BillRow } from "./bill-row";
import { useDict } from "@/components/language-provider";
import type { Bill, Category, Group } from "@/types/database";
import type { GroupBy } from "./bills-header";

interface BillsGroupedListProps {
  bills: Bill[];
  categories: Category[];
  groups: Group[];
  groupBy?: GroupBy;
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

export function BillsGroupedList({ bills, categories, groups, groupBy = "group" }: BillsGroupedListProps) {
  const dict = useDict();

  if (bills.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--color-muted-foreground)] text-sm">{dict.bills.noBills}</p>
        <p className="text-[var(--color-muted-foreground)] text-xs mt-1">{dict.bills.noBillsHint}</p>
      </div>
    );
  }

  if (groupBy === "day") {
    const dayMap = new Map<string, Bill[]>();
    const dayOrder: string[] = [];

    for (const bill of bills) {
      const key = bill.due_date;
      if (!dayMap.has(key)) {
        dayMap.set(key, []);
        dayOrder.push(key);
      }
      dayMap.get(key)!.push(bill);
    }

    return (
      <div className="space-y-6">
        {dayOrder.map((dayDate) => {
          const dayBills = dayMap.get(dayDate)!;
          const dayTotal = dayBills.reduce((s, b) => s + b.amount, 0);
          const dayLabel = new Date(dayDate + "T00:00:00").toLocaleString(dict.locale, {
            weekday: "long", month: "short", day: "numeric",
          });
          const billWord = dayBills.length === 1 ? dict.bills.billSingular : dict.bills.billPlural;

          // Within each day, sub-group by group
          const subGroupMap = new Map<string | null, Bill[]>();
          const subGroupOrder: (string | null)[] = [];
          for (const bill of dayBills) {
            const key = bill.group_id ?? null;
            if (!subGroupMap.has(key)) {
              subGroupMap.set(key, []);
              subGroupOrder.push(key);
            }
            subGroupMap.get(key)!.push(bill);
          }

          return (
            <div key={dayDate} className="bg-[var(--color-card)] rounded-t-xl overflow-hidden">
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-muted)]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-foreground)] capitalize">{dayLabel}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">· {dayBills.length} {billWord}</span>
                </div>
                <span className="text-sm font-bold text-[var(--color-foreground)] tabular-nums">
                  {formatCurrency(dayTotal)}
                </span>
              </div>

              {/* Sub-groups within the day */}
              <div className="divide-y divide-[var(--color-border)]">
                {subGroupOrder.map((groupId) => {
                  const groupBills = subGroupMap.get(groupId)!;
                  const group = groupId ? groups.find((g) => g.id === groupId) : null;
                  const groupTotal = groupBills.reduce((s, b) => s + b.amount, 0);
                  const color = group?.color ?? "#94a3b8";
                  const rgb = hexToRgb(color);
                  const bgStyle = rgb
                    ? { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)` }
                    : { backgroundColor: "#94a3b826" };

                  return (
                    <div key={groupId ?? "__ungrouped__"}>
                      <div
                        className="flex items-center justify-between pl-3 pr-4 py-1.5"
                        style={{ ...bgStyle, borderLeft: `3px solid ${color}` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-foreground)]">
                            {group?.name ?? dict.bills.ungrouped}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-muted-foreground)] tabular-nums">
                          {formatCurrency(groupTotal)}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--color-border)]">
                        {groupBills.map((bill) => (
                          <BillRow key={bill.id} bill={bill} categories={categories} groups={groups} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

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

        const billWord = groupBills.length === 1 ? dict.bills.billSingular : dict.bills.billPlural;

        return (
          <div key={groupId ?? "__ungrouped__"} className="bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 py-2.5" style={bgStyle}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {group?.name ?? dict.bills.ungrouped}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  · {groupBills.length} {billWord}
                </span>
              </div>
              <span className="text-sm font-bold text-[var(--color-foreground)] tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {groupBills.map((bill) => (
                <BillRow key={bill.id} bill={bill} categories={categories} groups={groups} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
