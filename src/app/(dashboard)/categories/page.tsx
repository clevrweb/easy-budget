import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryCard } from "@/components/categories/category-card";
import { seedDefaultCategoriesAction } from "./actions";
import type { Category } from "@/types/database";
import { getServerDict } from "@/lib/i18n";

export default async function CategoriesPage() {
  const [supabase, dict] = await Promise.all([
    createClient(),
    getServerDict(),
  ]);
  const t = dict.categories;

  const { data: categories } = await supabase
    .from("categories")
    .select("*, bills(count)")
    .order("name");

  const allCategories = (categories ?? []) as (Category & { bills: { count: number }[] })[];

  return (
    <>
      <Topbar title={t.title}>
        <form action={seedDefaultCategoriesAction}>
          <button
            type="submit"
            className="h-9 px-3 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            {t.loadDefaults}
          </button>
        </form>
        <CategoryForm />
      </Topbar>

      <main className="flex-1 p-4 md:p-6">
        {allCategories.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-muted)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-[var(--color-foreground)] font-medium">{t.noCategories}</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {t.noCategoriesDesc}
            </p>
            <form action={seedDefaultCategoriesAction} className="mt-4">
              <button
                type="submit"
                className="h-9 px-4 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {t.loadDefaultsFull}
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                billCount={cat.bills?.[0]?.count ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
