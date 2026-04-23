"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface MonthlyDataPoint {
  month: string;
  paid: number;
  pending: number;
  overdue: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-[var(--color-foreground)] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-[var(--color-foreground)]">
            ${p.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function MonthlyChart({ data }: { data: MonthlyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "var(--color-muted-foreground)" }}
        />
        <Bar dataKey="paid" name="Paid" fill="#4caf50" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="pending" name="Pending" fill="#ff9800" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="overdue" name="Overdue" fill="#f44336" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
