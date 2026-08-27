"use client";

import { useEffect, useState, useTransition } from "react";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAssignableBillsAction, assignBillsToGroupAction } from "@/app/(dashboard)/groups/actions";
import { formatCurrency } from "@/lib/utils";
import { useDict } from "@/components/language-provider";

interface AssignableBill {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  is_recurring: boolean;
  group_id: string | null;
}

interface AssignableTemplate {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  group_id: string | null;
}

interface GroupBillsPickerProps {
  groupId: string;
  groupName: string;
  onDone: () => void;
}

export function GroupBillsPicker({ groupId, groupName, onDone }: GroupBillsPickerProps) {
  const dict = useDict();
  const t = dict.groups;
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<AssignableBill[]>([]);
  const [templates, setTemplates] = useState<AssignableTemplate[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getAssignableBillsAction(groupId).then((data) => {
      if (cancelled) return;
      setBills(data.bills);
      setTemplates(data.templates);
      setSelectedBillIds(new Set(data.bills.filter((b) => b.group_id === groupId).map((b) => b.id)));
      setSelectedTemplateIds(new Set(data.templates.filter((tpl) => tpl.group_id === groupId).map((tpl) => tpl.id)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [groupId]);

  function toggleBill(id: string) {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleTemplate(id: string) {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const allTemplatesSelected = templates.length > 0 && templates.every((tpl) => selectedTemplateIds.has(tpl.id));
  const someTemplatesSelected = templates.some((tpl) => selectedTemplateIds.has(tpl.id));
  const allBillsSelected = bills.length > 0 && bills.every((b) => selectedBillIds.has(b.id));
  const someBillsSelected = bills.some((b) => selectedBillIds.has(b.id));

  function toggleAllTemplates() {
    setSelectedTemplateIds(allTemplatesSelected ? new Set() : new Set(templates.map((tpl) => tpl.id)));
  }

  function toggleAllBills() {
    setSelectedBillIds(allBillsSelected ? new Set() : new Set(bills.map((b) => b.id)));
  }

  function handleSave() {
    startTransition(async () => {
      await assignBillsToGroupAction(groupId, Array.from(selectedBillIds), Array.from(selectedTemplateIds));
      onDone();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t.addBillsTitle.replace("{name}", groupName)}
        </h3>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{t.addBillsDesc}</p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.common.saving}</p>
      ) : bills.length === 0 && templates.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)] py-4">{t.noAssignableBills}</p>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4">
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {t.recurringTemplatesLabel}
                </p>
                <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allTemplatesSelected}
                    ref={(el) => { if (el) el.indeterminate = someTemplatesSelected && !allTemplatesSelected; }}
                    onChange={toggleAllTemplates}
                    className="w-3.5 h-3.5 rounded accent-[var(--color-primary)]"
                  />
                  {t.selectAll}
                </label>
              </div>
              <div className="space-y-1">
                {templates.map((tpl) => (
                  <label
                    key={tpl.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplateIds.has(tpl.id)}
                      onChange={() => toggleTemplate(tpl.id)}
                      className="w-4 h-4 rounded accent-[var(--color-primary)]"
                    />
                    <Repeat className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0" />
                    <span className="flex-1 text-sm text-[var(--color-foreground)] truncate">{tpl.name}</span>
                    <span className="text-sm font-medium text-[var(--color-foreground)] tabular-nums shrink-0">
                      {formatCurrency(tpl.amount)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {bills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {t.oneTimeBillsLabel}
                </p>
                <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allBillsSelected}
                    ref={(el) => { if (el) el.indeterminate = someBillsSelected && !allBillsSelected; }}
                    onChange={toggleAllBills}
                    className="w-3.5 h-3.5 rounded accent-[var(--color-primary)]"
                  />
                  {t.selectAll}
                </label>
              </div>
              <div className="space-y-1">
                {bills.map((bill) => (
                  <label
                    key={bill.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBillIds.has(bill.id)}
                      onChange={() => toggleBill(bill.id)}
                      className="w-4 h-4 rounded accent-[var(--color-primary)]"
                    />
                    <span className="flex-1 text-sm text-[var(--color-foreground)] truncate">{bill.name}</span>
                    <span className="text-sm font-medium text-[var(--color-foreground)] tabular-nums shrink-0">
                      {formatCurrency(bill.amount)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" className="flex-1" onClick={handleSave} disabled={isPending || loading}>
          {isPending ? t.assigning : t.doneButton}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          {t.skipButton}
        </Button>
      </div>
    </div>
  );
}
