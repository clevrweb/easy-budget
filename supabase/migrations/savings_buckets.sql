-- Savings Buckets feature. Run this in the Supabase SQL Editor.
-- Modeled directly on debts.sql -- account_id-scoped from creation, no
-- legacy user_id-only phase to migrate through.

create table public.savings_buckets (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  target_amount numeric(10,2) not null,
  current_amount numeric(10,2) not null default 0,
  target_date date,
  contribution_amount numeric(10,2),
  contribution_frequency text check (contribution_frequency in ('weekly','biweekly','monthly','quarterly','annually')),
  projection_type text check (projection_type in ('stock','compound')),
  projection_input jsonb,
  projected_value numeric(10,2),
  projected_date date,
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

alter table public.savings_buckets enable row level security;

create policy "account_members_savings_buckets" on public.savings_buckets
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

create index savings_buckets_account_id on public.savings_buckets(account_id);
