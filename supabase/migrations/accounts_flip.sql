-- Shared Account feature — step 2 of 2 (the cutover)
--
-- Run this ONLY after:
--   1. accounts_setup.sql has been run and its verification query returned
--      all zeros.
--   2. The app code that writes account_id on every insert (bills,
--      categories, groups, recurring_templates, income_sources actions)
--      has been deployed and is live.
--
-- This makes account_id required and switches RLS from per-user to
-- per-account-membership. From this point on, the old auth.uid() = user_id
-- policies are gone — any code path still inserting without account_id
-- will start failing.

-- Re-run the verification query one more time as a final safety check
-- before proceeding — do not continue past this point if any value is
-- nonzero:
--
-- select
--   (select count(*) from public.bills where account_id is null) as bills_null,
--   (select count(*) from public.categories where account_id is null) as categories_null,
--   (select count(*) from public.groups where account_id is null) as groups_null,
--   (select count(*) from public.recurring_templates where account_id is null) as recurring_null,
--   (select count(*) from public.income_sources where account_id is null) as income_null;

alter table public.bills               alter column account_id set not null;
alter table public.categories          alter column account_id set not null;
alter table public.groups              alter column account_id set not null;
alter table public.recurring_templates alter column account_id set not null;
alter table public.income_sources      alter column account_id set not null;

create index bills_account_id_due_date       on public.bills(account_id, due_date);
create index bills_account_id_status         on public.bills(account_id, status);
create index categories_account_id           on public.categories(account_id);
create index groups_account_id               on public.groups(account_id);
create index recurring_templates_account_id  on public.recurring_templates(account_id);
create index income_sources_account_id       on public.income_sources(account_id);

drop policy "users_own_bills" on public.bills;
drop policy "users_own_categories" on public.categories;
drop policy "users_own_groups" on public.groups;
drop policy "users_own_templates" on public.recurring_templates;
drop policy "users_own_income_sources" on public.income_sources;

create policy "account_members_bills" on public.bills
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

create policy "account_members_categories" on public.categories
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

create policy "account_members_groups" on public.groups
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

create policy "account_members_recurring_templates" on public.recurring_templates
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

create policy "account_members_income_sources" on public.income_sources
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));

-- Optional cleanup — the old user_id-based indexes are superseded by the
-- account_id ones above and can be dropped:
-- drop index if exists bills_user_id_due_date;
-- drop index if exists bills_user_id_status;
-- drop index if exists recurring_templates_user_id;
-- drop index if exists income_sources_user_id;
