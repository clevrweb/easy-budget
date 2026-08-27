create table public.debts (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  balance numeric(10,2) not null,
  interest_rate numeric(5,2) not null default 0,
  minimum_payment numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

alter table public.debts enable row level security;

create policy "account_members_debts" on public.debts
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

create index debts_account_id on public.debts(account_id);

-- One row per account, holding the global "extra monthly payment" amount put
-- toward debt beyond everyone's minimums. A dedicated table rather than a
-- column on `accounts`, since `accounts` currently has no UPDATE policy for
-- members at all, and adding one just for this would widen RLS on a table
-- that also holds name/is_personal/created_by.
create table public.debt_settings (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  extra_monthly_payment numeric(10,2) not null default 0,
  updated_at timestamptz default now() not null
);

alter table public.debt_settings enable row level security;

create policy "account_members_debt_settings" on public.debt_settings
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));
