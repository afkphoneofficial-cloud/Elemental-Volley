-- สำรอง save_data อัตโนมัติ (ผู้เล่นไม่ต้องทำอะไร)
-- SQL Editor → วางทั้งไฟล์นี้ → Run
--
-- กู้ไอดี: Table Editor → save_snapshots กรอง user_id
-- แล้วรัน  select public.admin_restore_save('รหัสไอดี'::uuid, 'รหัสแถวสำรอง'::uuid);

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

-- ผู้เล่นอ่าน/เขียนตารางนี้ไม่ได้ กู้ได้เฉพาะ SQL Editor / service_role
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
