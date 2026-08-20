"use client";

import { selectAccountAction } from "@/lib/supabase/account-actions";
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

  if (accounts.length < 2) return null;

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-2">
      {accounts.map((account) => {
        const isCurrent = account.id === activeAccountId;
        return (
          <form key={account.id} action={selectAccountAction.bind(null, account.id)}>
            <button
              type="submit"
              disabled={isCurrent}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                isCurrent
                  ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {account.is_personal ? t.personalAccountLabel : account.name || t.sharedAccountLabel}
              {isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white">
                  {t.currentAccountBadge}
                </span>
              )}
            </button>
          </form>
        );
      })}
    </div>
  );
}
