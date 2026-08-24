import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDict } from "@/lib/i18n";
import { getResendClient, getEmailFrom } from "@/lib/email/resend";
import { billReminderEmail } from "@/lib/email/templates";
import { sendSms } from "@/lib/sms/bird";

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
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://budgetwhisperer.com";

  const { data: dueBills } = await supabase
    .from("bills")
    .select("account_id, name, amount")
    .eq("due_date", today)
    .eq("status", "pending");

  if (!dueBills?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const billsByAccount = new Map<string, { name: string; amount: number }[]>();
  for (const bill of dueBills) {
    const list = billsByAccount.get(bill.account_id) ?? [];
    list.push({ name: bill.name, amount: bill.amount });
    billsByAccount.set(bill.account_id, list);
  }

  const { data: memberRows } = await supabase
    .from("account_members")
    .select("account_id, user_id")
    .in("account_id", Array.from(billsByAccount.keys()));

  const billsByUser = new Map<string, { name: string; amount: number }[]>();
  for (const member of memberRows ?? []) {
    const accountBills = billsByAccount.get(member.account_id);
    if (!accountBills) continue;
    const list = billsByUser.get(member.user_id) ?? [];
    billsByUser.set(member.user_id, [...list, ...accountBills]);
  }

  let sent = 0;

  await Promise.all(
    Array.from(billsByUser.entries()).map(async ([userId, bills]) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("language, notification_channel, phone_number")
        .eq("user_id", userId)
        .single();

      const dict = getDict(profile?.language ?? "en");
      const t = dict.settings;

      const total = bills.reduce((s, b) => s + b.amount, 0);
      const formatted = new Intl.NumberFormat(dict.locale, { style: "currency", currency: "USD" }).format(total);
      const body =
        bills.length === 1
          ? t.pushBodySingular.replace("{name}", bills[0].name).replace("{amount}", formatted)
          : t.pushBodyPlural.replace("{count}", String(bills.length)).replace("{amount}", formatted);

      const channel = profile?.notification_channel ?? "push";

      if (channel === "email") {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const email = userData.user?.email;
        if (!email) return;

        const [resend, from] = await Promise.all([getResendClient(), getEmailFrom()]);
        const { subject, html } = billReminderEmail(dict, body, `${origin}/dashboard`);
        const { error } = await resend.emails.send({ from, to: email, subject, html });
        if (!error) sent++;
        return;
      }

      if (channel === "sms") {
        if (!profile?.phone_number) return;
        const result = await sendSms(profile.phone_number, `${t.pushTitle}: ${body}`);
        if (result.success) sent++;
        return;
      }

      const { data: subscription } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", userId)
        .eq("enabled", true)
        .single();
      if (!subscription) return;

      try {
        await webpush.sendNotification(
          subscription.subscription as webpush.PushSubscription,
          JSON.stringify({ title: t.pushTitle, body, url: "/dashboard" })
        );
        sent++;
      } catch (err) {
        // Only remove the subscription when the push service confirms it's
        // gone (404/410) -- a transient error (network blip, 5xx) shouldn't
        // silently and permanently disable the user's notifications.
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("user_id", userId);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
