alter table public.bills
  rename column creditor to biller;

alter table public.recurring_templates
  rename column creditor to biller;
