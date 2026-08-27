"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveExtraPaymentAction } from "@/app/(dashboard)/debts/actions";
import { useDict } from "@/components/language-provider";

interface ExtraPaymentFormProps {
  initialValue: number;
  onSaved: () => void;
}

export function ExtraPaymentForm({ initialValue, onSaved }: ExtraPaymentFormProps) {
  const dict = useDict();
  const t = dict.debts;
  const [value, setValue] = useState(String(initialValue));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    const formData = new FormData();
    formData.set("extra_monthly_payment", value);
    startTransition(async () => {
      const result = await saveExtraPaymentAction(formData);
      if (!result?.error) {
        setSaved(true);
        onSaved();
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="extra-payment">{t.extraPaymentLabel}</Label>
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.extraPaymentDesc}</p>
      <div className="flex gap-2">
        <Input
          id="extra-payment"
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false); }}
          className="max-w-[160px]"
        />
        <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? dict.common.saving : t.saveExtra}
        </Button>
        {saved && <span className="text-xs text-[var(--color-primary)] self-center">✓</span>}
      </div>
    </div>
  );
}
