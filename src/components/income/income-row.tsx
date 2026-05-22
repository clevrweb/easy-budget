"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteIncomeSourceAction, toggleIncomeSourceActiveAction } from "@/app/(dashboard)/income/actions";
import { IncomeForm } from "./income-form";
import { useDict } from "@/components/language-provider";
import type { IncomeSource } from "@/types/database";

const frequencyLabel: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  twice_monthly: "2× / month",
  monthly: "Monthly",
};

interface IncomeRowProps {
  source: IncomeSource;
}

export function IncomeRow({ source }: IncomeRowProps) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [menuPos, setMenuPos]         = useState<{ top: number; right: number } | null>(null);
  const [editOpen, setEditOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);
  const dict = useDict();
  const t = dict.income;

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

  function handleToggle() {
    startTransition(async () => {
      await toggleIncomeSourceActiveAction(source.id, !source.is_active);
    });
  }

  function handleDeleteConfirm() {
    setDeleteOpen(false);
    startTransition(async () => { await deleteIncomeSourceAction(source.id); });
  }

  return (
    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-muted)] transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Active toggle */}
      <button
        onClick={handleToggle}
        title={source.is_active ? "Deactivate" : "Activate"}
        className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 shrink-0 ${
          source.is_active ? "bg-emerald-500" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full bg-white shadow-sm mx-1 transition-transform duration-200 ${
            source.is_active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      {/* Icon */}
      <div className={`p-1.5 rounded-lg shrink-0 ${source.is_active ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"}`}>
        <TrendingUp className="w-3.5 h-3.5" />
      </div>

      {/* Name + schedule */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${source.is_active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)] line-through"}`}>
          {source.name}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {frequencyLabel[source.frequency] ?? source.frequency}
          {" · "}
          {t.startDateLabel.toLowerCase()}{" "}
          {new Date(source.start_date + "T00:00:00").toLocaleDateString()}
        </p>
      </div>

      {/* Amount */}
      <span className={`font-semibold text-sm shrink-0 tabular-nums ${source.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-muted-foreground)]"}`}>
        {formatCurrency(source.amount)}
      </span>

      {/* Frequency badge */}
      <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)] hidden sm:inline-flex shrink-0">
        {frequencyLabel[source.frequency] ?? source.frequency}
      </span>

      {/* More menu button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors shrink-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

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
            {dict.common.edit}
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-muted)] transition-colors"
            onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {dict.common.delete}
          </button>
        </div>,
        document.body
      )}

      {/* Edit dialog */}
      <IncomeForm source={source} open={editOpen} onOpenChange={setEditOpen} />

      {/* Delete confirm dialog */}
      {deleteOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40" onClick={() => setDeleteOpen(false)}>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">{t.confirmDelete}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
              &ldquo;{source.name}&rdquo;
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--color-danger)" }}
              >
                {dict.common.delete}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
