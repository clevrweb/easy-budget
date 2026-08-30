"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";

export async function createBillAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const status = (formData.get("status") as string) || "pending";
  const { error } = await supabase.from("bills").insert({
    account_id: accountId,
    user_id: user.id,
    name: formData.get("name") as string,
    creditor: (formData.get("creditor") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    due_date: formData.get("due_date") as string,
    status,
    payment_method: (formData.get("payment_method") as string) || null,
    category_id: (formData.get("category_id") as string) || null,
    group_id: (formData.get("group_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
    logo_url: (formData.get("logo_url") as string) || null,
    is_recurring: false,
    paid_at: status === "paid" ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function updateBillAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const id = formData.get("id") as string;

  const status = (formData.get("status") as string) || "pending";
  const { error } = await supabase
    .from("bills")
    .update({
      name: formData.get("name") as string,
      creditor: (formData.get("creditor") as string) || null,
      amount: parseFloat(formData.get("amount") as string),
      due_date: formData.get("due_date") as string,
      status,
      payment_method: (formData.get("payment_method") as string) || null,
      category_id: (formData.get("category_id") as string) || null,
      group_id: (formData.get("group_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
      logo_url: (formData.get("logo_url") as string) || null,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function createRecurringBillAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const name           = formData.get("name") as string;
  const creditor       = (formData.get("creditor") as string) || null;
  const amount         = parseFloat(formData.get("amount") as string);
  const dueDate        = formData.get("due_date") as string;
  const frequency      = (formData.get("frequency") as string) || "monthly";
  const dueDateObj     = new Date(dueDate + "T00:00:00");
  const dueDay         = parseInt(formData.get("due_day") as string) || (frequency === "weekly" ? 1 : dueDateObj.getDate());
  const endsType       = (formData.get("ends_type") as string) || "never";
  const endDate        = (formData.get("end_date") as string) || null;
  const endCount       = parseInt(formData.get("end_count") as string) || null;
  const categoryId     = (formData.get("category_id") as string) || null;
  const groupId        = (formData.get("group_id") as string) || null;
  const paymentMethod  = (formData.get("payment_method") as string) || null;
  const notes          = (formData.get("notes") as string) || null;

  // Create the template
  const { data: template, error: templateError } = await supabase
    .from("recurring_templates")
    .insert({ account_id: accountId, user_id: user.id, name, creditor, amount, due_day: dueDay, frequency, category_id: categoryId, group_id: groupId, payment_method: paymentMethod, is_active: true })
    .select()
    .single();

  if (templateError || !template) return { error: templateError?.message ?? "Failed to create template" };

  // Determine how many periods to generate
  const maxPeriods = frequency === "yearly" ? 2 : 6;
  const limit = endsType === "count" && endCount ? Math.min(maxPeriods, endCount) : maxPeriods;

  // Build bills
  const bills: object[] = [];
  for (let i = 0; i < limit; i++) {
    let billDate: string;

    if (frequency === "monthly") {
      const d = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth() + i, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const day = Math.min(dueDay, lastDay);
      billDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    } else if (frequency === "weekly") {
      const d = new Date(dueDateObj);
      d.setDate(d.getDate() + i * dueDay * 7);
      billDate = d.toISOString().split("T")[0];
    } else {
      const d = new Date(dueDateObj);
      d.setFullYear(d.getFullYear() + i);
      billDate = d.toISOString().split("T")[0];
    }

    if (endsType === "date" && endDate && billDate > endDate) break;

    bills.push({
      account_id: accountId, user_id: user.id, name, creditor, amount,
      due_date: billDate, status: "pending",
      payment_method: paymentMethod, category_id: categoryId,
      group_id: groupId, notes, is_recurring: true,
      recurring_template_id: template.id,
    });
  }

  if (bills.length > 0) {
    const { error: billsError } = await supabase.from("bills").insert(bills);
    if (billsError) return { error: billsError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/recurring");
  return { success: true };
}

export async function getRecurringTemplateAction(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data, error } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("id", templateId)
    .eq("account_id", accountId)
    .single();

  if (error) return { error: error.message };
  return { template: data };
}

export async function updateRecurringSeriesAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const templateId  = formData.get("template_id") as string;
  const name        = formData.get("name") as string;
  const creditor    = (formData.get("creditor") as string) || null;
  const amount      = parseFloat(formData.get("amount") as string);
  const categoryId  = (formData.get("category_id") as string) || null;
  const groupId     = (formData.get("group_id") as string) || null;
  const logoUrl     = (formData.get("logo_url") as string) || null;
  const paymentMethod = (formData.get("payment_method") as string) || null;
  const frequency   = (formData.get("frequency") as string) || "monthly";
  const dueDay      = parseInt(formData.get("due_day") as string) || 1;
  const endsType    = (formData.get("ends_type") as string) || "never";
  const endDate     = (formData.get("end_date") as string) || null;
  const endCount    = parseInt(formData.get("end_count") as string) || null;

  // Update the template
  const { error: tplError } = await supabase
    .from("recurring_templates")
    .update({ name, creditor, amount, category_id: categoryId, group_id: groupId, frequency, due_day: dueDay, payment_method: paymentMethod })
    .eq("id", templateId)
    .eq("account_id", accountId);

  if (tplError) return { error: tplError.message };

  // Delete all pending bills for this template so we can regenerate
  const { error: deleteError } = await supabase
    .from("bills")
    .delete()
    .eq("recurring_template_id", templateId)
    .eq("status", "pending")
    .eq("account_id", accountId);

  if (deleteError) return { error: deleteError.message };

  // Regenerate bills from the given start date (defaults to today)
  const startDateStr = (formData.get("start_date") as string) || new Date().toISOString().split("T")[0];
  const today = new Date(startDateStr + "T00:00:00");
  const maxPeriods = frequency === "yearly" ? 2 : 6;
  const limit = endsType === "count" && endCount ? Math.min(maxPeriods, endCount) : maxPeriods;

  const bills: object[] = [];
  for (let i = 0; i < limit; i++) {
    let billDate: string;

    if (frequency === "monthly") {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const day = Math.min(dueDay, lastDay);
      billDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    } else if (frequency === "weekly") {
      const d = new Date(today);
      d.setDate(d.getDate() + i * dueDay * 7);
      billDate = d.toISOString().split("T")[0];
    } else {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() + i);
      billDate = d.toISOString().split("T")[0];
    }

    if (endsType === "date" && endDate && billDate > endDate) break;

    bills.push({
      account_id: accountId, user_id: user.id, name, creditor, amount,
      due_date: billDate, status: "pending",
      category_id: categoryId, group_id: groupId,
      logo_url: logoUrl, payment_method: paymentMethod,
      is_recurring: true, recurring_template_id: templateId,
    });
  }

  if (bills.length > 0) {
    const { error: billsError } = await supabase.from("bills").insert(bills);
    if (billsError) return { error: billsError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurringSeriesAction(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  await supabase.from("bills").delete().eq("recurring_template_id", templateId).eq("status", "pending").eq("account_id", accountId);
  await supabase.from("recurring_templates").delete().eq("id", templateId).eq("account_id", accountId);

  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteBillAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function markBillPaidAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data: bill, error: fetchError } = await supabase
    .from("bills")
    .select("amount")
    .eq("id", id)
    .eq("account_id", accountId)
    .single();
  if (fetchError || !bill) return { error: fetchError?.message ?? "Bill not found" };

  const { error } = await supabase
    .from("bills")
    .update({ status: "paid", paid_at: new Date().toISOString(), amount_paid: bill.amount })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function markBillPendingAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { error } = await supabase
    .from("bills")
    .update({ status: "pending", paid_at: null, amount_paid: 0 })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true };
}

export async function payBillAction(id: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { data: bill, error: fetchError } = await supabase
    .from("bills")
    .select("amount, amount_paid")
    .eq("id", id)
    .eq("account_id", accountId)
    .single();
  if (fetchError || !bill) return { error: fetchError?.message ?? "Bill not found" };

  const paymentAmount = Math.max(0, amount);
  const newAmountPaid = Math.min(bill.amount, (bill.amount_paid ?? 0) + paymentAmount);
  const isFullyPaid = newAmountPaid >= bill.amount;

  const { error } = await supabase
    .from("bills")
    .update({
      amount_paid: newAmountPaid,
      status: isFullyPaid ? "paid" : "pending",
      paid_at: isFullyPaid ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  return { success: true, fullyPaid: isFullyPaid, remaining: bill.amount - newAmountPaid };
}
