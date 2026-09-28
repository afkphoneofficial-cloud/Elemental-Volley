-- รันครั้งเดียวใน Supabase SQL Editor
-- ให้ผู้เล่นที่ล็อกอินสุ่ม/ค้นชื่อเพื่อนได้ โดยไม่อ่านอีเมลของคนอื่น

create or replace function public.suggest_players(p_limit integer default 40)
returns table (
  id uuid,
  display_name text,
  avatar_id text,
  fighter_id text,
  mmr integer,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.display_name,
    coalesce(nullif(p.save_data->>'avatarId', ''), 'av01'),
    coalesce(
      nullif(p.save_data->>'showcaseId', ''),
      nullif(p.save_data->>'starterId', ''),
      'ignis'
    ),
    coalesce((p.save_data->'rank'->>'mmr')::integer, 1000),
    p.last_seen_at
  from public.profiles p
  where p.display_name is not null
    and length(btrim(p.display_name)) >= 2
    and p.id is distinct from auth.uid()
  order by p.last_seen_at desc nulls last
  limit least(greatest(coalesce(p_limit, 40), 1), 40);
$$;

revoke all on function public.suggest_players(integer) from public;
grant execute on function public.suggest_players(integer) to authenticated;

create or replace function public.lookup_player_by_name(raw_name text)
returns table (
  id uuid,
  display_name text,
  avatar_id text,
  fighter_id text,
  mmr integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.display_name,
    coalesce(nullif(p.save_data->>'avatarId', ''), 'av01'),
    coalesce(
      nullif(p.save_data->>'showcaseId', ''),
      nullif(p.save_data->>'starterId', ''),
      'ignis'
    ),
    coalesce((p.save_data->'rank'->>'mmr')::integer, 1000)
  from public.profiles p
  where p.display_name = btrim(raw_name)
  limit 1;
$$;

revoke all on function public.lookup_player_by_name(text) from public;
grant execute on function public.lookup_player_by_name(text) to authenticated;
