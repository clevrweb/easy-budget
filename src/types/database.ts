export type BillStatus = "pending" | "paid" | "overdue";
export type RecurringFrequency = "monthly" | "weekly" | "yearly";
export type IncomeFrequency = "weekly" | "biweekly" | "twice_monthly" | "monthly";
export type Language = "en" | "es";
export type DefaultBillsView = "day" | "week" | "month";
export type AccountInviteStatus = "pending" | "accepted" | "declined" | "revoked";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "created_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      bills: {
        Row: Bill;
        Insert: Omit<Bill, "id" | "created_at">;
        Update: Partial<Omit<Bill, "id" | "created_at">>;
      };
      recurring_templates: {
        Row: RecurringTemplate;
        Insert: Omit<RecurringTemplate, "id" | "created_at">;
        Update: Partial<Omit<RecurringTemplate, "id" | "created_at">>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, "id" | "created_at">;
        Update: Partial<Omit<Group, "id" | "created_at">>;
      };
      income_sources: {
        Row: IncomeSource;
        Insert: Omit<IncomeSource, "id" | "created_at">;
        Update: Partial<Omit<IncomeSource, "id" | "created_at">>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, "id" | "created_at">;
        Update: Partial<Omit<Account, "id" | "created_at">>;
      };
      account_members: {
        Row: AccountMember;
        Insert: Omit<AccountMember, "id" | "created_at">;
        Update: Partial<Omit<AccountMember, "id" | "created_at">>;
      };
      account_invites: {
        Row: AccountInvite;
        Insert: Omit<AccountInvite, "id" | "created_at" | "responded_at">;
        Update: Partial<Omit<AccountInvite, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface Profile {
  user_id: string;
  full_name: string;
  language: Language;
  default_view: DefaultBillsView;
  created_at: string;
}

export interface Category {
  id: string;
  account_id: string;
  user_id: string | null;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface Bill {
  id: string;
  account_id: string;
  user_id: string | null;
  category_id: string | null;
  group_id: string | null;
  name: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  payment_method: string | null;
  notes: string | null;
  logo_url: string | null;
  is_recurring: boolean;
  recurring_template_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface RecurringTemplate {
  id: string;
  account_id: string;
  user_id: string | null;
  category_id: string | null;
  group_id: string | null;
  name: string;
  amount: number;
  due_day: number;
  frequency: RecurringFrequency;
  payment_method: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  account_id: string;
  user_id: string | null;
  name: string;
  color: string;
  created_at: string;
}

export interface IncomeSource {
  id: string;
  account_id: string;
  user_id: string | null;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  start_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  is_personal: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  created_at: string;
}

export interface AccountInvite {
  id: string;
  account_id: string;
  email: string;
  invited_by: string | null;
  invited_user_id: string | null;
  status: AccountInviteStatus;
  created_at: string;
  responded_at: string | null;
}
