"use client";

import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const FREQUENCIES = [
  { value: "monthly", label: "Monthly", hint: "Once a month on the due date" },
  { value: "weekly",  label: "Weekly",  hint: "Once a week on the same weekday" },
  { value: "yearly",  label: "Yearly",  hint: "Once a year on the same date" },
];

function preview(frequency: string, dueDay: number, dueDate: string) {
  if (frequency === "monthly") return `Every month on the ${ordinal(dueDay)}`;
  if (frequency === "weekly") {
    const day = dueDate ? new Date(dueDate + "T00:00:00").toLocaleString("en-US", { weekday: "long" }) : "selected day";
    return `Every week on ${day}`;
  }
  if (frequency === "yearly") {
    const label = dueDate ? new Date(dueDate + "T00:00:00").toLocaleString("en-US", { month: "long", day: "numeric" }) : "the same date";
    return `Every year on ${label}`;
  }
  return "";
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
  const hint = FREQUENCIES.find((f) => f.value === frequency)?.hint ?? "";
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
          This is a recurring bill
        </div>
      </button>

      {enabled && (
        <div className="space-y-4 pl-1">
          {/* Frequency */}
          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <select
              name="frequency"
              value={frequency}
              onChange={(e) => onFrequency(e.target.value)}
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
              <Label htmlFor="due_day">Day of month</Label>
              <Input
                id="due_day"
                name="due_day"
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => onDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Day the bill is due (1–31). Defaults to the day of the Due Date above.
              </p>
            </div>
          )}

          {/* Ends */}
          <div className="space-y-2">
            <Label>Ends</Label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="ends_type"
                value="never"
                checked={endsType === "never"}
                onChange={() => onEndsType("never")}
                className="accent-[var(--color-primary)] w-4 h-4"
              />
              <span className="text-sm text-[var(--color-foreground)]">Never (open-ended series)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="ends_type"
                value="date"
                checked={endsType === "date"}
                onChange={() => onEndsType("date")}
                className="accent-[var(--color-primary)] w-4 h-4"
              />
              <span className="text-sm text-[var(--color-foreground)] shrink-0">On date</span>
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
              <input
                type="radio"
                name="ends_type"
                value="count"
                checked={endsType === "count"}
                onChange={() => onEndsType("count")}
                className="accent-[var(--color-primary)] w-4 h-4"
              />
              <span className="text-sm text-[var(--color-foreground)] shrink-0">After</span>
              <input
                type="number"
                name="end_count"
                min={1}
                value={endCount}
                onChange={(e) => onEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={endsType !== "count"}
                className="w-16 h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] text-center disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
              <span className="text-sm text-[var(--color-foreground)]">occurrences</span>
            </label>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium" style={{ backgroundColor: "#4f46e510", color: "var(--color-primary)" }}>
            {previewText}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            Saving will create a recurring template and auto-schedule bills. Use{" "}
            <strong>Recurring → Generate</strong> to extend further into the future.
          </p>
        </div>
      )}
    </div>
  );
}
