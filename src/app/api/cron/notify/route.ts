import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

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

      const total = bills.reduce((s, b) => s + b.amount, 0);
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
      const body =
        bills.length === 1
          ? `${bills[0].name} — ${formatted} due today`
          : `${bills.length} bills totaling ${formatted} due today`;

      try {
        await webpush.sendNotification(
          subscription as webpush.PushSubscription,
          JSON.stringify({
            title: "Easy Budget — Bills Due Today",
            body,
            url: "/dashboard",
          })
        );
        sent++;
      } catch {
        await supabase.from("push_subscriptions").delete().eq("user_id", user_id);
      }
    })
  );

  return NextResponse.json({ sent });
}
