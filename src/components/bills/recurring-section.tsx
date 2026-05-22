"use client";

import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/language-provider";

const selectCls = "flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export type EndsType = "never" | "date" | "count";

interface RecurringSectionProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  frequency: string;
  onFrequency: (v: string) => void;
  dueDay: number;
  onDueDay: (v: number) => void;
  dueDate: string;
  endsType: EndsType;
  onEndsType: (v: EndsType) => void;
  endDate: string;
  onEndDate: (v: string) => void;
  endCount: number;
  onEndCount: (v: number) => void;
}

export function RecurringSection({
  enabled, onToggle,
  frequency, onFrequency,
  dueDay, onDueDay,
  dueDate,
  endsType, onEndsType,
  endDate, onEndDate,
  endCount, onEndCount,
}: RecurringSectionProps) {
  const dict = useDict();
  const r = dict.recurring;

  const FREQUENCIES = [
    { value: "monthly", label: r.monthly, hint: r.monthlyHint },
    { value: "weekly",  label: r.weekly,  hint: r.weeklyHint  },
    { value: "yearly",  label: r.yearly,  hint: r.yearlyHint  },
  ];

  const hint = FREQUENCIES.find((f) => f.value === frequency)?.hint ?? "";

  function preview(freq: string, day: number, date: string) {
    if (freq === "monthly") {
      return `${r.previewMonthlyPrefix} ${r.useOrdinal ? ordinal(day) : day}`;
    }
    if (freq === "weekly") {
      const weekday = date
        ? new Date(date + "T00:00:00").toLocaleString(dict.locale, { weekday: "long" })
        : "—";
      if (day <= 1) return `${r.previewWeeklyPrefix} ${weekday}`;
      return `${r.previewWeeklyNWeeksOn.replace("{n}", String(day))} ${weekday}`;
    }
    if (freq === "yearly") {
      const label = date
        ? new Date(date + "T00:00:00").toLocaleString(dict.locale, { month: "long", day: "numeric" })
        : "—";
      return `${r.previewYearlyPrefix} ${label}`;
    }
    return "";
  }

  const previewText = preview(frequency, dueDay, dueDate);

  return (
    <div className="border-t border-[var(--color-border)] pt-3 space-y-4">
      {/* Toggle row */}
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className="flex items-center gap-3 w-full group"
      >
        <div className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted-foreground)]/30"}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "left-5" : "left-1"}`} />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
          <RefreshCw className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          {r.toggleLabel}
        </div>
      </button>

      {enabled && (
        <div className="space-y-4 pl-1">
          {/* Frequency */}
          <div className="space-y-1.5">
            <Label>{r.recurrence}</Label>
            <select
              name="frequency"
              value={frequency}
              onChange={(e) => {
                const next = e.target.value;
                onFrequency(next);
                if (next === "weekly") onDueDay(1);
                else if (next === "monthly" && dueDate) onDueDay(new Date(dueDate + "T00:00:00").getDate());
              }}
              className={selectCls}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
          </div>

          {/* Day of month (monthly only) */}
          {frequency === "monthly" && (
            <div className="space-y-1.5">
              <Label htmlFor="due_day">{r.dayOfMonth}</Label>
              <Input
                id="due_day"
                name="due_day"
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => onDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">{r.dayOfMonthHint}</p>
            </div>
          )}

          {/* Week interval (weekly only) */}
          {frequency === "weekly" && (
            <div className="space-y-1.5">
              <Label htmlFor="due_day">{r.weekIntervalLabel}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="due_day"
                  name="due_day"
                  type="number"
                  min={1}
                  max={52}
                  value={dueDay}
                  onChange={(e) => onDueDay(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                  className="w-24"
                />
                <span className="text-sm text-[var(--color-muted-foreground)]">{r.weekIntervalUnit}</span>
              </div>
            </div>
          )}

          {/* Ends */}
          <div className="space-y-2">
            <Label>{r.ends}</Label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="ends_type" value="never" checked={endsType === "never"} onChange={() => onEndsType("never")} className="accent-[var(--color-primary)] w-4 h-4" />
              <span className="text-sm text-[var(--color-foreground)]">{r.never}</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="ends_type" value="date" checked={endsType === "date"} onChange={() => onEndsType("date")} className="accent-[var(--color-primary)] w-4 h-4" />
              <span className="text-sm text-[var(--color-foreground)] shrink-0">{r.onDate}</span>
              <input
                type="date"
                name="end_date"
                value={endDate}
                onChange={(e) => onEndDate(e.target.value)}
                disabled={endsType !== "date"}
                className="h-8 flex-1 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="ends_type" value="count" checked={endsType === "count"} onChange={() => onEndsType("count")} className="accent-[var(--color-primary)] w-4 h-4" />
              <span className="text-sm text-[var(--color-foreground)] shrink-0">{r.after}</span>
              <input
                type="number"
                name="end_count"
                min={1}
                value={endCount}
                onChange={(e) => onEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={endsType !== "count"}
                className="w-16 h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] text-center disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
              <span className="text-sm text-[var(--color-foreground)]">{r.occurrences}</span>
            </label>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium" style={{ backgroundColor: "#4f46e510", color: "var(--color-primary)" }}>
            {previewText}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{r.savingNote}</p>
        </div>
      )}
    </div>
  );
}
