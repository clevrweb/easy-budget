import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PendingInviteBanner } from "@/components/layout/pending-invite-banner";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pendingInvites } = user?.email
    ? await supabase
        .from("account_invites")
        .select("id, account_id, accounts(name, is_personal)")
        .eq("status", "pending")
        .eq("email", user.email.toLowerCase())
    : { data: null };

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {pendingInvites && pendingInvites.length > 0 && (
          <PendingInviteBanner invites={pendingInvites} />
        )}
        {children}
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
