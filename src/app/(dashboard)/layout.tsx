import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PendingInviteBanner } from "@/components/layout/pending-invite-banner";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  interface PendingInviteRow {
    id: string;
    account_id: string;
    accounts: { name: string; is_personal: boolean }[] | { name: string; is_personal: boolean } | null;
  }

  const { data: pendingInviteRows } = user?.email
    ? await supabase
        .from("account_invites")
        .select("id, account_id, accounts(name, is_personal)")
        .eq("status", "pending")
        .eq("email", user.email.toLowerCase())
    : { data: null };

  const pendingInvites = ((pendingInviteRows ?? []) as unknown as PendingInviteRow[]).map((row) => ({
    id: row.id,
    account_id: row.account_id,
    accounts: Array.isArray(row.accounts) ? (row.accounts[0] ?? null) : row.accounts,
  }));

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {pendingInvites.length > 0 && (
          <PendingInviteBanner invites={pendingInvites} />
        )}
        {children}
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
