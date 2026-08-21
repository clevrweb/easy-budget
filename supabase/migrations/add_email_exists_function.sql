-- Used by inviteToAccountAction to decide, BEFORE calling generateLink,
-- whether an email already belongs to an existing user. This is necessary
-- because (unlike inviteUserByEmail) admin.auth.admin.generateLink with
-- type: "invite" does NOT error for an email that already has an account --
-- it just silently re-generates a valid link for the existing user. Without
-- this check, every invite would take the "brand new user" path regardless
-- of whether the email already exists.

create or replace function public.email_exists(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;
