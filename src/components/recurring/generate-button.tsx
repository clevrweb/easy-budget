"use client";

import { useState, useTransition } from "react";
import { generateBillsForMonthAction } from "@/app/(dashboard)/recurring/actions";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useDict } from "@/components/language-provider";

export function GenerateButton({ month }: { month: string }) {
  const dict = useDict();
  const t = dict.recurring;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  function handleGenerate() {
    setMessage(null);
    startTransition(async () => {
      const result = await generateBillsForMonthAction(month);
      if ("error" in result && result.error) {
        setMessage({ text: result.error, type: "error" });
      } else if ("generated" in result) {
        setMessage({
          text: result.generated === 0
            ? t.allBillsExist
            : result.generated === 1
              ? t.generatedSuccessSingular
              : t.generatedSuccessPlural.replace("{n}", String(result.generated)),
          type: result.generated === 0 ? "info" : "success",
        });
      }
    });
  }

  const colorMap = {
    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-[var(--color-success)]",
    info: "bg-[var(--color-muted)] border-[var(--color-border)] text-[var(--color-muted-foreground)]",
    error: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-[var(--color-danger)]",
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleGenerate} disabled={isPending} variant="outline">
        <Zap className="w-4 h-4" />
        {isPending ? t.generating : t.generateForMonth}
      </Button>
      {message && (
        <p className={`text-xs px-3 py-1.5 rounded-lg border ${colorMap[message.type]}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
