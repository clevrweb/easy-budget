alter table public.bills
  add column if not exists creditor text;

alter table public.recurring_templates
  add column if not exists creditor text;
