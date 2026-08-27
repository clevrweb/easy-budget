"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { SnowballPlan } from "@/lib/debt-snowball";

const COLORS = ["#4f46e5", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#7c3aed", "#dc2626", "#0284c7"];

interface DebtPayoffChartProps {
  plan: SnowballPlan;
}

function monthLabel(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleString("en-US", { month: "short", year: "2-digit" });
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-[var(--color-foreground)] mb-2">{label}</p>
      {[...payload].reverse().map((p) => (
        p.value > 0 && (
          <div key={p.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(p.value)}</span>
          </div>
        )
      ))}
      <div className="flex items-center justify-between gap-6 mt-1 pt-1 border-t border-[var(--color-border)]">
        <span className="text-[var(--color-muted-foreground)]">Total</span>
        <span className="font-semibold text-[var(--color-foreground)]">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export function DebtPayoffChart({ plan }: DebtPayoffChartProps) {
  if (plan.capped || plan.monthlyTimeline.length === 0 || plan.debts.length === 0) return null;

  const data = plan.monthlyTimeline.map((snap) => ({
    label: monthLabel(snap.date),
    ...snap.remainingBalances,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "var(--color-muted-foreground)" }} />
        {plan.debts.map((d, i) => (
          <Area
            key={d.id}
            type="monotone"
            dataKey={d.id}
            name={d.name}
            stackId="1"
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.55}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
