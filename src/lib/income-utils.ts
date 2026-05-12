import type { IncomeSource } from "@/types/database";

export interface IncomeOccurrence {
  source: IncomeSource;
  date: string;
  amount: number;
}

export interface IncomeSourceSummary {
  source: IncomeSource;
  count: number;
  total: number;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getIncomeOccurrences(
  sources: IncomeSource[],
  startDate: string,
  endDate: string
): IncomeOccurrence[] {
  const occurrences: IncomeOccurrence[] = [];
  const rangeStart = parseLocalDate(startDate);
  const rangeEnd = parseLocalDate(endDate);

  for (const source of sources) {
    if (!source.is_active) continue;

    const srcStart = parseLocalDate(source.start_date);
    if (srcStart > rangeEnd) continue;

    if (source.frequency === "weekly" || source.frequency === "biweekly") {
      const stepDays = source.frequency === "weekly" ? 7 : 14;
      const msStep = stepDays * 24 * 3600 * 1000;
      const msDiff = rangeStart.getTime() - srcStart.getTime();
      const firstIdx = Math.max(0, Math.ceil(msDiff / msStep));

      for (let i = firstIdx; ; i++) {
        const d = new Date(srcStart);
        d.setDate(d.getDate() + i * stepDays);
        if (d > rangeEnd) break;
        occurrences.push({ source, date: dateToStr(d), amount: source.amount });
      }
    } else if (source.frequency === "twice_monthly") {
      const day1 = srcStart.getDate();
      const day2Raw = day1 + 15;

      const sY = rangeStart.getFullYear(), sM = rangeStart.getMonth();
      const eY = rangeEnd.getFullYear(), eM = rangeEnd.getMonth();

      for (let y = sY; y <= eY; y++) {
        const mFrom = y === sY ? sM : 0;
        const mTo = y === eY ? eM : 11;
        for (let m = mFrom; m <= mTo; m++) {
          const daysInMonth = new Date(y, m + 1, 0).getDate();
          for (const rawDay of [day1, day2Raw]) {
            const actualDay = Math.min(rawDay, daysInMonth);
            const d = new Date(y, m, actualDay);
            if (d >= srcStart && d >= rangeStart && d <= rangeEnd) {
              occurrences.push({ source, date: dateToStr(d), amount: source.amount });
            }
          }
        }
      }
    } else {
      // monthly
      const payDay = srcStart.getDate();
      const sY = rangeStart.getFullYear(), sM = rangeStart.getMonth();
      const eY = rangeEnd.getFullYear(), eM = rangeEnd.getMonth();

      for (let y = sY; y <= eY; y++) {
        const mFrom = y === sY ? sM : 0;
        const mTo = y === eY ? eM : 11;
        for (let m = mFrom; m <= mTo; m++) {
          const daysInMonth = new Date(y, m + 1, 0).getDate();
          const actualDay = Math.min(payDay, daysInMonth);
          const d = new Date(y, m, actualDay);
          if (d >= srcStart && d >= rangeStart && d <= rangeEnd) {
            occurrences.push({ source, date: dateToStr(d), amount: source.amount });
          }
        }
      }
    }
  }

  return occurrences.sort((a, b) => a.date.localeCompare(b.date));
}

export function groupOccurrencesBySource(occurrences: IncomeOccurrence[]): IncomeSourceSummary[] {
  const map = new Map<string, IncomeSourceSummary>();
  for (const occ of occurrences) {
    const existing = map.get(occ.source.id);
    if (existing) {
      existing.count++;
      existing.total += occ.amount;
    } else {
      map.set(occ.source.id, { source: occ.source, count: 1, total: occ.amount });
    }
  }
  return Array.from(map.values());
}
