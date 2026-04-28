import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { GroupForm } from "@/components/groups/group-form";
import { GroupCard } from "@/components/groups/group-card";
import type { Group } from "@/types/database";
import { getServerDict } from "@/lib/i18n/server";

export default async function GroupsPage() {
  const [supabase, dict] = await Promise.all([
    createClient(),
    getServerDict(),
  ]);
  const t = dict.groups;

  const { data: groups } = await supabase
    .from("groups")
    .select("*, bills(count)")
    .order("name");

  const allGroups = (groups ?? []) as (Group & { bills: { count: number }[] })[];

  return (
    <>
      <Topbar title={t.title}>
        <GroupForm />
      </Topbar>

      <main className="flex-1 p-4 md:p-6">
        {allGroups.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-muted)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-[var(--color-foreground)] font-medium">{t.noGroups}</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {t.noGroupsDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allGroups.map((grp) => (
              <GroupCard
                key={grp.id}
                group={grp}
                billCount={grp.bills?.[0]?.count ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
