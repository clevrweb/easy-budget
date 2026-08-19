export type BillStatus = "pending" | "paid" | "overdue";
export type RecurringFrequency = "monthly" | "weekly" | "yearly";
export type IncomeFrequency = "weekly" | "biweekly" | "twice_monthly" | "monthly";
export type Language = "en" | "es";

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
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
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
  user_id: string;
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
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  start_date: string;
  is_active: boolean;
  created_at: string;
}
