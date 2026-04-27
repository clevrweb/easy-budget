import { Topbar } from "@/components/layout/topbar";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { getNotificationStatusAction } from "./actions";

export default async function SettingsPage() {
  const { enabled } = await getNotificationStatusAction();

  return (
    <>
      <Topbar title="Settings" />

      <main className="flex-1 p-4 md:p-6 max-w-xl space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            Notifications
          </h2>
          <NotificationSettings initialEnabled={enabled} />
        </div>
      </main>
    </>
  );
}
