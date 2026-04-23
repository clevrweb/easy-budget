"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteBillAction, markBillPaidAction, markBillPendingAction } from "@/app/(dashboard)/bills/actions";
import { BillForm } from "./bill-form";
import type { Bill, Category, Group } from "@/types/database";

const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6d28d9", "#be185d", "#0f766e",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  const effective = isOverdue ? "overdue" : status;
  const cfg = {
    paid:    { label: "Paid",    cls: "text-[var(--color-success)] bg-green-50 dark:bg-green-950" },
    pending: { label: "Pending", cls: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950" },
    overdue: { label: "Overdue", cls: "text-[var(--color-danger)] bg-red-50 dark:bg-red-950" },
  }[effective] ?? { label: status, cls: "" };

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

interface BillRowProps {
  bill: Bill;
  categories: Category[];
  groups: Group[];
}

export function BillRow({ bill, categories, groups }: BillRowProps) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [menuPos, setMenuPos]     = useState<{ top: number; right: number } | null>(null);
  const [editOpen, setEditOpen]   = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);

  const today     = new Date().toISOString().split("T")[0];
  const isOverdue = bill.status === "pending" && bill.due_date < today;
  const isPaid    = bill.status === "paid";

  const category      = categories.find((c) => c.id === bill.category_id);
  const group         = groups.find((g) => g.id === bill.group_id);
  const paymentMethod = bill.payment_method ?? null;
  const metaLabel     = paymentMethod ?? group?.name ?? category?.name ?? null;

  const dateStr = new Date(bill.due_date + "T00:00:00").toLocaleString("en-US", {
    month: "short", day: "numeric",
  });

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
    if (!confirm(`Delete "${bill.name}"?`)) return;
    startTransition(async () => { await deleteBillAction(bill.id); });
  }

  const color = avatarColor(bill.name);

  return (
    <div className={`flex items-center gap-2.5 px-3 sm:px-4 py-3 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 select-none"
        style={{ backgroundColor: color }}
      >
        {bill.name[0].toUpperCase()}
      </div>

      {/* Name + meta — takes all remaining space */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--color-foreground)] truncate leading-tight">
          {bill.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">{dateStr}</span>
          <StatusBadge status={bill.status} isOverdue={isOverdue} />
          {metaLabel && (
            <span className="text-xs text-[var(--color-muted-foreground)] truncate hidden sm:inline">
              · {metaLabel}
            </span>
          )}
        </div>
      </div>

      {/* Right-side group: amount + pay + menu */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-bold text-sm text-[var(--color-foreground)] tabular-nums">
          {formatCurrency(bill.amount)}
        </span>

        {!isPaid ? (
          <button
            onClick={() => startTransition(async () => { await markBillPaidAction(bill.id); })}
            className="h-7 px-2.5 rounded-lg border-2 border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-foreground)] hover:border-[var(--color-success)] hover:text-[var(--color-success)] transition-colors"
          >
            PAY
          </button>
        ) : (
          <button
            onClick={() => startTransition(async () => { await markBillPendingAction(bill.id); })}
            className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            PAID
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
            onClick={() => { setMenuOpen(false); setEditOpen(true); }}
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>,
        document.body
      )}

      {/* Edit dialog — outside the portal */}
      <BillForm
        bill={bill}
        categories={categories}
        groups={groups}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
