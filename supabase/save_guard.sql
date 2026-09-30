-- รันใน SQL Editor หลัง schema / tickets / topup
-- กันผู้เล่น UPDATE ผงอีเธเรียผ่าน profiles.save_data โดยตรง
-- เหรียญ / เศษ / หินยังตามเซฟไคลเอนต์ (รางวัลแมตช์ยังไม่มี RPC)

create or replace function public.save_int(j jsonb, keys text[])
returns integer
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := j #>> keys;
  if v is null or v = '' or v = 'null' then
    return 0;
  end if;
  begin
    return greatest(0, floor(v::numeric)::integer);
  exception when others then
    return 0;
  end;
end;
$$;

drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles self touch" on public.profiles;
create policy "profiles self touch" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, email) on table public.profiles to authenticated;
grant update (last_seen_at, display_name, display_name_set_at) on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

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

  incoming := p_save;
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

create or replace function public.claim_beta_shop_powder()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bangkok date := (timezone('Asia/Bangkok', now()))::date;
  s jsonb;
  c jsonb;
  beta jsonb;
  n integer := 2000;
  prem integer;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if bangkok < date '2026-10-01' or bangkok > date '2026-10-07' then
    return jsonb_build_object('ok', false, 'reason', 'window', 'n', 0);
  end if;

  select save_data into s
  from public.profiles
  where id = uid
  for update;
  if s is null then
    return jsonb_build_object('ok', false, 'reason', 'no', 'n', 0);
  end if;

  if coalesce((s->>'tryCostumePowder')::boolean, false)
     or coalesce((s->'beta'->>'shopTry')::boolean, false) then
    prem := public.save_int(s, array['currencies', 'premium']);
    return jsonb_build_object('ok', true, 'already', true, 'n', 0, 'premium', prem);
  end if;

  c := coalesce(s->'currencies', '{}'::jsonb);
  if jsonb_typeof(c) <> 'object' then
    c := '{}'::jsonb;
  end if;
  prem := public.save_int(s, array['currencies', 'premium']) + n;
  c := jsonb_set(c, '{premium}', to_jsonb(prem));
  s := jsonb_set(s, '{currencies}', c, true);
  beta := coalesce(s->'beta', '{}'::jsonb);
  if jsonb_typeof(beta) <> 'object' then
    beta := '{}'::jsonb;
  end if;
  beta := beta || jsonb_build_object('shopTry', true);
  s := jsonb_set(s, '{beta}', beta, true);
  s := jsonb_set(s, '{tryCostumePowder}', 'true'::jsonb, true);

  update public.profiles set save_data = s where id = uid;
  return jsonb_build_object('ok', true, 'already', false, 'n', n, 'premium', prem);
end;
$$;

create or replace function public.claim_beta_rest_gift()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bangkok date := (timezone('Asia/Bangkok', now()))::date;
  s jsonb;
  c jsonb;
  beta jsonb;
  inv jsonb;
  prem integer;
  coins integer;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if bangkok < date '2026-10-08' then
    return jsonb_build_object('ok', false, 'reason', 'early', 'n', 0);
  end if;

  select save_data into s
  from public.profiles
  where id = uid
  for update;
  if s is null then
    return jsonb_build_object('ok', false, 'reason', 'no', 'n', 0);
  end if;
  if not coalesce((s->'beta'->>'testPlay')::boolean, false) then
    return jsonb_build_object('ok', false, 'reason', 'noplay', 'n', 0);
  end if;
  if coalesce((s->'beta'->>'giftTaken')::boolean, false) then
    prem := public.save_int(s, array['currencies', 'premium']);
    coins := public.save_int(s, array['currencies', 'coins']);
    return jsonb_build_object('ok', true, 'already', true, 'n', 0, 'premium', prem, 'coins', coins);
  end if;

  c := coalesce(s->'currencies', '{}'::jsonb);
  if jsonb_typeof(c) <> 'object' then
    c := '{}'::jsonb;
  end if;
  prem := public.save_int(s, array['currencies', 'premium']) + 80;
  coins := public.save_int(s, array['currencies', 'coins']) + 200;
  c := jsonb_set(c, '{premium}', to_jsonb(prem));
  c := jsonb_set(c, '{coins}', to_jsonb(coins));
  s := jsonb_set(s, '{currencies}', c, true);

  inv := coalesce(s->'inventory', '{}'::jsonb);
  if jsonb_typeof(inv) <> 'object' then
    inv := '{}'::jsonb;
  end if;
  inv := jsonb_set(inv, '{bodyfruit}', to_jsonb(public.save_int(inv, array['bodyfruit']) + 1));
  s := jsonb_set(s, '{inventory}', inv, true);

  beta := coalesce(s->'beta', '{}'::jsonb);
  if jsonb_typeof(beta) <> 'object' then
    beta := '{}'::jsonb;
  end if;
  beta := beta || jsonb_build_object('giftTaken', true);
  s := jsonb_set(s, '{beta}', beta, true);

  update public.profiles set save_data = s where id = uid;
  return jsonb_build_object('ok', true, 'already', false, 'n', 80, 'premium', prem, 'coins', coins, 'fruit', 1);
end;
$$;

revoke all on function public.push_save(jsonb) from public;
revoke all on function public.claim_beta_shop_powder() from public;
revoke all on function public.claim_beta_rest_gift() from public;
grant execute on function public.push_save(jsonb) to authenticated;
grant execute on function public.claim_beta_shop_powder() to authenticated;
grant execute on function public.claim_beta_rest_gift() to authenticated;
