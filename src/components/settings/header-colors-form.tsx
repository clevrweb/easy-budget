"use client";

import { useState, useTransition } from "react";
import { updateHeaderColorsAction } from "@/app/(dashboard)/settings/actions";
import { ColorSwatchPicker } from "@/components/ui/color-swatch-picker";
import { useDict } from "@/components/language-provider";
import { TrendingUp, Receipt, AlertTriangle, type LucideIcon } from "lucide-react";

const BG_PRESETS = [
  "#004a71", "#00493b", "#99171d", "#4f46e5", "#7c3aed", "#dc2626",
  "#ea580c", "#16a34a", "#0891b2", "#0284c7", "#1e293b", "#6b7280",
];
const FG_PRESETS = ["#ffffff", "#000000", "#e5e7eb", "#1e293b"];

interface ColorPair {
  bg: string;
  fg: string;
}

interface HeaderColors {
  income: ColorPair;
  bills: ColorPair;
  pastDue: ColorPair;
}

const DEFAULTS: HeaderColors = {
  income: { bg: "#00493b", fg: "#ffffff" },
  bills: { bg: "#004a71", fg: "#ffffff" },
  pastDue: { bg: "#99171d", fg: "#ffffff" },
};

type SectionKey = keyof HeaderColors;

interface HeaderColorsFormProps {
  initial: HeaderColors;
}

export function HeaderColorsForm({ initial }: HeaderColorsFormProps) {
  const dict = useDict();
  const t = dict.settings;
  const [colors, setColors] = useState<HeaderColors>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(next: HeaderColors) {
    setSaved(false);
    setColors(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("income_bg", next.income.bg);
      formData.set("income_fg", next.income.fg);
      formData.set("bills_bg", next.bills.bg);
      formData.set("bills_fg", next.bills.fg);
      formData.set("past_due_bg", next.pastDue.bg);
      formData.set("past_due_fg", next.pastDue.fg);
      await updateHeaderColorsAction(formData);
      setSaved(true);
    });
  }

  function updateSection(key: SectionKey, field: keyof ColorPair, value: string) {
    save({ ...colors, [key]: { ...colors[key], [field]: value } });
  }

  const SECTIONS: { key: SectionKey; label: string; Icon: LucideIcon }[] = [
    { key: "income", label: dict.income.incomeSectionTitle, Icon: TrendingUp },
    { key: "bills", label: dict.bills.title, Icon: Receipt },
    { key: "pastDue", label: dict.bills.pastDueSectionTitle, Icon: AlertTriangle },
  ];

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-5">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.headerColorsDesc}</p>

      {SECTIONS.map(({ key, label, Icon }) => {
        const section = colors[key];
        return (
          <div key={key} className="space-y-3 pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
            {/* Live preview */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ backgroundColor: section.bg }}>
              <Icon className="w-4 h-4" color={section.fg} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: section.fg }}>{label}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[var(--color-foreground)]">{t.bgColorLabel}</p>
                <ColorSwatchPicker value={section.bg} onChange={(c) => updateSection(key, "bg", c)} presets={BG_PRESETS} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[var(--color-foreground)]">{t.fontColorLabel}</p>
                <ColorSwatchPicker value={section.fg} onChange={(c) => updateSection(key, "fg", c)} presets={FG_PRESETS} />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => save(DEFAULTS)}
          className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors disabled:opacity-40"
        >
          {t.resetToDefault}
        </button>
        {saved && <p className="text-xs text-[var(--color-primary)]">{t.colorsSaved}</p>}
      </div>
    </div>
  );
}
