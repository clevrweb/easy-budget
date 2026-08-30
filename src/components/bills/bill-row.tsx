"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2, CircleDollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteBillAction, deleteRecurringSeriesAction, markBillPaidAction, markBillPendingAction, payBillAction } from "@/app/(dashboard)/bills/actions";
import { BillForm } from "./bill-form";
import { RecurringSeriesForm } from "./recurring-series-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";
import type { Bill, Category, Group } from "@/types/database";

const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6d28d9", "#be185d", "#0f766e",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface BillRowProps {
  bill: Bill;
  categories: Category[];
  groups: Group[];
}

export function BillRow({ bill, categories, groups }: BillRowProps) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [menuPos, setMenuPos]           = useState<{ top: number; right: number } | null>(null);
  const [editOpen, setEditOpen]         = useState(false);
  const [choiceOpen, setChoiceOpen]           = useState(false);
  const [seriesEditOpen, setSeriesEditOpen]   = useState(false);
  const [deleteChoiceOpen, setDeleteChoiceOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);
  const dict = useDict();

  const today       = new Date().toISOString().split("T")[0];
  const isOverdue   = bill.status === "pending" && bill.due_date < today;
  const isPaid      = bill.status === "paid";
  const amountPaid  = bill.amount_paid ?? 0;
  const remaining   = Math.max(0, bill.amount - amountPaid);
  const isPartial   = !isPaid && amountPaid > 0 && amountPaid < bill.amount;

  const category      = categories.find((c) => c.id === bill.category_id);
  const group         = groups.find((g) => g.id === bill.group_id);
  const paymentMethod = bill.payment_method ?? null;
  const metaLabel     = paymentMethod ?? group?.name ?? category?.name ?? null;

  const dateStr = new Date(bill.due_date + "T00:00:00").toLocaleString(dict.locale, {
    month: "short", day: "numeric",
  });

  const statusLabel = {
    paid:    dict.bills.paid,
    pending: dict.bills.pending,
    overdue: dict.bills.overdue,
  };

  const effectiveStatus = isOverdue ? "overdue" : bill.status;
  const cfg = isPartial
    ? { label: dict.bills.partial, bg: "#f59e0b33", color: "#b45309" }
    : {
        paid:    { label: statusLabel.paid,    bg: "var(--badge-paid-bg)",    color: "var(--badge-paid-fg)"    },
        pending: { label: statusLabel.pending, bg: "var(--badge-pending-bg)", color: "var(--badge-pending-fg)" },
        overdue: { label: statusLabel.overdue, bg: "var(--badge-overdue-bg)", color: "var(--badge-overdue-fg)" },
      }[effectiveStatus] ?? { label: bill.status, bg: "#94a3b822", color: "#475569" };

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function toggleMenu() {
    if (menuOpen) { setMenuOpen(false); return; }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen(true);
  }

  function handleDelete() {
    setMenuOpen(false);
    if (bill.recurring_template_id) {
      setDeleteChoiceOpen(true);
      return;
    }
    if (!confirm(`${dict.bills.confirmDelete} "${bill.name}"?`)) return;
    startTransition(async () => { await deleteBillAction(bill.id); });
  }

  function handleDeleteThis() {
    setDeleteChoiceOpen(false);
    startTransition(async () => { await deleteBillAction(bill.id); });
  }

  function handleDeleteSeries() {
    setDeleteChoiceOpen(false);
    startTransition(async () => { await deleteRecurringSeriesAction(bill.recurring_template_id!); });
  }

  function openPayDialog() {
    setMenuOpen(false);
    setPayError(null);
    setPayAmount(remaining.toFixed(2));
    setPayDialogOpen(true);
  }

  function handleConfirmPayment() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError(dict.bills.paymentAmountLabel); return; }
    startTransition(async () => {
      const result = await payBillAction(bill.id, amount);
      if (result?.error) { setPayError(result.error); return; }
      setPayDialogOpen(false);
    });
  }

  const avatarSource = bill.creditor || bill.name;
  const color = avatarColor(avatarSource);

  return (
    <div
      className={`flex items-center gap-2.5 px-3 sm:px-4 py-3
        ${isPending ? "opacity-50 pointer-events-none" : ""}
        ${isPaid    ? "bg-green-500/20 dark:bg-green-500/15" : ""}
        ${isOverdue ? "bg-red-500/30 dark:bg-red-500/20" : ""}
      `}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 select-none overflow-hidden"
        style={{ backgroundColor: bill.logo_url ? "transparent" : color }}
      >
        {bill.logo_url ? (
          <img
            src={bill.logo_url}
            alt={bill.name}
            className="w-9 h-9 object-contain rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.style.backgroundColor = color;
              e.currentTarget.parentElement!.textContent = avatarSource[0].toUpperCase();
            }}
          />
        ) : (
          avatarSource[0].toUpperCase()
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--color-foreground)] truncate leading-tight">
          {bill.name}
        </p>
        {bill.creditor && (
          <p className="text-xs text-[var(--color-muted-foreground)] truncate leading-tight">
            {bill.creditor}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">{dateStr}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {bill.is_autopay && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}
            >
              {dict.bills.autopayLabel}
            </span>
          )}
          {metaLabel && (
            <span className="text-xs text-[var(--color-muted-foreground)] truncate hidden sm:inline">
              · {metaLabel}
            </span>
          )}
        </div>
      </div>

      {/* Right-side group */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isPartial ? (
          <span className="text-right leading-tight">
            <span className="block font-bold text-sm text-[var(--color-foreground)] tabular-nums">
              {formatCurrency(remaining)}
            </span>
            <span className="block text-[10px] text-[var(--color-muted-foreground)] tabular-nums">
              {dict.bills.paidSoFarLabel} {formatCurrency(amountPaid)}
            </span>
          </span>
        ) : (
          <span className="font-bold text-sm text-[var(--color-foreground)] tabular-nums">
            {formatCurrency(bill.amount)}
          </span>
        )}

        {!isPaid ? (
          <button
            onClick={() => startTransition(async () => { await markBillPaidAction(bill.id); })}
            className="h-7 px-2.5 rounded-lg border-2 border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-foreground)] hover:border-[var(--color-success)] hover:text-[var(--color-success)] transition-colors"
          >
            {dict.bills.pay}
          </button>
        ) : (
          <button
            onClick={() => startTransition(async () => { await markBillPendingAction(bill.id); })}
            className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            {dict.bills.paidBtn}
          </button>
        )}

        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Portal dropdown */}
      {menuOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 min-w-[130px]"
        >
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            onClick={() => {
              setMenuOpen(false);
              if (bill.recurring_template_id) setChoiceOpen(true);
              else setEditOpen(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
            {dict.common.edit}
          </button>
          {!isPaid && (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              onClick={openPayDialog}
            >
              <CircleDollarSign className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
              {dict.bills.recordPayment}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {dict.common.delete}
          </button>
        </div>,
        document.body
      )}

      {/* Edit dialog */}
      <BillForm bill={bill} categories={categories} groups={groups} open={editOpen} onOpenChange={setEditOpen} />

      {/* Record payment dialog */}
      {payDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40" onClick={() => setPayDialogOpen(false)}>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">{dict.bills.payDialogTitle}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
              {dict.bills.remainingLabel}: {formatCurrency(remaining)}
              {amountPaid > 0 && ` · ${dict.bills.paidSoFarLabel} ${formatCurrency(amountPaid)}`}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor={`pay-amount-${bill.id}`}>{dict.bills.paymentAmountLabel}</Label>
              <Input
                id={`pay-amount-${bill.id}`}
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
              />
            </div>
            {payError && <p className="text-xs text-[var(--color-danger)] mt-2">{payError}</p>}
            <div className="flex gap-3 mt-4">
              <Button type="button" className="flex-1" onClick={handleConfirmPayment} disabled={isPending}>
                {dict.bills.confirmPayment}
              </Button>
              <Button type="button" variant="outline" onClick={() => setPayDialogOpen(false)}>
                {dict.bills.cancel}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Recurring choice dialog */}
      {choiceOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40" onClick={() => setChoiceOpen(false)}>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">{dict.recurring.editTitle}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">{dict.recurring.editDesc}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setChoiceOpen(false); setEditOpen(true); }} className="w-full text-left px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
                {dict.recurring.justThis}
                <span className="block text-xs text-[var(--color-muted-foreground)] font-normal mt-0.5">{dict.recurring.justThisEditDesc}</span>
              </button>
              <button onClick={() => { setChoiceOpen(false); setSeriesEditOpen(true); }} className="w-full text-left px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
                {dict.recurring.entireSeries}
                <span className="block text-xs text-[var(--color-muted-foreground)] font-normal mt-0.5">{dict.recurring.entireSeriesEditDesc}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete recurring choice dialog */}
      {deleteChoiceOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40" onClick={() => setDeleteChoiceOpen(false)}>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">{dict.recurring.deleteTitle}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">{dict.recurring.deleteDesc}</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteThis} className="w-full text-left px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
                {dict.recurring.justThis}
                <span className="block text-xs text-[var(--color-muted-foreground)] font-normal mt-0.5">{dict.recurring.justThisDeleteDesc}</span>
              </button>
              <button onClick={handleDeleteSeries} className="w-full text-left px-4 py-3 rounded-xl border border-[var(--color-danger)]/40 text-sm font-medium text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                {dict.recurring.entireSeries}
                <span className="block text-xs font-normal mt-0.5 opacity-80">{dict.recurring.entireSeriesDeleteDesc}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Recurring series edit dialog */}
      {bill.recurring_template_id && (
        <RecurringSeriesForm bill={bill} categories={categories} groups={groups} open={seriesEditOpen} onOpenChange={setSeriesEditOpen} />
      )}
    </div>
  );
}
