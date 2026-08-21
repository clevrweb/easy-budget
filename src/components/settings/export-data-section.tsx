"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportMyDataAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";

export function ExportDataSection() {
  const dict = useDict();
  const t = dict.settings;
  const [isExporting, startExport] = useTransition();

  function handleExport() {
    startExport(async () => {
      const data = await exportMyDataAction();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `easybudget-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.exportDesc}</p>
      <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
        {isExporting ? dict.common.saving : t.exportButton}
      </Button>
    </div>
  );
}
