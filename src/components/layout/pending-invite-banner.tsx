"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction, declineInviteAction } from "@/app/(dashboard)/actions";
import { useDict } from "@/components/language-provider";

interface Invite {
  id: string;
  account_id: string;
  accounts: { name: string; is_personal: boolean } | null;
}

interface PendingInviteBannerProps {
  invites: Invite[];
}

export function PendingInviteBanner({ invites }: PendingInviteBannerProps) {
  const dict = useDict();
  const t = dict.account;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept(id: string) {
    startTransition(async () => {
      await acceptInviteAction(id);
      router.refresh();
    });
  }

  function handleDecline(id: string) {
    startTransition(async () => {
      await declineInviteAction(id);
      router.refresh();
    });
  }

  return (
    <div className="mx-4 mt-4 md:mx-6 space-y-2">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--color-primary)]/30 bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
        >
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            {t.pendingInviteBannerTitle}
            {invite.accounts?.name ? ` — ${invite.accounts.name}` : ""}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAccept(invite.id)}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isPending ? t.acceptingInvite : t.acceptInvite}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecline(invite.id)}
              className="h-8 px-3 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-40"
            >
              {isPending ? t.decliningInvite : t.declineInvite}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
