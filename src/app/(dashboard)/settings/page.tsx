import { Topbar } from "@/components/layout/topbar";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { getNotificationStatusAction } from "./actions";
import { getServerDict } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/settings/language-switcher";

export default async function SettingsPage() {
  const [{ enabled }, dict] = await Promise.all([
    getNotificationStatusAction(),
    getServerDict(),
  ]);
  const t = dict.settings;

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
      </main>
    </>
  );
}
