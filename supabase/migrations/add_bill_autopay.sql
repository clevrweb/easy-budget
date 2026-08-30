alter table public.bills
  add column if not exists is_autopay boolean not null default false;

alter table public.recurring_templates
  add column if not exists is_autopay boolean not null default false;
