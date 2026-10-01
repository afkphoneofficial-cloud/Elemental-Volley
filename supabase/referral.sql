-- ระบบแนะนำเพื่อน
-- รันใน SQL Editor หลัง schema / save_guard
-- เพื่อนกรอกโค้ดจากโปรไฟล์เรา: ทั้งสองฝ่ายได้ขวดเอเธอร์ + ผลคืนกาย + เหรียญเกาะ

alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

create table if not exists public.referral_pending (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vial integer not null default 0,
  fruit integer not null default 0,
  coins integer not null default 0,
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists referral_pending_user_idx
  on public.referral_pending (user_id, claimed);

create table if not exists public.referral_claims (
  invitee_id uuid primary key references public.profiles (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  constraint referral_not_self check (invitee_id <> referrer_id)
);

create index if not exists referral_claims_referrer_idx
  on public.referral_claims (referrer_id);

alter table public.referral_pending enable row level security;
alter table public.referral_claims enable row level security;

drop policy if exists "referral pending none" on public.referral_pending;
create policy "referral pending none" on public.referral_pending
  for all using (false) with check (false);

drop policy if exists "referral claims none" on public.referral_claims;
create policy "referral claims none" on public.referral_claims
  for all using (false) with check (false);

grant all on table public.referral_pending to service_role;
grant all on table public.referral_claims to service_role;

create or replace function public.referral_is_guest(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce((
    select u.is_anonymous or coalesce(u.email, '') = ''
    from auth.users u
    where u.id = uid
  ), true);
$$;

create or replace function public.referral_gift_save(s jsonb, vial integer, fruit integer, coins integer)
returns jsonb
language plpgsql
immutable
as $$
declare
  inv jsonb;
  cur jsonb;
  n integer;
begin
  if s is null or jsonb_typeof(s) <> 'object' then
    s := '{}'::jsonb;
  end if;
  inv := coalesce(s->'inventory', '{}'::jsonb);
  if jsonb_typeof(inv) <> 'object' then
    inv := '{}'::jsonb;
  end if;
  n := public.save_int(inv, array['ether_vial']) + greatest(0, vial);
  inv := jsonb_set(inv, '{ether_vial}', to_jsonb(n), true);
  n := public.save_int(inv, array['bodyfruit']) + greatest(0, fruit);
  inv := jsonb_set(inv, '{bodyfruit}', to_jsonb(n), true);
  s := jsonb_set(s, '{inventory}', inv, true);

  cur := coalesce(s->'currencies', '{}'::jsonb);
  if jsonb_typeof(cur) <> 'object' then
    cur := '{}'::jsonb;
  end if;
  n := public.save_int(cur, array['coins']) + greatest(0, coins);
  cur := jsonb_set(cur, '{coins}', to_jsonb(n), true);
  s := jsonb_set(s, '{currencies}', cur, true);
  return s;
end;
$$;

create or replace function public.apply_referral_pending(uid uuid, s jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  vial integer := 0;
  fruit integer := 0;
  coins integer := 0;
begin
  if uid is null then
    return s;
  end if;
  select
    coalesce(sum(p.vial), 0),
    coalesce(sum(p.fruit), 0),
    coalesce(sum(p.coins), 0)
  into vial, fruit, coins
  from public.referral_pending p
  where p.user_id = uid and p.claimed = false;
  if vial = 0 and fruit = 0 and coins = 0 then
    return s;
  end if;
  update public.referral_pending
    set claimed = true
    where user_id = uid and claimed = false;
  return public.referral_gift_save(s, vial, fruit, coins);
end;
$$;

create or replace function public.ensure_my_referral_code()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  code text;
  n integer := 0;
  raw text;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if public.referral_is_guest(uid) then
    return jsonb_build_object('ok', false, 'reason', 'guest');
  end if;

  select referral_code into code from public.profiles where id = uid;
  if code is not null and length(code) >= 6 then
    select count(*) into n from public.referral_claims where referrer_id = uid;
    return jsonb_build_object('ok', true, 'code', code, 'invites', n);
  end if;

  raw := upper(replace(uid::text, '-', ''));
  code := 'EV' || substr(raw, 1, 6);
  loop
    n := n + 1;
    begin
      update public.profiles
        set referral_code = code
        where id = uid and referral_code is null;
      select referral_code into code from public.profiles where id = uid;
      if code is null then
        code := 'EV' || substr(md5(uid::text || n::text), 1, 6);
        code := upper(code);
        continue;
      end if;
      exit;
    exception when unique_violation then
      code := 'EV' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      if n > 12 then
        return jsonb_build_object('ok', false, 'reason', 'busy');
      end if;
    end;
  end loop;

  select count(*) into n from public.referral_claims where referrer_id = uid;
  return jsonb_build_object('ok', true, 'code', code, 'invites', n);
end;
$$;

create or replace function public.redeem_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  code text;
  host uuid;
  host_n integer;
  s jsonb;
  vial integer := 1;
  fruit integer := 1;
  coins integer := 80;
  cap integer := 30;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if public.referral_is_guest(uid) then
    return jsonb_build_object('ok', false, 'reason', 'guest');
  end if;

  code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(code) < 6 or length(code) > 12 then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;

  if exists (select 1 from public.referral_claims where invitee_id = uid) then
    return jsonb_build_object('ok', false, 'reason', 'used');
  end if;

  select id into host
  from public.profiles
  where referral_code = code
  limit 1;
  if host is null then
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;
  if host = uid then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  if public.referral_is_guest(host) then
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;

  select count(*) into host_n from public.referral_claims where referrer_id = host;
  if host_n >= cap then
    return jsonb_build_object('ok', false, 'reason', 'cap');
  end if;

  insert into public.referral_claims (invitee_id, referrer_id, code)
  values (uid, host, code);

  select save_data into s from public.profiles where id = uid for update;
  s := public.referral_gift_save(coalesce(s, '{}'::jsonb), vial, fruit, coins);
  update public.profiles set save_data = s, last_seen_at = now() where id = uid;

  insert into public.referral_pending (user_id, vial, fruit, coins)
  values (host, vial, fruit, coins);

  insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en, payload)
  values (
    host,
    'server',
    'เพื่อนใช้โค้ดชวนคุณ',
    'A friend used your invite code',
    'มีคนกรอกโค้ดชวนเพื่อนของคุณ ของรางวัลเข้ากระเป๋าแล้ว (ขวดเอเธอร์ ผลคืนกาย และเหรียญเกาะ)',
    'Someone entered your invite code. A vial, a Bodyfruit, and Isle Coins are waiting in your bag.',
    jsonb_build_object('vial', vial, 'fruit', fruit, 'coins', coins, 'from', 'referral')
  );

  return jsonb_build_object(
    'ok', true,
    'vial', vial,
    'fruit', fruit,
    'coins', coins
  );
end;
$$;

create or replace function public.flush_referral_pending()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  s jsonb;
begin
  if uid is null then
    return jsonb_build_object('ok', false);
  end if;
  select save_data into s from public.profiles where id = uid for update;
  s := public.apply_referral_pending(uid, coalesce(s, '{}'::jsonb));
  update public.profiles set save_data = s where id = uid;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.push_save(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old jsonb;
  incoming jsonb;
  old_p integer;
  new_p integer;
  cur jsonb;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if p_save is null or jsonb_typeof(p_save) <> 'object' then
    raise exception 'bad_save';
  end if;

  select save_data into old
  from public.profiles
  where id = uid
  for update;
  if not found then
    raise exception 'no_profile';
  end if;

  incoming := public.apply_referral_pending(uid, p_save);
  old_p := public.save_int(old, array['currencies', 'premium']);
  new_p := public.save_int(incoming, array['currencies', 'premium']);
  if new_p > old_p then
    new_p := old_p;
  end if;
  cur := coalesce(incoming->'currencies', '{}'::jsonb);
  if jsonb_typeof(cur) <> 'object' then
    cur := '{}'::jsonb;
  end if;
  cur := jsonb_set(cur, '{premium}', to_jsonb(new_p));
  incoming := jsonb_set(incoming, '{currencies}', cur, true);

  update public.profiles
    set save_data = incoming,
        last_seen_at = now()
    where id = uid;

  return jsonb_build_object('ok', true, 'premium', new_p);
end;
$$;

revoke all on function public.ensure_my_referral_code() from public;
revoke all on function public.redeem_referral(text) from public;
revoke all on function public.flush_referral_pending() from public;
grant execute on function public.ensure_my_referral_code() to authenticated;
grant execute on function public.redeem_referral(text) to authenticated;
grant execute on function public.flush_referral_pending() to authenticated;
