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
