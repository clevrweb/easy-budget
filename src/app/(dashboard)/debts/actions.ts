"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import { computeSnowballPlan } from "@/lib/debt-snowball";

export async function createDebtAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data, error } = await supabase
    .from("debts")
    .insert({
      account_id: accountId,
      user_id: user.id,
      name: formData.get("name") as string,
      balance: parseFloat(formData.get("balance") as string),
      interest_rate: parseFloat(formData.get("interest_rate") as string) || 0,
      minimum_payment: parseFloat(formData.get("minimum_payment") as string),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { success: true, id: data.id };
}

export async function updateDebtAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("debts")
    .update({
      name: formData.get("name") as string,
      balance: parseFloat(formData.get("balance") as string),
      interest_rate: parseFloat(formData.get("interest_rate") as string) || 0,
      minimum_payment: parseFloat(formData.get("minimum_payment") as string),
    })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { success: true };
}

export async function deleteDebtAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase.from("debts").delete().eq("id", id).eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { success: true };
}

export async function getDebtsWithPlanAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { debts: [], settings: { extra_monthly_payment: 0 }, plan: computeSnowballPlan([], 0) };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { debts: [], settings: { extra_monthly_payment: 0 }, plan: computeSnowballPlan([], 0) };

  const [{ data: debts }, { data: settingsRow }] = await Promise.all([
    supabase.from("debts").select("*").eq("account_id", accountId).eq("is_active", true).order("balance"),
    supabase.from("debt_settings").select("extra_monthly_payment").eq("account_id", accountId).maybeSingle(),
  ]);

  const settings = { extra_monthly_payment: settingsRow?.extra_monthly_payment ?? 0 };
  const plan = computeSnowballPlan(debts ?? [], settings.extra_monthly_payment);

  return { debts: debts ?? [], settings, plan };
}

export async function saveExtraPaymentAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const extraMonthlyPayment = parseFloat(formData.get("extra_monthly_payment") as string) || 0;

  const { error } = await supabase
    .from("debt_settings")
    .upsert({ account_id: accountId, extra_monthly_payment: extraMonthlyPayment }, { onConflict: "account_id" });

  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { success: true };
}

export async function createRecurringBillForDebtAction(debtId: string, dueDay: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("name, minimum_payment")
    .eq("id", debtId)
    .eq("account_id", accountId)
    .single();
  if (debtError || !debt) return { error: debtError?.message ?? "Debt not found" };

  const { data: template, error } = await supabase
    .from("recurring_templates")
    .insert({
      account_id: accountId,
      user_id: user.id,
      name: debt.name,
      biller: null,
      amount: debt.minimum_payment,
      due_day: dueDay,
      frequency: "monthly",
      category_id: null,
      group_id: null,
      payment_method: null,
      is_autopay: false,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Generate the next 6 months of bills up front, same as createRecurringBillAction
  // does for the normal Add Bill flow -- otherwise the template exists but no bill
  // ever shows up anywhere, since generation is otherwise only triggered by the
  // manual "Generate" button on /recurring.
  const today = new Date();
  const startsThisMonth = today.getDate() <= dueDay;
  const firstMonth = new Date(today.getFullYear(), today.getMonth() + (startsThisMonth ? 0 : 1), 1);

  const bills = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = Math.min(dueDay, lastDay);
    const due_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return {
      account_id: accountId,
      user_id: user.id,
      recurring_template_id: template.id,
      category_id: null,
      group_id: null,
      name: debt.name,
      biller: null,
      amount: debt.minimum_payment,
      due_date,
      status: "pending" as const,
      payment_method: null,
      is_autopay: false,
      is_recurring: true,
      notes: null,
    };
  });

  const { error: billsError } = await supabase.from("bills").insert(bills);
  if (billsError) return { error: billsError.message };

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/debts");
  return { success: true, templateId: template.id };
}
