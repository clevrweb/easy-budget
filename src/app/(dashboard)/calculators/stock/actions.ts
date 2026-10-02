"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAccountId } from "@/lib/supabase/account";
import { generateContributionDates } from "@/lib/savings-plan";
import type { ContributionFrequency } from "@/lib/future-projection";

export interface CreateSavingsPlanBillsInput {
  name: string;
  amount: number;
  frequency: ContributionFrequency;
  startDate: string;
  endDate: string;
  groupId?: string | null;
}

export interface CreateSavingsPlanBillsResult {
  error?: string;
  created?: number;
  capped?: boolean;
  totalPlanned?: number;
  isSeries?: boolean;
}

interface TemplateFrequencyMapping {
  frequency: "weekly" | "monthly" | "yearly";
  due_day: number;
}

// weekly/monthly/yearly are the only frequencies recurring_templates supports
// today (see supabase/schema.sql's check constraint). Biweekly reuses the
// existing "weekly with an interval" mechanism (due_day is overloaded as the
// week-interval multiplier elsewhere in this app). Quarterly has no
// representation in the current model, so it intentionally returns null —
// those plans fall back to individual one-off bills, same as before.
function mapToTemplateFrequency(frequency: ContributionFrequency, startDate: string): TemplateFrequencyMapping | null {
  const dayOfMonth = new Date(startDate + "T00:00:00").getDate();
  switch (frequency) {
    case "weekly": return { frequency: "weekly", due_day: 1 };
    case "biweekly": return { frequency: "weekly", due_day: 2 };
    case "monthly": return { frequency: "monthly", due_day: dayOfMonth };
    case "annually": return { frequency: "yearly", due_day: dayOfMonth };
    case "quarterly": return null;
  }
}

export async function createSavingsPlanBillsAction(
  input: CreateSavingsPlanBillsInput
): Promise<CreateSavingsPlanBillsResult> {
  const { name, amount, frequency, startDate, endDate, groupId } = input;

  if (!name.trim()) return { error: "A plan name is required" };
  if (amount <= 0) return { error: "Amount must be greater than 0" };
  if (startDate >= endDate) return { error: "Start date must be before end date" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const accountId = await getActiveAccountId(supabase, user.id);
  if (!accountId) return { error: "No account selected" };

  const { dates, capped, totalPlanned } = generateContributionDates(startDate, endDate, frequency);
  if (dates.length === 0) return { error: "No bill dates fall within this date range" };

  const trimmedName = name.trim();
  const resolvedGroupId = groupId || null;
  const templateMapping = mapToTemplateFrequency(frequency, startDate);

  let templateId: string | null = null;
  if (templateMapping) {
    // Created inactive: every intended bill is already bulk-generated below,
    // so this template never needs the monthly auto-generation feature to
    // pick it up (which would otherwise keep creating bills forever past the
    // plan's actual end date). It still fully supports "Edit/Delete Entire
    // Series" from the Bills list, and can be reactivated later if the user
    // deliberately wants to extend it.
    const { data: template, error: templateError } = await supabase
      .from("recurring_templates")
      .insert({
        account_id: accountId,
        user_id: user.id,
        name: trimmedName,
        amount,
        frequency: templateMapping.frequency,
        due_day: templateMapping.due_day,
        category_id: null,
        group_id: resolvedGroupId,
        payment_method: null,
        logo_url: null,
        is_autopay: false,
        is_active: false,
      })
      .select("id")
      .single();

    if (templateError) return { error: templateError.message };
    templateId = template.id;
  }

  const rows = dates.map((due_date) => ({
    account_id: accountId,
    user_id: user.id,
    name: trimmedName,
    biller: null,
    amount,
    due_date,
    status: "pending",
    payment_method: null,
    is_autopay: false,
    category_id: null,
    group_id: resolvedGroupId,
    notes: null,
    logo_url: null,
    is_recurring: !!templateId,
    recurring_template_id: templateId,
    paid_at: null,
  }));

  const { error } = await supabase.from("bills").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/recurring");

  return { created: dates.length, capped, totalPlanned, isSeries: !!templateId };
}
