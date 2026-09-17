alter table public.accounts
  add column if not exists income_bar_bg text not null default '#00493b',
  add column if not exists income_bar_fg text not null default '#ffffff',
  add column if not exists bills_bar_bg text not null default '#004a71',
  add column if not exists bills_bar_fg text not null default '#ffffff',
  add column if not exists past_due_bar_bg text not null default '#99171d',
  add column if not exists past_due_bar_fg text not null default '#ffffff';

alter table public.groups
  add column if not exists text_color text not null default '#ffffff';
