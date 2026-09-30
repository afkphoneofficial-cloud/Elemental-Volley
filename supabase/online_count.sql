-- Run in Supabase SQL Editor.
-- Counts players whose last_seen_at is within 5 minutes.

create or replace function public.online_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select greatest(1, count(*)::int)
  from public.profiles
  where last_seen_at > now() - interval '5 minutes';
$$;

revoke all on function public.online_count() from public;
grant execute on function public.online_count() to authenticated;
