"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { getBucketsAction } from "@/app/(dashboard)/savings-plan/actions";
import { Topbar } from "@/components/layout/topbar";
import { MobileFab, FabTrigger } from "@/components/layout/fab";
import { BucketForm } from "./bucket-form";
import { BucketCard } from "./bucket-card";
import { useDict } from "@/components/language-provider";
import type { SavingsBucket } from "@/types/database";

interface SavingsPlanPageClientProps {
  initialBuckets: SavingsBucket[];
}

export function SavingsPlanPageClient({ initialBuckets }: SavingsPlanPageClientProps) {
  const [buckets, setBuckets] = useState(initialBuckets);
  const dict = useDict();
  const t = dict.savingsPlan;

  async function refresh() {
    const data = await getBucketsAction();
    setBuckets(data as SavingsBucket[]);
  }

  return (
    <>
      <Topbar title={t.title}>
        <BucketForm onSaved={refresh} />
      </Topbar>

      <MobileFab>
        <BucketForm onSaved={refresh} trigger={<FabTrigger icon={<Plus className="w-6 h-6" />} label={t.addBucket} />} />
      </MobileFab>

      <main className="flex-1 p-4 md:p-6 space-y-5">
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-2xl">{t.description}</p>

        {buckets.length === 0 ? (
          <div className="mt-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-muted)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8m0 0v2" />
              </svg>
            </div>
            <p className="text-[var(--color-foreground)] font-medium">{t.noBuckets}</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{t.noBucketsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <BucketCard key={bucket.id} bucket={bucket} onChanged={refresh} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
