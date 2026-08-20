import { createClient } from "@/lib/supabase/server";
import { selectAccountAction } from "@/lib/supabase/account-actions";
import { getServerDict } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

interface MembershipRow {
  accounts: { id: string; name: string; is_personal: boolean; created_by: string | null } | null;
}

export default async function ChooseAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dict = await getServerDict();
  const t = dict.account;

  const { data: memberships } = await supabase
    .from("account_members")
    .select("accounts(id, name, is_personal, created_by)")
    .eq("user_id", user.id);

  const accounts = ((memberships ?? []) as unknown as MembershipRow[])
    .map((m) => m.accounts)
    .filter((a): a is NonNullable<MembershipRow["accounts"]> => a !== null)
    .map((a) => ({ id: a.id, name: a.name, is_personal: a.is_personal && a.created_by === user.id }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M16 6L10 12H13V21H10L16 27L22 21H19V12H22L16 6Z" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[var(--color-foreground)]">Easy Budget</span>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-1">{t.chooseAccountTitle}</h1>
          <p className="text-[var(--color-muted-foreground)] text-sm">{t.chooseAccountSubtitle}</p>
        </div>

        <div className="space-y-3">
          {accounts.map((account) => (
            <form key={account.id} action={selectAccountAction.bind(null, account.id)}>
              <button
                type="submit"
                className="w-full text-left bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)] transition-colors"
              >
                <p className="font-semibold text-[var(--color-foreground)]">
                  {account.is_personal ? t.personalAccountLabel : account.name || t.sharedAccountLabel}
                </p>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
