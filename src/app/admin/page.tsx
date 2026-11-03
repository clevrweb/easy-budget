import { Topbar } from "@/components/layout/topbar";
import { ResendConfigForm } from "@/components/admin/resend-config-form";
import { BirdConfigForm } from "@/components/admin/bird-config-form";
import { TestSmsForm } from "@/components/admin/test-sms-form";
import { UserManagementClient } from "@/components/admin/user-management-client";
import { getAdminConfigAction, listAllUsersAction } from "./actions";
import { getServerDict } from "@/lib/i18n/server";
import { signOutAction } from "@/lib/supabase/actions";
import { LogOut } from "lucide-react";

export default async function AdminPage() {
  const [dict, config, users] = await Promise.all([getServerDict(), getAdminConfigAction(), listAllUsersAction()]);
  const t = dict.admin;

  return (
    <>
      <Topbar title={t.title}>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {dict.nav.signOut}
          </button>
        </form>
      </Topbar>

      <main className="p-4 md:p-6 max-w-xl space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.resendSectionTitle}
          </h2>
          <ResendConfigForm initialApiKey={config.resend.apiKey} initialFromEmail={config.resend.fromEmail} />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.birdSectionTitle}
          </h2>
          <BirdConfigForm initialApiKey={config.bird.apiKey} initialFrom={config.bird.from} />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.testSmsSectionTitle}
          </h2>
          <TestSmsForm />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.usersSectionTitle}
          </h2>
          <p className="text-xs text-[var(--color-muted-foreground)] mb-3">{t.usersSectionDesc}</p>
          <UserManagementClient initialUsers={users} />
        </div>
      </main>
    </>
  );
}
