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
