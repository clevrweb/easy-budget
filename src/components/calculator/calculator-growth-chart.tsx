"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { TimelinePoint } from "@/lib/compound-calculator";

interface CalculatorGrowthChartProps {
  timeline: TimelinePoint[];
}

function monthLabel(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export function CalculatorGrowthChart({ timeline }: CalculatorGrowthChartProps) {
  const data = timeline.map((p) => ({ label: monthLabel(p.date), value: p.value }));

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          width={60}
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
        />
        <Area type="monotone" dataKey="value" name="Value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
