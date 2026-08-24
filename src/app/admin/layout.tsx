import { requireSuperadmin } from "@/lib/supabase/admin-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin();

  return <div className="min-h-screen bg-[var(--color-background)]">{children}</div>;
}
