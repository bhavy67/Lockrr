-- ---------------------------------------------------------------------------
-- Function hardening
--
-- Two findings from the Supabase security linter, both about functions that
-- run with elevated privilege having a mutable search_path or being directly
-- callable from outside the context they're meant for.
-- ---------------------------------------------------------------------------

-- An unpinned search_path lets a caller shadow an unqualified identifier by
-- creating an object earlier in their own search_path. touch_updated_at only
-- ever touches NEW, so this can't be exploited today, but pinning it is what
-- keeps that true if the function ever grows a second statement.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Postgres refuses to run a trigger function outside a trigger, so this was
-- never actually reachable via /rest/v1/rpc/handle_new_user — but the grant
-- existed regardless, and a SECURITY DEFINER function is exactly the kind of
-- thing that shouldn't carry a permission it doesn't need. The trigger fires
-- as the table owner and needs no EXECUTE grant to keep working.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
