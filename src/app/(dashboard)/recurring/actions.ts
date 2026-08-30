"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import type { RecurringTemplate } from "@/types/database";

export async function createTemplateAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase.from("recurring_templates").insert({
    account_id: accountId,
    user_id: user.id,
    name: formData.get("name") as string,
    creditor: (formData.get("creditor") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    due_day: parseInt(formData.get("due_day") as string, 10),
    frequency: (formData.get("frequency") as string) || "monthly",
    category_id: (formData.get("category_id") as string) || null,
    group_id: (formData.get("group_id") as string) || null,
    payment_method: (formData.get("payment_method") as string) || null,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}

export async function updateTemplateAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("recurring_templates")
    .update({
      name: formData.get("name") as string,
      creditor: (formData.get("creditor") as string) || null,
      amount: parseFloat(formData.get("amount") as string),
      due_day: parseInt(formData.get("due_day") as string, 10),
      frequency: formData.get("frequency") as string,
      category_id: (formData.get("category_id") as string) || null,
      group_id: (formData.get("group_id") as string) || null,
      payment_method: (formData.get("payment_method") as string) || null,
    })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteTemplateAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("recurring_templates")
    .delete()
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}

export async function toggleTemplateActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("recurring_templates")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}

export async function generateBillsForMonthAction(month: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const [year, mon] = month.split("-").map(Number);

  // Fetch active templates
  const { data: templates, error: tErr } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("account_id", accountId)
    .eq("is_active", true);

  if (tErr) return { error: tErr.message };
  if (!templates || templates.length === 0) return { generated: 0 };

  // Fetch existing recurring bills for this month to avoid duplicates
  const monthStart = new Date(year, mon - 1, 1).toISOString().split("T")[0];
  const monthEnd = new Date(year, mon, 0).toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("bills")
    .select("recurring_template_id")
    .eq("account_id", accountId)
    .eq("is_recurring", true)
    .gte("due_date", monthStart)
    .lte("due_date", monthEnd);

  const existingTemplateIds = new Set((existing ?? []).map((b: { recurring_template_id: string | null }) => b.recurring_template_id));

  // Build bills to insert
  const daysInMonth = new Date(year, mon, 0).getDate();

  const toInsert = (templates as RecurringTemplate[])
    .filter((t) => !existingTemplateIds.has(t.id))
    .map((t) => {
      const day = Math.min(t.due_day, daysInMonth);
      const due_date = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return {
        account_id: accountId,
        user_id: user.id,
        recurring_template_id: t.id,
        category_id: t.category_id,
        group_id: t.group_id,
        name: t.name,
        creditor: t.creditor,
        amount: t.amount,
        due_date,
        status: "pending" as const,
        payment_method: t.payment_method,
        is_recurring: true,
        notes: null,
        paid_at: null,
      };
    });

  if (toInsert.length === 0) return { generated: 0 };

  const { error: insertErr } = await supabase.from("bills").insert(toInsert);
  if (insertErr) return { error: insertErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { generated: toInsert.length };
}
