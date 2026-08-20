-- Shared Account feature — step 1 of 2 (additive, safe to run immediately)
-- Run this in the Supabase SQL Editor. Nothing here changes existing
-- behavior: old user_id-based RLS policies on bills/categories/groups/
-- recurring_templates/income_sources are left untouched by this file.
-- The second file (accounts_flip.sql) switches them over once app code
-- has been deployed and is writing account_id on every insert.

-- ============================================================
-- 1. New tables
-- ============================================================

create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'My Budget',
  is_personal boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

create table public.account_members (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (account_id, user_id)
);

create table public.account_invites (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  invited_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz default now() not null,
  responded_at timestamptz
);

create unique index account_invites_unique_pending
  on public.account_invites (account_id, lower(email))
  where status = 'pending';

-- ============================================================
-- 2. RLS-recursion-safe membership check
-- ============================================================
-- A policy on account_members that queries account_members would recurse
-- infinitely. A security definer function's internal query runs as the
-- function owner (postgres, via the SQL Editor) and bypasses RLS entirely,
-- which is the standard fix for this.

create or replace function public.is_account_member(target_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.account_members
    where account_id = target_account_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_account_member(uuid) to authenticated;

-- ============================================================
-- 3. RLS on the 3 new tables (select-only — all writes go through the
--    service-role admin client from server actions, never the regular
--    client, since operations like "add a membership row for someone who
--    isn't me" can't be expressed as a simple self-referential check)
-- ============================================================

alter table public.accounts        enable row level security;
alter table public.account_members enable row level security;
alter table public.account_invites enable row level security;

create policy "members_select_accounts" on public.accounts
  for select using (public.is_account_member(id));

create policy "members_select_membership" on public.account_members
  for select using (public.is_account_member(account_id));

create policy "members_select_invites" on public.account_invites
  for select using (
    public.is_account_member(account_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- ============================================================
-- 4. Add nullable account_id to the 5 shared tables
--    (nullable for now — old RLS policies still active, app keeps working
--    unmodified until accounts_flip.sql is run)
-- ============================================================

alter table public.bills               add column account_id uuid references public.accounts(id) on delete cascade;
alter table public.categories          add column account_id uuid references public.accounts(id) on delete cascade;
alter table public.groups              add column account_id uuid references public.accounts(id) on delete cascade;
alter table public.recurring_templates add column account_id uuid references public.accounts(id) on delete cascade;
alter table public.income_sources      add column account_id uuid references public.accounts(id) on delete cascade;

-- ============================================================
-- 5. Backfill: one personal account + membership per existing auth user
--    (covers users with zero data rows too), then populate account_id on
--    every existing row in the 5 shared tables.
-- ============================================================

begin;

with new_accounts as (
  insert into public.accounts (name, is_personal, created_by)
  select
    coalesce(nullif(trim(p.full_name), ''), 'My Budget'),
    true,
    u.id
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  returning id, created_by
)
insert into public.account_members (account_id, user_id)
select id, created_by from new_accounts;

update public.bills b
  set account_id = am.account_id
  from public.account_members am
  where am.user_id = b.user_id and b.account_id is null;

update public.categories c
  set account_id = am.account_id
  from public.account_members am
  where am.user_id = c.user_id and c.account_id is null;

update public.groups g
  set account_id = am.account_id
  from public.account_members am
  where am.user_id = g.user_id and g.account_id is null;

update public.recurring_templates r
  set account_id = am.account_id
  from public.account_members am
  where am.user_id = r.user_id and r.account_id is null;

update public.income_sources i
  set account_id = am.account_id
  from public.account_members am
  where am.user_id = i.user_id and i.account_id is null;

commit;

-- ============================================================
-- 6. Verification — every column below must read 0 before running
--    accounts_flip.sql
-- ============================================================

select
  (select count(*) from public.bills where account_id is null) as bills_null,
  (select count(*) from public.categories where account_id is null) as categories_null,
  (select count(*) from public.groups where account_id is null) as groups_null,
  (select count(*) from public.recurring_templates where account_id is null) as recurring_null,
  (select count(*) from public.income_sources where account_id is null) as income_null,
  (select count(*) from auth.users u where not exists (
     select 1 from public.account_members m where m.user_id = u.id
  )) as users_without_account;
