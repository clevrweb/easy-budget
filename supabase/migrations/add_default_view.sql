ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_view text NOT NULL DEFAULT 'month'
  CHECK (default_view IN ('day', 'week', 'month'));
