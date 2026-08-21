"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { deleteMyAccountAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";

export function DangerZoneSection() {
  const dict = useDict();
  const t = dict.settings;
  const tc = dict.common;
  const [isDeleting, startDelete] = useTransition();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteMyAccountAction(confirmEmail);
      if (result?.error === "email_mismatch") setDeleteError(t.deleteAccountErrorMismatch);
      else if (result?.error) setDeleteError(t.deleteAccountErrorGeneric);
      // On success the action redirects to /login itself.
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-danger)]/30 p-5 space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.deleteAccountWarning}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.deleteAccountSharedWarning}</p>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setConfirmEmail(""); setDeleteError(null); } }}>
        <DialogTrigger asChild>
          <Button type="button" variant="destructive">
            {t.deleteAccountButton}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteAccountButton}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-[var(--color-muted-foreground)] mb-1">{t.deleteAccountWarning}</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">{t.deleteAccountSharedWarning}</p>

          {deleteError && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-[var(--color-danger)]">
              {deleteError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-email">{t.deleteAccountConfirmLabel}</Label>
              <Input
                id="confirm-email"
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
                {isDeleting ? t.deletingAccount : t.deleteAccountConfirmButton}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">{tc.cancel}</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
