-- Shared Account feature — fix a latent bug from the original schema.
--
-- bills/categories/groups/recurring_templates/income_sources.user_id still
-- carried its ORIGINAL "on delete cascade" foreign key from before this
-- table had any account_id/sharing concept. user_id is now meant to be a
-- harmless "created_by" audit column, not an ownership key -- but because
-- the constraint was never updated, deleting a user (e.g. via the new
-- "delete my account" feature, or any future admin cleanup) cascade-deletes
-- every row THEY created, even inside a shared account other members still
-- actively use. That defeats the entire point of sharing.
--
-- This switches the constraint to "on delete set null" (so the row survives
-- and just loses its creator attribution) and drops the NOT NULL constraint
-- on user_id, since "creator account was deleted" is now a legitimate state.

alter table public.bills               drop constraint bills_user_id_fkey;
alter table public.categories          drop constraint categories_user_id_fkey;
alter table public.groups              drop constraint groups_user_id_fkey;
alter table public.recurring_templates drop constraint recurring_templates_user_id_fkey;
alter table public.income_sources      drop constraint income_sources_user_id_fkey;

alter table public.bills               alter column user_id drop not null;
alter table public.categories          alter column user_id drop not null;
alter table public.groups              alter column user_id drop not null;
alter table public.recurring_templates alter column user_id drop not null;
alter table public.income_sources      alter column user_id drop not null;

alter table public.bills
  add constraint bills_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.categories
  add constraint categories_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.groups
  add constraint groups_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.recurring_templates
  add constraint recurring_templates_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.income_sources
  add constraint income_sources_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
