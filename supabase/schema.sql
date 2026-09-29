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
  games integer,
  season_mark jsonb
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
      p.rank_games as games,
      coalesce(p.save_data->'seasonMark', '{}'::jsonb) as season_mark
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

-- Save history (existing projects: run supabase/save_snapshots.sql once)
-- auto snapshots of save_data; players cannot read this table

create table if not exists public.save_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  save_data jsonb not null,
  reason text not null default 'auto',
  created_at timestamptz not null default now()
);

create index if not exists save_snapshots_user_created_idx
  on public.save_snapshots (user_id, created_at desc);

alter table public.save_snapshots enable row level security;
revoke all on table public.save_snapshots from public, anon, authenticated;

create or replace function public.snapshot_profile_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_keep integer := 14;
  v_gap interval := interval '6 hours';
  v_last timestamptz;
  v_reason text := 'auto';
  v_old_games integer;
  v_new_games integer;
  v_payload jsonb;
begin
  if tg_op = 'INSERT' then
    if new.save_data is null or new.save_data = '{}'::jsonb then
      return new;
    end if;
    insert into public.save_snapshots (user_id, save_data, reason)
    values (new.id, new.save_data, 'seed');
    return new;
  end if;

  if old.save_data is not distinct from new.save_data then
    return new;
  end if;

  v_old_games := greatest(0, coalesce((old.save_data->'rank'->>'games')::integer, 0));
  v_new_games := greatest(0, coalesce((new.save_data->'rank'->>'games')::integer, 0));
  if v_new_games is distinct from v_old_games then
    v_reason := 'rank';
  end if;

  select max(s.created_at) into v_last
  from public.save_snapshots s
  where s.user_id = new.id;

  if v_reason <> 'rank' and v_last is not null and v_last > now() - v_gap then
    return new;
  end if;

  v_payload := old.save_data;
  if v_payload is null or v_payload = '{}'::jsonb then
    v_payload := new.save_data;
  end if;
  if v_payload is null or v_payload = '{}'::jsonb then
    return new;
  end if;

  insert into public.save_snapshots (user_id, save_data, reason)
  values (new.id, v_payload, v_reason);

  delete from public.save_snapshots s
  where s.user_id = new.id
    and s.id not in (
      select x.id
      from public.save_snapshots x
      where x.user_id = new.id
      order by x.created_at desc
      limit v_keep
    );

  return new;
end;
$$;

drop trigger if exists profiles_snapshot_save on public.profiles;
create trigger profiles_snapshot_save
  after insert or update of save_data on public.profiles
  for each row execute function public.snapshot_profile_save();

insert into public.save_snapshots (user_id, save_data, reason)
select p.id, p.save_data, 'seed'
from public.profiles p
where p.save_data is not null
  and p.save_data <> '{}'::jsonb
  and not exists (
    select 1 from public.save_snapshots s where s.user_id = p.id
  );

create or replace function public.admin_restore_save(p_user_id uuid, p_snapshot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data jsonb;
begin
  select s.save_data into v_data
  from public.save_snapshots s
  where s.id = p_snapshot_id
    and s.user_id = p_user_id;
  if v_data is null then
    raise exception 'snapshot_not_found';
  end if;
  update public.profiles
  set save_data = v_data
  where id = p_user_id;
  if not found then
    raise exception 'profile_not_found';
  end if;
  return v_data;
end;
$$;

revoke all on function public.admin_restore_save(uuid, uuid) from public;
revoke all on function public.admin_restore_save(uuid, uuid) from anon, authenticated;
