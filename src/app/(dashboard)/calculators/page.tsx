import Link from "next/link";
import { LineChart, History, Percent, TrendingDown, PiggyBank, Landmark } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { getServerDict } from "@/lib/i18n/server";

export default async function CalculatorsHubPage() {
  const dict = await getServerDict();
  const t = dict.calculators;

  const cards = [
    { href: "/calculators/stock-backtest", icon: History, title: t.cardStockBacktestTitle, desc: t.cardStockBacktestDesc },
    { href: "/calculators/stock-projection", icon: LineChart, title: t.cardStockProjectionTitle, desc: t.cardStockProjectionDesc },
    { href: "/calculators/compound", icon: Percent, title: t.cardCompoundTitle, desc: t.cardCompoundDesc },
    { href: "/calculators/debt-payoff", icon: TrendingDown, title: t.cardDebtPayoffTitle, desc: t.cardDebtPayoffDesc },
    { href: "/calculators/retirement", icon: PiggyBank, title: t.cardRetirementTitle, desc: t.cardRetirementDesc },
    { href: "/calculators/loan", icon: Landmark, title: t.cardLoanTitle, desc: t.cardLoanDesc },
  ];

  return (
    <>
      <Topbar title={t.hubTitle} />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-2xl">{t.hubDescription}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 p-5 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-primary)]/10 border-2 border-[var(--color-primary)]">
                <Icon className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--color-foreground)]">{title}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
