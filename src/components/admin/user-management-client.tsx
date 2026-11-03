"use client";

import { useState, useTransition, useMemo } from "react";
import { Search, Trash2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { listAllUsersAction, hardDeleteUserAction, type AdminUserRow } from "@/app/admin/actions";
import { useDict } from "@/components/language-provider";
import { formatDate } from "@/lib/utils";

interface UserManagementClientProps {
  initialUsers: AdminUserRow[];
}

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const dict = useDict();
  const t = dict.admin;
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<AdminUserRow | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));
  }, [users, query]);

  async function refresh() {
    setUsers(await listAllUsersAction());
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setTarget(null);
      setConfirmEmail("");
      setError(null);
    }
  }

  function handleDelete() {
    if (!target) return;
    setError(null);
    startDelete(async () => {
      const result = await hardDeleteUserAction(target.id, confirmEmail);
      if (result?.error === "email_mismatch") setError(t.deleteErrorMismatch);
      else if (result?.error === "self") setError(t.deleteErrorSelf);
      else if (result?.error === "superadmin") setError(t.deleteErrorSuperadmin);
      else if (result?.error) setError(t.deleteErrorGeneric);
      else {
        closeDialog(false);
        await refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)] text-center py-8">{t.noResults}</p>
      ) : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-[var(--color-foreground)] truncate">{u.email}</p>
                  {u.isSuperadmin && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <ShieldCheck className="w-3 h-3" /> {t.superadminBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {u.fullName || "—"} · {t.colJoined} {formatDate(u.createdAt.split("T")[0])} · {u.accountCount} {t.colAccounts}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                onClick={() => setTarget(u)}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t.deleteButton}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteButton} {target?.email}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">{t.deleteWarning}</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-user-email">{t.deleteConfirmLabel}</Label>
              <Input
                id="confirm-user-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={isDeleting || !confirmEmail}
                onClick={handleDelete}
              >
                {isDeleting ? t.deleting : t.deleteConfirmButton}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">{dict.common.cancel}</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
