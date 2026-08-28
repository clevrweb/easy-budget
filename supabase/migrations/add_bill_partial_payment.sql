alter table public.bills
  add column if not exists amount_paid numeric(10,2) not null default 0;
