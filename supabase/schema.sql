-- วางใน Supabase: SQL Editor แล้ว Run ทั้งไฟล์
-- Dashboard → Authentication → Providers → Google
--   Client ID = จาก Google Cloud
--   Client Secret = จาก Google Cloud (ห้ามใส่ในเกม)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text unique,
  display_name_set_at timestamptz,
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sku text not null,
  amount_cents integer not null default 0,
  currency text not null default 'THB',
  provider text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);

alter table public.profiles enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "purchases self read" on public.purchases;
create policy "purchases self read" on public.purchases
  for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mail text;
begin
  mail := lower(coalesce(new.email, ''));
  if mail not like '%@gmail.com' and mail not like '%@googlemail.com' then
    raise exception 'gmail_only';
  end if;
  insert into public.profiles (id, email)
  values (new.id, mail)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Friend discovery without exposing email (see also friends_directory.sql)
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

-- Mailbox: supabase/mailbox.sql   Chat: supabase/chat.sql
-- Leaderboard / MMR columns: supabase/leaderboard.sql (also inlined below)

alter table public.profiles
  add column if not exists mmr integer not null default 1000,
  add column if not exists rank_games integer not null default 0,
  add column if not exists rank_wins integer not null default 0,
  add column if not exists rank_losses integer not null default 0;

create index if not exists profiles_mmr_board_idx
  on public.profiles (mmr desc, rank_wins desc, rank_games desc);

create or replace function public.sync_profile_rank()
returns trigger
language plpgsql
as $$
begin
  new.mmr := greatest(0, coalesce((new.save_data->'rank'->>'mmr')::integer, 1000));
  new.rank_games := greatest(0, coalesce((new.save_data->'rank'->>'games')::integer, 0));
  new.rank_wins := greatest(0, coalesce((new.save_data->'rank'->>'wins')::integer, 0));
  new.rank_losses := greatest(0, coalesce((new.save_data->'rank'->>'losses')::integer, 0));
  return new;
end;
$$;

drop trigger if exists profiles_sync_rank on public.profiles;
create trigger profiles_sync_rank
  before insert or update of save_data on public.profiles
  for each row execute function public.sync_profile_rank();

update public.profiles
set
  mmr = greatest(0, coalesce((save_data->'rank'->>'mmr')::integer, 1000)),
  rank_games = greatest(0, coalesce((save_data->'rank'->>'games')::integer, 0)),
  rank_wins = greatest(0, coalesce((save_data->'rank'->>'wins')::integer, 0)),
  rank_losses = greatest(0, coalesce((save_data->'rank'->>'losses')::integer, 0));

create or replace function public.server_leaderboard(p_limit integer default 100)
returns table (
  place integer,
  id uuid,
  display_name text,
  avatar_id text,
  fighter_id text,
  mmr integer,
  wins integer,
  losses integer,
  games integer
)
language sql
security definer
set search_path = public
stable
as $$
  with ranked as (
    select
      row_number() over (
        order by p.mmr desc, p.rank_wins desc, p.rank_games desc, p.display_name asc
      )::integer as place,
      p.id,
      p.display_name,
      coalesce(nullif(p.save_data->>'avatarId', ''), 'av01') as avatar_id,
      coalesce(
        nullif(p.save_data->>'showcaseId', ''),
        nullif(p.save_data->>'starterId', ''),
        'ignis'
      ) as fighter_id,
      p.mmr,
      p.rank_wins as wins,
      p.rank_losses as losses,
      p.rank_games as games
    from public.profiles p
    where p.display_name is not null
      and length(btrim(p.display_name)) >= 2
      and p.rank_games > 0
  )
  select *
  from ranked
  where ranked.place <= least(greatest(coalesce(p_limit, 100), 1), 100)
  order by ranked.place;
$$;

revoke all on function public.server_leaderboard(integer) from public;
grant execute on function public.server_leaderboard(integer) to authenticated;

create or replace function public.my_board_place()
returns table (
  place integer,
  mmr integer,
  wins integer,
  losses integer,
  games integer,
  on_board boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    case
      when p.rank_games > 0 then (
        select count(*)::integer + 1
        from public.profiles q
        where q.display_name is not null
          and length(btrim(q.display_name)) >= 2
          and q.rank_games > 0
          and (
            q.mmr > p.mmr
            or (q.mmr = p.mmr and q.rank_wins > p.rank_wins)
            or (q.mmr = p.mmr and q.rank_wins = p.rank_wins and q.rank_games > p.rank_games)
            or (
              q.mmr = p.mmr
              and q.rank_wins = p.rank_wins
              and q.rank_games = p.rank_games
              and q.display_name < p.display_name
            )
          )
      )
      else null
    end as place,
    p.mmr,
    p.rank_wins as wins,
    p.rank_losses as losses,
    p.rank_games as games,
    p.rank_games > 0 as on_board
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.my_board_place() from public;
grant execute on function public.my_board_place() to authenticated;
