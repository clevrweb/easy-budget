ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_superadmin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS notification_channel text NOT NULL DEFAULT 'push'
    CHECK (notification_channel IN ('push', 'email', 'sms'));

-- App-wide provider config (Resend / Bird API keys, sender addresses, etc).
-- RLS is enabled with no policies defined, so only the service-role key
-- (which bypasses RLS) can read or write it -- never exposed to the anon
-- or authenticated roles.
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

UPDATE public.profiles
SET is_superadmin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'israelthieme@gmail.com');
