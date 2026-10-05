"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateDisplayNameAction } from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/language-provider";

interface DisplayNameFormProps {
  initialName: string;
}

export function DisplayNameForm({ initialName }: DisplayNameFormProps) {
  const dict = useDict();
  const t = dict.settings;
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateDisplayNameAction(name);
      setSaved(true);
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.displayNameDesc}</p>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          placeholder={t.displayNamePlaceholder}
          className="flex-1"
        />
        <Button type="button" onClick={handleSave} disabled={isPending || !name.trim()}>
          {isPending ? dict.common.saving : dict.common.save}
        </Button>
      </div>
      {saved && <p className="text-xs text-[var(--color-primary)]">{t.displayNameUpdated}</p>}
    </div>
  );
}
