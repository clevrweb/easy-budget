interface StatCardProps {
  label: string;
  value: string;
  colorClass?: string;
}

export function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
      <p className="text-xs text-[var(--color-muted-foreground)] mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colorClass ?? "text-[var(--color-foreground)]"}`}>{value}</p>
    </div>
  );
}
