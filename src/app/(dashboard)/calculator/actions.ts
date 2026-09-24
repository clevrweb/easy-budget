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
}

export interface CreateSavingsPlanBillsResult {
  error?: string;
  created?: number;
  capped?: boolean;
  totalPlanned?: number;
}

export async function createSavingsPlanBillsAction(
  input: CreateSavingsPlanBillsInput
): Promise<CreateSavingsPlanBillsResult> {
  const { name, amount, frequency, startDate, endDate } = input;

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

  const rows = dates.map((due_date) => ({
    account_id: accountId,
    user_id: user.id,
    name: name.trim(),
    biller: null,
    amount,
    due_date,
    status: "pending",
    payment_method: null,
    is_autopay: false,
    category_id: null,
    group_id: null,
    notes: null,
    logo_url: null,
    is_recurring: false,
    paid_at: null,
  }));

  const { error } = await supabase.from("bills").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/bills");

  return { created: dates.length, capped, totalPlanned };
}
