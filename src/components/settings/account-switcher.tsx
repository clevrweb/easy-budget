"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { selectAccountAction, renameAccountAction } from "@/lib/supabase/account-actions";
import { Input } from "@/components/ui/input";
import { useDict } from "@/components/language-provider";

interface AccountOption {
  id: string;
  name: string;
  is_personal: boolean;
}

interface AccountSwitcherProps {
  accounts: AccountOption[];
  activeAccountId: string;
}

export function AccountSwitcher({ accounts, activeAccountId }: AccountSwitcherProps) {
  const dict = useDict();
  const t = dict.account;
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(accounts.map((a) => [a.id, a.name]))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  if (accounts.length < 2) return null;

  function startEditing(account: AccountOption) {
    setEditingId(account.id);
    setDraft(names[account.id] ?? account.name);
  }

  function saveRename(accountId: string) {
    const trimmed = draft.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await renameAccountAction(accountId, trimmed);
      if (result?.success) {
        setNames((prev) => ({ ...prev, [accountId]: trimmed }));
        setEditingId(null);
      }
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-2">
      {accounts.map((account) => {
        const isCurrent = account.id === activeAccountId;
        const isEditing = editingId === account.id;

        if (isEditing) {
          return (
            <div key={account.id} className="flex items-center gap-2 px-1 py-1">
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename(account.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="h-9"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() => saveRename(account.id)}
                aria-label={t.renameSave}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setEditingId(null)}
                aria-label={dict.common.cancel}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }

        return (
          <div
            key={account.id}
            className={`flex items-center gap-2 rounded-lg transition-colors ${
              isCurrent ? "bg-[var(--color-muted)]" : "hover:bg-[var(--color-muted)]"
            }`}
          >
            <form action={selectAccountAction.bind(null, account.id)} className="flex-1 min-w-0">
              <button
                type="submit"
                disabled={isCurrent}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left disabled:cursor-default"
              >
                <span className="truncate text-[var(--color-foreground)]">
                  {names[account.id] ?? account.name}
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {account.is_personal ? t.typePersonal : t.typeShared}
                </span>
                {isCurrent && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white">
                    {t.currentAccountBadge}
                  </span>
                )}
              </button>
            </form>
            <button
              type="button"
              onClick={() => startEditing(account)}
              aria-label={t.renameBudget}
              className="shrink-0 w-8 h-8 mr-1 flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
