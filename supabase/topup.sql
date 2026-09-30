-- SQL Editor → วางทั้งไฟล์นี้ → Run
-- ออเดอร์เติมผงผ่าน Stripe (sandbox / live ใช้ตารางเดียวกัน)

alter table public.purchases
  add column if not exists status text not null default 'pending';
alter table public.purchases
  add column if not exists stripe_pi text;
alter table public.purchases
  add column if not exists powder integer not null default 0;

create unique index if not exists purchases_stripe_pi_uidx
  on public.purchases (stripe_pi)
  where stripe_pi is not null;

create index if not exists purchases_user_status_idx
  on public.purchases (user_id, status);

drop policy if exists "purchases self insert" on public.purchases;
drop policy if exists "purchases self update" on public.purchases;

create or replace function public.fulfill_purchase(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.purchases%rowtype;
  v_save jsonb;
  v_cur jsonb;
  v_prem integer;
begin
  select * into v_row
  from public.purchases
  where id = p_id
  for update;
  if not found then
    raise exception 'no_order';
  end if;
  if v_row.status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'powder', v_row.powder);
  end if;
  if v_row.status <> 'pending' then
    raise exception 'bad_status';
  end if;

  select save_data into v_save
  from public.profiles
  where id = v_row.user_id
  for update;
  if v_save is null then
    v_save := '{}'::jsonb;
  end if;
  v_cur := coalesce(v_save->'currencies', '{}'::jsonb);
  v_prem := coalesce((v_cur->>'premium')::integer, 0) + greatest(0, v_row.powder);
  v_cur := v_cur || jsonb_build_object('premium', v_prem);
  v_save := jsonb_set(v_save, '{currencies}', v_cur, true);

  update public.profiles
  set save_data = v_save
  where id = v_row.user_id;

  update public.purchases
  set status = 'paid',
      provider = 'stripe'
  where id = p_id;

  return jsonb_build_object('ok', true, 'already', false, 'powder', v_row.powder, 'premium', v_prem);
end;
$$;

revoke all on function public.fulfill_purchase(uuid) from public;
revoke all on function public.fulfill_purchase(uuid) from anon, authenticated;
grant execute on function public.fulfill_purchase(uuid) to service_role;
