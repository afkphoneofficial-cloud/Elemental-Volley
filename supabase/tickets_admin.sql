-- รันครั้งเดียว: ตั๋วปัญหา + แอดมิน + ที่เก็บภาพ
-- Dashboard → Storage ถ้ายังไม่มี bucket ticket-shots บล็อกท้ายจะสร้างให้
-- รหัสแอดมิน (เปลี่ยนได้หลังรัน)
--   ID: isle-keeper
--   PASS: WedPatch#2026

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists ban_reason text not null default '';
alter table public.profiles add column if not exists mmr integer not null default 1000;
alter table public.profiles add column if not exists rank_wins integer not null default 0;
alter table public.profiles add column if not exists rank_games integer not null default 0;

create table if not exists public.admin_auth (
  login text primary key,
  pass_hash text not null,
  created_at timestamptz not null default now()
);

insert into public.admin_auth (login, pass_hash)
values ('isle-keeper', crypt('WedPatch#2026', gen_salt('bf')))
on conflict (login) do update set pass_hash = excluded.pass_hash;

create table if not exists public.admin_sessions (
  token text primary key,
  login text not null references public.admin_auth (login) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  category text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_user_idx on public.tickets (user_id, created_at desc);
create index if not exists tickets_status_idx on public.tickets (status, updated_at desc);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  from_admin boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_idx on public.ticket_messages (ticket_id, created_at);

create table if not exists public.ticket_files (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  path text not null,
  bytes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_files enable row level security;
alter table public.admin_auth enable row level security;
alter table public.admin_sessions enable row level security;

drop policy if exists "tickets self read" on public.tickets;
create policy "tickets self read" on public.tickets
  for select using (auth.uid() = user_id);

drop policy if exists "ticket msg self read" on public.ticket_messages;
create policy "ticket msg self read" on public.ticket_messages
  for select using (
    exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

drop policy if exists "ticket files self read" on public.ticket_files;
create policy "ticket files self read" on public.ticket_files
  for select using (
    exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

create or replace function public.admin_ok(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.admin_sessions
    where token = p_token and expires_at > now()
  );
$$;

create or replace function public.admin_login(p_login text, p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  tok text;
  row_auth public.admin_auth%rowtype;
begin
  select * into row_auth from public.admin_auth where login = btrim(p_login);
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if row_auth.pass_hash <> crypt(btrim(p_pass), row_auth.pass_hash) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  tok := encode(gen_random_bytes(24), 'hex');
  insert into public.admin_sessions (token, login, expires_at)
  values (tok, row_auth.login, now() + interval '12 hours');
  delete from public.admin_sessions where expires_at < now();
  return jsonb_build_object('ok', true, 'token', tok, 'login', row_auth.login);
end;
$$;

create or replace function public.ticket_create(p_category text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  me uuid := auth.uid();
  tid uuid;
  nm text;
  em text;
  cat text := btrim(p_category);
  txt text := btrim(p_body);
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if cat not in ('account', 'pay', 'play', 'item', 'report', 'other') then
    return jsonb_build_object('ok', false, 'reason', 'cat');
  end if;
  if length(txt) < 8 or length(txt) > 4000 then
    return jsonb_build_object('ok', false, 'reason', 'body');
  end if;
  select display_name, email into nm, em from public.profiles where id = me;
  insert into public.tickets (user_id, name, email, category, body)
  values (me, coalesce(nm, ''), coalesce(em, ''), cat, txt)
  returning id into tid;
  insert into public.ticket_messages (ticket_id, from_admin, body)
  values (tid, false, txt);
  return jsonb_build_object('ok', true, 'id', tid);
end;
$$;

create or replace function public.ticket_attach(p_ticket uuid, p_path text, p_bytes integer)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  me uuid := auth.uid();
  n int;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if p_bytes is null or p_bytes <= 0 or p_bytes > 5242880 then
    return jsonb_build_object('ok', false, 'reason', 'size');
  end if;
  if p_path is null or position(me::text in p_path) <> 1 then
    return jsonb_build_object('ok', false, 'reason', 'path');
  end if;
  perform 1 from public.tickets where id = p_ticket and user_id = me and status <> 'success';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ticket');
  end if;
  select count(*) into n from public.ticket_files where ticket_id = p_ticket;
  if n >= 3 then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  insert into public.ticket_files (ticket_id, path, bytes) values (p_ticket, p_path, p_bytes);
  update public.tickets set updated_at = now() where id = p_ticket;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.ticket_reply(p_ticket uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  me uuid := auth.uid();
  txt text := btrim(p_body);
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if length(txt) < 1 or length(txt) > 4000 then
    return jsonb_build_object('ok', false, 'reason', 'body');
  end if;
  perform 1 from public.tickets where id = p_ticket and user_id = me and status <> 'success';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ticket');
  end if;
  insert into public.ticket_messages (ticket_id, from_admin, body)
  values (p_ticket, false, txt);
  update public.tickets set updated_at = now(), status = 'open' where id = p_ticket;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_overview(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  out jsonb;
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  select jsonb_build_object(
    'ok', true,
    'players', (select count(*) from public.profiles),
    'named', (select count(*) from public.profiles where display_name is not null and length(btrim(display_name)) >= 2),
    'banned', (select count(*) from public.profiles where banned),
    'online1h', (select count(*) from public.profiles where last_seen_at > now() - interval '1 hour'),
    'beta', (select count(*) from public.profiles where coalesce((save_data->'beta'->>'testPlay')::boolean, false)),
    'ticketsOpen', (select count(*) from public.tickets where status <> 'success'),
    'ticketsAll', (select count(*) from public.tickets),
    'purchases', (select count(*) from public.purchases),
    'mailUnread', (select count(*) from public.mail where unread and not archived)
  ) into out;
  return out;
end;
$$;

create or replace function public.admin_players(p_token text, p_q text default '', p_limit integer default 80)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  q text := lower(btrim(coalesce(p_q, '')));
  lim int := least(greatest(coalesce(p_limit, 80), 1), 200);
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select
          p.id,
          p.display_name,
          p.email,
          p.banned,
          p.ban_reason,
          p.mmr,
          p.rank_wins,
          p.rank_games,
          p.last_seen_at,
          p.created_at,
          coalesce((p.save_data->'beta'->>'testPlay')::boolean, false) as beta,
          coalesce((p.save_data->'currencies'->>'premium')::int, 0) as powder,
          coalesce((p.save_data->'currencies'->>'coins')::int, 0) as coins,
          coalesce((p.save_data->'currencies'->>'tokens')::int, 0) as shards,
          coalesce((p.save_data->'currencies'->>'pvp')::int, 0) as stones,
          coalesce(p.save_data->>'starterId', '') as starter
        from public.profiles p
        where q = ''
           or p.email ilike '%' || q || '%'
           or p.display_name ilike '%' || q || '%'
           or p.id::text ilike '%' || q || '%'
        order by p.last_seen_at desc nulls last
        limit lim
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_grant(p_token text, p_user uuid, p_powder int, p_coins int, p_shards int, p_stones int, p_fruit int)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s jsonb;
  c jsonb;
  inv jsonb;
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  select save_data into s from public.profiles where id = p_user;
  if s is null then
    return jsonb_build_object('ok', false, 'reason', 'no');
  end if;
  c := coalesce(s->'currencies', '{}'::jsonb);
  c := jsonb_set(c, '{premium}', to_jsonb(greatest(0, coalesce((c->>'premium')::int, 0) + coalesce(p_powder, 0))));
  c := jsonb_set(c, '{coins}', to_jsonb(greatest(0, coalesce((c->>'coins')::int, 0) + coalesce(p_coins, 0))));
  c := jsonb_set(c, '{tokens}', to_jsonb(greatest(0, coalesce((c->>'tokens')::int, 0) + coalesce(p_shards, 0))));
  c := jsonb_set(c, '{pvp}', to_jsonb(greatest(0, coalesce((c->>'pvp')::int, 0) + coalesce(p_stones, 0))));
  s := jsonb_set(s, '{currencies}', c);
  if coalesce(p_fruit, 0) <> 0 then
    inv := coalesce(s->'inventory', '{}'::jsonb);
    inv := jsonb_set(inv, '{bodyfruit}', to_jsonb(greatest(0, coalesce((inv->>'bodyfruit')::int, 0) + p_fruit)));
    s := jsonb_set(s, '{inventory}', inv);
  end if;
  update public.profiles set save_data = s where id = p_user;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_set_ban(p_token text, p_user uuid, p_ban boolean, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  update public.profiles
    set banned = coalesce(p_ban, false),
        ban_reason = coalesce(p_reason, '')
    where id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_mail(p_token text, p_user uuid, p_title_th text, p_title_en text, p_body_th text, p_body_en text, p_broadcast boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if coalesce(p_broadcast, false) then
    insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en)
    select id, 'dev', coalesce(p_title_th, ''), coalesce(p_title_en, ''), coalesce(p_body_th, ''), coalesce(p_body_en, '')
    from public.profiles;
  elsif p_user is not null then
    insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en)
    values (p_user, 'dev', coalesce(p_title_th, ''), coalesce(p_title_en, ''), coalesce(p_body_th, ''), coalesce(p_body_en, ''));
  else
    return jsonb_build_object('ok', false, 'reason', 'no');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_rank(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select display_name, email, mmr, rank_wins, rank_games, last_seen_at
        from public.profiles
        where display_name is not null
        order by mmr desc, rank_wins desc
        limit 50
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_purchases(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select pu.id, pu.sku, pu.amount_cents, pu.currency, pu.provider, pu.created_at,
               p.display_name, p.email
        from public.purchases pu
        join public.profiles p on p.id = pu.user_id
        order by pu.created_at desc
        limit 80
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_tickets(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select t.*,
          (select jsonb_agg(jsonb_build_object(
            'id', m.id, 'from_admin', m.from_admin, 'body', m.body, 'created_at', m.created_at
          ) order by m.created_at)
           from public.ticket_messages m where m.ticket_id = t.id) as messages,
          (select jsonb_agg(jsonb_build_object('id', f.id, 'path', f.path, 'bytes', f.bytes))
           from public.ticket_files f where f.ticket_id = t.id) as files
        from public.tickets t
        order by (t.status = 'success'), t.updated_at desc
        limit 120
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_ticket_reply(p_token text, p_ticket uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid;
  txt text := btrim(p_body);
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if length(txt) < 1 then
    return jsonb_build_object('ok', false, 'reason', 'body');
  end if;
  select user_id into uid from public.tickets where id = p_ticket;
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'no');
  end if;
  insert into public.ticket_messages (ticket_id, from_admin, body)
  values (p_ticket, true, txt);
  update public.tickets set status = 'waiting', updated_at = now() where id = p_ticket;
  insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en, payload)
  values (
    uid,
    'ticket',
    'ตอบกลับ Ticket',
    'Ticket reply',
    'แอดมินตอบ Ticket ของคุณแล้ว เปิดปุ่ม Ticket ที่ล็อบบี้เพื่ออ่าน',
    'Staff replied to your ticket. Open Ticket in the lobby to read it.',
    jsonb_build_object('ticketId', p_ticket)
  );
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_ticket_success(p_token text, p_ticket uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_ok(p_token) then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  perform 1 from public.tickets where id = p_ticket;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no');
  end if;
  begin
    delete from storage.objects
    where bucket_id = 'ticket-shots'
      and name in (select path from public.ticket_files where ticket_id = p_ticket);
  exception when others then
    null;
  end;
  delete from public.ticket_files where ticket_id = p_ticket;
  update public.tickets set status = 'success', updated_at = now() where id = p_ticket;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_ok(text) from public;
revoke all on function public.admin_login(text, text) from public;
revoke all on function public.ticket_create(text, text) from public;
revoke all on function public.ticket_attach(uuid, text, integer) from public;
revoke all on function public.ticket_reply(uuid, text) from public;
revoke all on function public.admin_overview(text) from public;
revoke all on function public.admin_players(text, text, integer) from public;
revoke all on function public.admin_grant(text, uuid, int, int, int, int, int) from public;
revoke all on function public.admin_set_ban(text, uuid, boolean, text) from public;
drop function if exists public.admin_mail(text, uuid, text, text, text, text);
revoke all on function public.admin_mail(text, uuid, text, text, text, text, boolean) from public;
revoke all on function public.admin_rank(text) from public;
revoke all on function public.admin_purchases(text) from public;
revoke all on function public.admin_tickets(text) from public;
revoke all on function public.admin_ticket_reply(text, uuid, text) from public;
revoke all on function public.admin_ticket_success(text, uuid) from public;

grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_ok(text) to anon, authenticated;
grant execute on function public.admin_overview(text) to anon, authenticated;
grant execute on function public.admin_players(text, text, integer) to anon, authenticated;
grant execute on function public.admin_grant(text, uuid, int, int, int, int, int) to anon, authenticated;
grant execute on function public.admin_set_ban(text, uuid, boolean, text) to anon, authenticated;
grant execute on function public.admin_mail(text, uuid, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.admin_rank(text) to anon, authenticated;
grant execute on function public.admin_purchases(text) to anon, authenticated;
grant execute on function public.admin_tickets(text) to anon, authenticated;
grant execute on function public.admin_ticket_reply(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_ticket_success(text, uuid) to anon, authenticated;
grant execute on function public.ticket_create(text, text) to authenticated;
grant execute on function public.ticket_attach(uuid, text, integer) to authenticated;
grant execute on function public.ticket_reply(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-shots',
  'ticket-shots',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do nothing;

drop policy if exists "ticket shots insert own" on storage.objects;
create policy "ticket shots insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ticket-shots'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "ticket shots read" on storage.objects;
create policy "ticket shots read" on storage.objects
  for select to public
  using (bucket_id = 'ticket-shots');
