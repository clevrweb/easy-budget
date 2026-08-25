"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteToAccountAction, revokeInviteAction, removeMemberAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";

interface Member {
  userId: string;
  email: string;
}

interface PendingInvite {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface SharedAccessSectionProps {
  members: Member[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
}

export function SharedAccessSection({ members: initialMembers, pendingInvites: initialPendingInvites, currentUserId }: SharedAccessSectionProps) {
  const dict = useDict();
  const t = dict.account;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [members, setMembers] = useState(initialMembers);
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);

  function handleInvite() {
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      const result = await inviteToAccountAction(formData);

      if (result?.error) {
        const errorMap: Record<string, string> = {
          invalid_email: t.inviteErrorInvalidEmail,
          self: t.inviteErrorSelf,
          already_pending: t.inviteErrorAlreadyPending,
          generic: t.inviteErrorGeneric,
        };
        setMessage({ text: errorMap[result.error] ?? t.inviteErrorGeneric, isError: true });
        return;
      }

      setMessage({
        text: result?.mode === "existing_user" ? t.inviteSentExisting : t.inviteSentNew,
        isError: false,
      });
      setEmail("");
      router.refresh();
    });
  }

  function handleRevoke(inviteId: string) {
    if (!confirm(t.revokeConfirm)) return;
    startTransition(async () => {
      const result = await revokeInviteAction(inviteId);
      if (!result?.error) {
        setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      }
    });
  }

  function handleRemoveMember(userId: string) {
    if (!confirm(t.removeMemberConfirm)) return;
    startTransition(async () => {
      const result = await removeMemberAction(userId);
      if (!result?.error) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      }
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.sectionDesc}</p>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">{t.membersTitle}</p>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.userId} className="text-sm text-[var(--color-foreground)] flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                {m.email}
                {m.userId === currentUserId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                    {t.memberYou}
                  </span>
                )}
              </span>
              {m.userId !== currentUserId && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemoveMember(m.userId)}
                  className="text-xs font-medium text-[var(--color-danger)] hover:underline disabled:opacity-40"
                >
                  {t.removeMember}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">{t.pendingInvitesTitle}</p>
          <ul className="space-y-1.5">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="text-sm flex items-center justify-between gap-2">
                <span className="text-[var(--color-foreground)]">{invite.email}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRevoke(invite.id)}
                  className="text-xs font-medium text-[var(--color-danger)] hover:underline disabled:opacity-40"
                >
                  {t.revokeInvite}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {t.inviteEmailLabel}
        </label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t.inviteEmailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
          <Button type="button" onClick={handleInvite} disabled={isPending || !email}>
            {isPending ? t.inviteSending : t.inviteButton}
          </Button>
        </div>
        {message && (
          <p className={`text-xs ${message.isError ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
