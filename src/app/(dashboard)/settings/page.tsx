import { Topbar } from "@/components/layout/topbar";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SharedAccessSection } from "@/components/settings/shared-access-section";
import { AccountSwitcher } from "@/components/settings/account-switcher";
import { DangerZoneSection } from "@/components/settings/danger-zone-section";
import { ExportDataSection } from "@/components/settings/export-data-section";
import { DefaultViewSwitcher } from "@/components/settings/default-view-switcher";
import { getNotificationStatusAction, getSharedAccessDataAction, getDefaultViewAction } from "./actions";
import { getServerDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/settings/language-switcher";

export default async function SettingsPage() {
  const [{ enabled }, dict, sharedAccess, defaultView] = await Promise.all([
    getNotificationStatusAction(),
    getServerDict(),
    getSharedAccessDataAction(),
    getDefaultViewAction(),
  ]);
  const t = dict.settings;
  const ta = dict.account;

  return (
    <>
      <Topbar title={t.title} />

      <main className="flex-1 p-4 md:p-6 max-w-xl space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.notifications}
          </h2>
          <NotificationSettings initialEnabled={enabled} />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.language}
          </h2>
          <LanguageSwitcher label={t.languageDesc} updatedLabel={t.languageUpdated} />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.defaultViewLabel}
          </h2>
          <DefaultViewSwitcher initialView={defaultView} />
        </div>

        {sharedAccess && sharedAccess.accounts.length > 1 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
              {ta.switchAccountLabel}
            </h2>
            <AccountSwitcher accounts={sharedAccess.accounts} activeAccountId={sharedAccess.accountId} />
          </div>
        )}

        {sharedAccess && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
              {ta.sectionTitle}
            </h2>
            <SharedAccessSection
              members={sharedAccess.members}
              pendingInvites={sharedAccess.pendingInvites}
              currentUserId={sharedAccess.currentUserId}
            />
          </div>
        )}

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            {t.dataTitle}
          </h2>
          <ExportDataSection />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-danger)] mb-3">
            {t.dangerZoneTitle}
          </h2>
          <DangerZoneSection />
        </div>
      </main>
    </>
  );
}
