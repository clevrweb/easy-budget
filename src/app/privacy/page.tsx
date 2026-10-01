import Link from "next/link";
import { AppLogo } from "@/components/app-logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-background)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <AppLogo size={40} className="w-9 h-9 rounded-lg" />
          <span className="text-lg font-bold text-[var(--color-foreground)]">Budget Whisperer</span>
        </div>

        <h1 className="text-2xl font-semibold text-[var(--color-foreground)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-8">Last updated: October 2026</p>

        <div className="space-y-6 text-sm leading-6 text-[var(--color-foreground)]">
          <section>
            <h2 className="font-semibold mb-1">What we collect</h2>
            <p className="text-[var(--color-muted-foreground)]">
              To provide the budgeting features of Budget Whisperer, we collect the account information you provide
              when you sign up (name and email address) and the financial data you choose to enter into the app,
              such as bills, income sources, budget categories, groups, and debts.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">How we use it</h2>
            <p className="text-[var(--color-muted-foreground)]">
              Your data is used solely to operate the app for you: displaying your bills and budgets, calculating
              totals, and sending the optional reminders you enable. We do not sell your data, and we do not share
              it with third parties for advertising or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">Where it&apos;s stored</h2>
            <p className="text-[var(--color-muted-foreground)]">
              Your data is stored with Supabase, our database and authentication provider, which acts strictly as a
              data processor on our behalf. Access to your data is protected by row-level security so that only you
              (and anyone you explicitly invite to share a budget with) can read or modify it.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">Your choices</h2>
            <p className="text-[var(--color-muted-foreground)]">
              You can export your data at any time from Settings → Data &amp; Privacy. You can delete your account
              and all associated data at any time from the same page, or by contacting us at the email below.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">Contact</h2>
            <p className="text-[var(--color-muted-foreground)]">
              Questions about this policy or your data? Contact us at{" "}
              <a href="mailto:support@budgetwhisperer.com" className="text-[var(--color-primary)] hover:underline">
                support@budgetwhisperer.com
              </a>
              .
            </p>
          </section>
        </div>

        <Link href="/login" className="inline-block mt-10 text-sm font-medium text-[var(--color-primary)] hover:underline">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
