-- EasyBudget Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#4f46e5',
  icon text,
  created_at timestamptz default now() not null
);

-- Groups
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#4f46e5',
  created_at timestamptz default now() not null
);

-- Recurring templates
create table public.recurring_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  name text not null,
  amount numeric(10,2) not null,
  due_day integer not null check (due_day between 1 and 31),
  frequency text not null default 'monthly' check (frequency in ('monthly', 'weekly', 'yearly')),
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

-- Bills
create table public.bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  recurring_template_id uuid references public.recurring_templates(id) on delete set null,
  name text not null,
  amount numeric(10,2) not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  notes text,
  is_recurring boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz default now() not null
);

-- Row Level Security
alter table public.categories enable row level security;
alter table public.groups enable row level security;
alter table public.recurring_templates enable row level security;
alter table public.bills enable row level security;

-- RLS Policies (users can only see their own data)
create policy "users_own_categories" on public.categories for all using (auth.uid() = user_id);
create policy "users_own_groups" on public.groups for all using (auth.uid() = user_id);
create policy "users_own_templates" on public.recurring_templates for all using (auth.uid() = user_id);
create policy "users_own_bills" on public.bills for all using (auth.uid() = user_id);

-- Indexes for performance
create index bills_user_id_due_date on public.bills(user_id, due_date);
create index bills_user_id_status on public.bills(user_id, status);
create index recurring_templates_user_id on public.recurring_templates(user_id);
