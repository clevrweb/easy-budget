import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { AddBillForm } from "@/components/bills/add-bill-form";
import type { Category, Group } from "@/types/database";
import { getServerDict } from "@/lib/i18n/server";

export default async function NewBillPage() {
  const supabase = await createClient();
  const dict = await getServerDict();

  const [{ data: categories }, { data: groups }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("groups").select("*").order("name"),
  ]);

  return (
    <>
      <Topbar title={dict.bills.addBill} backHref="/dashboard" />
      <main className="flex-1 p-4 md:p-6 max-w-lg">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5">
          <AddBillForm
            categories={(categories ?? []) as Category[]}
            groups={(groups ?? []) as Group[]}
          />
        </div>
      </main>
    </>
  );
}
