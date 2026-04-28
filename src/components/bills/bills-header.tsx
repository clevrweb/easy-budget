"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Calendar, X } from "lucide-react";
import { useDict } from "@/components/language-provider";

export type ViewMode = "day" | "week" | "month" | "all";
export type StatusFilter = "all" | "pending" | "paid" | "overdue";
export type GroupBy = "group" | "day";

interface BillsHeaderProps {
  view: ViewMode;
  date: string;
  status: StatusFilter;
  search: string;
  groupBy?: GroupBy;
  basePath?: string;
}

function getMondayOf(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split("T")[0];
}

function todayDateFor(v: ViewMode) {
  const now = new Date();
  if (v === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (v === "week")  return getMondayOf(now);
  if (v === "day")   return now.toISOString().split("T")[0];
  return "";
}

export function BillsHeader({ view, date, status, search, groupBy = "group", basePath = "/bills" }: BillsHeaderProps) {
  const router = useRouter();
  const dict = useDict();
  const [searchOpen, setSearchOpen]   = useState(!!search);
  const [filterOpen, setFilterOpen]   = useState(status !== "all");
  const [searchValue, setSearchValue] = useState(search);

  const VIEWS: { label: string; value: ViewMode }[] = [
    { label: dict.bills.day,   value: "day"   },
    { label: dict.bills.week,  value: "week"  },
    { label: dict.bills.month, value: "month" },
    { label: dict.bills.all,   value: "all"   },
  ];

  const STATUSES: { label: string; value: StatusFilter }[] = [
    { label: dict.bills.all,     value: "all"     },
    { label: dict.bills.pending, value: "pending" },
    { label: dict.bills.paid,    value: "paid"    },
    { label: dict.bills.overdue, value: "overdue" },
  ];

  function push(overrides: Partial<{ view: ViewMode; date: string; status: StatusFilter; q: string; groupBy: GroupBy }>) {
    const params = new URLSearchParams();
    const v = overrides.view    ?? view;
    const d = overrides.date    ?? date;
    const s = overrides.status  ?? status;
    const q = overrides.q       ?? search;
    const g = overrides.groupBy ?? groupBy;
    params.set("view", v);
    if (d) params.set("date", d);
    if (s && s !== "all") params.set("status", s);
    if (q) params.set("q", q);
    if (v === "week" && g === "day") params.set("groupBy", "day");
    router.push(`${basePath}?${params.toString()}`);
  }

  function changeView(v: ViewMode) {
    push({ view: v, date: todayDateFor(v), groupBy: "group" });
  }

  function goToPrev() {
    if (view === "month") {
      const [y, m] = date.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` });
    } else if (view === "week") {
      const d = new Date(date + "T00:00:00");
      d.setDate(d.getDate() - 7);
      push({ date: d.toISOString().split("T")[0] });
    } else if (view === "day") {
      const d = new Date(date + "T00:00:00");
      d.setDate(d.getDate() - 1);
      push({ date: d.toISOString().split("T")[0] });
    }
  }

  function goToNext() {
    if (view === "month") {
      const [y, m] = date.split("-").map(Number);
      const d = new Date(y, m, 1);
      push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` });
    } else if (view === "week") {
      const d = new Date(date + "T00:00:00");
      d.setDate(d.getDate() + 7);
      push({ date: d.toISOString().split("T")[0] });
    } else if (view === "day") {
      const d = new Date(date + "T00:00:00");
      d.setDate(d.getDate() + 1);
      push({ date: d.toISOString().split("T")[0] });
    }
  }

  function getLabel() {
    if (view === "all") return dict.bills.allTime;
    if (view === "month") {
      const [y, m] = date.split("-").map(Number);
      return new Date(y, m - 1).toLocaleString(dict.locale, { month: "long", year: "numeric" });
    }
    if (view === "day") {
      return new Date(date + "T00:00:00").toLocaleString(dict.locale, { month: "long", day: "numeric", year: "numeric" });
    }
    if (view === "week") {
      const start = new Date(date + "T00:00:00");
      const end   = new Date(date + "T00:00:00");
      end.setDate(end.getDate() + 6);
      const s = start.toLocaleString(dict.locale, { month: "short", day: "numeric" });
      const e = end.toLocaleString(dict.locale,   { month: "short", day: "numeric", year: "numeric" });
      return `${s} – ${e}`;
    }
    return date;
  }

  return (
    <div className="space-y-2.5">
      {/* Row 1: view tabs + icons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => changeView(v.value)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === v.value
                  ? "text-[var(--color-primary)] font-semibold underline underline-offset-4"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const next = !searchOpen;
              setSearchOpen(next);
              if (!next && search) push({ q: "" });
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              searchOpen
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const next = !filterOpen;
              setFilterOpen(next);
              if (!next && status !== "all") push({ status: "all" });
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              filterOpen || status !== "all"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: date navigator */}
      {view !== "all" && (
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-foreground)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0" />
            <span>{getLabel()}</span>
          </div>

          <button
            onClick={goToNext}
            className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => push({ date: todayDateFor(view) })}
            className="h-8 px-3 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors shrink-0"
          >
            {dict.bills.todayBtn}
          </button>
        </div>
      )}

      {/* Week groupBy toggle */}
      {view === "week" && (
        <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden text-xs font-medium w-fit">
          <button
            onClick={() => push({ groupBy: "group" })}
            className={`px-3 py-1.5 transition-colors ${groupBy !== "day" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"}`}
          >
            {dict.bills.byGroup}
          </button>
          <button
            onClick={() => push({ groupBy: "day" })}
            className={`px-3 py-1.5 transition-colors ${groupBy === "day" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"}`}
          >
            {dict.bills.byDay}
          </button>
        </div>
      )}

      {/* Search input */}
      {searchOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)] pointer-events-none" />
          <input
            autoFocus
            type="text"
            placeholder={dict.bills.searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && push({ q: searchValue })}
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); push({ q: "" }); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Status filter pills */}
      {filterOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{dict.bills.statusPrefix}</span>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => push({ status: s.value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                status === s.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
