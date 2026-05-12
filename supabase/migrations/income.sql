-- Income Sources Table
-- Run this in your Supabase SQL Editor

create table if not exists public.income_sources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(10,2) not null,
  frequency text not null default 'monthly'
    check (frequency in ('weekly', 'biweekly', 'twice_monthly', 'monthly')),
  start_date date not null,
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

alter table public.income_sources enable row level security;
create policy "users_own_income_sources" on public.income_sources for all using (auth.uid() = user_id);
create index income_sources_user_id on public.income_sources(user_id);
