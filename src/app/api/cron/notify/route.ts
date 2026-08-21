import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDict } from "@/lib/i18n";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription")
    .eq("enabled", true);

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  await Promise.all(
    subscriptions.map(async ({ user_id, subscription }) => {
      const { data: memberships } = await supabase
        .from("account_members")
        .select("account_id")
        .eq("user_id", user_id);
      const accountIds = (memberships ?? []).map((m) => m.account_id);
      if (!accountIds.length) return;

      const { data: bills } = await supabase
        .from("bills")
        .select("name, amount")
        .in("account_id", accountIds)
        .eq("due_date", today)
        .eq("status", "pending");

      if (!bills?.length) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", user_id)
        .single();
      const dict = getDict(profile?.language ?? "en");
      const t = dict.settings;

      const total = bills.reduce((s, b) => s + b.amount, 0);
      const formatted = new Intl.NumberFormat(dict.locale, { style: "currency", currency: "USD" }).format(total);
      const body =
        bills.length === 1
          ? t.pushBodySingular.replace("{name}", bills[0].name).replace("{amount}", formatted)
          : t.pushBodyPlural.replace("{count}", String(bills.length)).replace("{amount}", formatted);

      try {
        await webpush.sendNotification(
          subscription as webpush.PushSubscription,
          JSON.stringify({
            title: t.pushTitle,
            body,
            url: "/dashboard",
          })
        );
        sent++;
      } catch (err) {
        // Only remove the subscription when the push service confirms it's
        // gone (404/410) -- a transient error (network blip, 5xx) shouldn't
        // silently and permanently disable the user's notifications.
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("user_id", user_id);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
