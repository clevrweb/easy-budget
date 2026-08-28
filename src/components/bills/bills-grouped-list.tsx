"use client";

import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getGroupIcon } from "@/lib/group-icons";
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

function GroupHeader({ group, count, total, billWord, ungroupedLabel }: {
  group: Group | null;
  count: number;
  total: number;
  billWord: string;
  ungroupedLabel: string;
}) {
  const color = group?.color ?? "#94a3b8";
  const Icon = getGroupIcon(group?.icon);

  return (
    <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: color }}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-white shrink-0" />}
        <span className="text-sm font-semibold text-white truncate">{group?.name ?? ungroupedLabel}</span>
        <span className="text-xs text-white/80 shrink-0">· {count} {billWord}</span>
      </div>
      <span className="text-sm font-bold text-white tabular-nums shrink-0">{formatCurrency(total)}</span>
    </div>
  );
}

export function BillsGroupedList({ bills, categories, groups, groupBy = "group" }: BillsGroupedListProps) {
  const dict = useDict();

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
      {/* Bills header row */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500">
        <Receipt className="w-4 h-4 text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">{dict.bills.title}</span>
      </div>

      {bills.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--color-muted-foreground)] text-sm">{dict.bills.noBills}</p>
          <p className="text-[var(--color-muted-foreground)] text-xs mt-1">{dict.bills.noBillsHint}</p>
        </div>
      ) : groupBy === "day" ? (
        <DayView bills={bills} categories={categories} groups={groups} dict={dict} />
      ) : (
        <GroupView bills={bills} categories={categories} groups={groups} dict={dict} />
      )}
    </div>
  );
}

function DayView({ bills, categories, groups, dict }: { bills: Bill[]; categories: Category[]; groups: Group[]; dict: ReturnType<typeof useDict> }) {
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
    <div className="divide-y divide-[var(--color-border)]">
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
          <div key={dayDate}>
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
            {subGroupOrder.map((groupId) => {
              const groupBills = subGroupMap.get(groupId)!;
              const group = groupId ? groups.find((g) => g.id === groupId) ?? null : null;
              const groupTotal = groupBills.reduce((s, b) => s + b.amount, 0);
              const subBillWord = groupBills.length === 1 ? dict.bills.billSingular : dict.bills.billPlural;

              return (
                <div key={groupId ?? "__ungrouped__"}>
                  <GroupHeader group={group} count={groupBills.length} total={groupTotal} billWord={subBillWord} ungroupedLabel={dict.bills.ungrouped} />
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
      })}
    </div>
  );
}

function GroupView({ bills, categories, groups, dict }: { bills: Bill[]; categories: Category[]; groups: Group[]; dict: ReturnType<typeof useDict> }) {
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
    <div className="divide-y divide-[var(--color-border)]">
      {groupOrder.map((groupId) => {
        const groupBills = groupMap.get(groupId)!;
        const group = groupId ? groups.find((g) => g.id === groupId) ?? null : null;
        const total = groupBills.reduce((s, b) => s + b.amount, 0);
        const billWord = groupBills.length === 1 ? dict.bills.billSingular : dict.bills.billPlural;

        return (
          <div key={groupId ?? "__ungrouped__"}>
            <GroupHeader group={group} count={groupBills.length} total={total} billWord={billWord} ungroupedLabel={dict.bills.ungrouped} />
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
