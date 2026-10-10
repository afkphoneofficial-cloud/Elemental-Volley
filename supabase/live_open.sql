-- เปิดจริง 10 ต.ค. 2026: คืนชื่อ รีเซ็ตแรงก์/เซฟ แจกของไอดีช่วงทดสอบ
-- SQL Editor วางทั้งไฟล์แล้ว Run ครั้งเดียว
-- ไอดีที่เล่นช่วง 1–7 ต.ค. ได้ฉายา BetaTester + ผง 80 + เหรียญ 200 + ผลคืนกาย 1
-- ของที่ซื้อแล้ว / ชุดในกระเป๋า / ล็อกอิน Gmail เดิมยังเป็นคนเดิม
-- แรงก์รีเซ็ตทุกจันทร์ 00:00 น. ไทย (อาทิตย์ 24:00) ด้วย settle_rank_week

create table if not exists public.app_flags (
  key text primary key,
  at timestamptz not null default now()
);

alter table public.app_flags enable row level security;

create or replace function public.ranking_week_id(ts timestamptz default now())
returns text
language sql
stable
as $$
  select to_char((date_trunc('week', timezone('Asia/Bangkok', ts)))::date, 'YYYY-MM-DD');
$$;

create or replace function public.empty_rank_json(p_week text)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'mmr', 1000,
    'games', 0,
    'wins', 0,
    'losses', 0,
    'week', coalesce(p_week, '')
  );
$$;

create or replace function public.live_open_save(old jsonb, p_week text)
returns jsonb
language plpgsql
immutable
as $$
declare
  s jsonb := coalesce(old, '{}'::jsonb);
  tester boolean := false;
  owned jsonb;
  issued jsonb;
  inv jsonb := '{}'::jsonb;
  looks jsonb;
  cosmetics jsonb;
  k text;
  v jsonb;
  titles jsonb;
  beta jsonb;
  worn text;
begin
  if jsonb_typeof(s) <> 'object' then
    s := '{}'::jsonb;
  end if;

  owned := coalesce(s->'titles'->'owned', '[]'::jsonb);
  issued := coalesce(s->'seasonIssued', '[]'::jsonb);
  tester := coalesce((s->'beta'->>'testPlay')::boolean, false)
    or (jsonb_typeof(owned) = 'array' and owned ? 'beta-tester')
    or (jsonb_typeof(issued) = 'array' and issued ? 'beta-gift-2026')
    or coalesce((s->'beta'->>'giftTaken')::boolean, false);

  looks := coalesce(s->'shopLooks'->'owned', '[]'::jsonb);
  cosmetics := coalesce(s->'cosmetics'->'owned', '[]'::jsonb);
  if jsonb_typeof(s->'inventory') = 'object' then
    for k, v in select key, value from jsonb_each(s->'inventory') loop
      if k like 'champ-%'
        or (jsonb_typeof(looks) = 'array' and looks ? k)
        or (jsonb_typeof(cosmetics) = 'array' and cosmetics ? k)
      then
        if (v #>> '{}') is not null then
          inv := jsonb_set(inv, array[k], v, true);
        end if;
      end if;
    end loop;
  end if;
  if tester then
    inv := jsonb_set(inv, '{bodyfruit}', to_jsonb(1), true);
  end if;

  worn := coalesce(s->'titles'->>'worn', '');
  if tester then
    titles := jsonb_build_object(
      'owned', '["beta-tester"]'::jsonb,
      'worn', case when worn = 'beta-tester' then 'beta-tester' else '' end
    );
  else
    titles := jsonb_build_object('owned', '[]'::jsonb, 'worn', '');
  end if;

  beta := jsonb_build_object(
    'testPlay', tester,
    'testAt', coalesce(s->'beta'->'testAt', '0'::jsonb),
    'shopTry', false,
    'giftTaken', tester
  );

  s := s || jsonb_build_object(
    'starterId', null,
    'unlocked', '[]'::jsonb,
    'showcaseId', null,
    'currencies', jsonb_build_object(
      'pvp', 0,
      'premium', case when tester then 80 else 0 end,
      'tokens', 0,
      'coins', case when tester then 200 else 0 end
    ),
    'firstWinDate', null,
    'career', jsonb_build_object(
      'matches', 0, 'wins', 0, 'losses', 0, 'aces', 0, 'ults', 0,
      'hits', 0, 'powerHits', 0, 'errors', 0, 'playMs', 0,
      'bestStreak', 0, 'longestRally', 0
    ),
    'matchLog', '[]'::jsonb,
    'ether', 20,
    'etherAt', 0,
    'inventory', inv,
    'rank', public.empty_rank_json(p_week),
    'specialRank', public.empty_rank_json(p_week),
    'friends', '[]'::jsonb,
    'skins', '{}'::jsonb,
    'growth', '{}'::jsonb,
    'trainCleared', '[]'::jsonb,
    'seasonInbox', '[]'::jsonb,
    'seasonIssued', case when tester then '["beta-gift-2026"]'::jsonb else '[]'::jsonb end,
    'seasonSnap', '{}'::jsonb,
    'seasonBadges', '[]'::jsonb,
    'seasonMark', null,
    'welcomeDay', '',
    'titles', titles,
    'beta', beta,
    'tryCostumePowder', false,
    'dailyLogin', jsonb_build_object(
      'lastClaim', '', 'lastSeen', '', 'claimed', '{}'::jsonb,
      'costumeMonth', '', 'costumeKind', ''
    ),
    'wipeId', 'live-2026-10-10'
  );

  if s ? 'settings' and jsonb_typeof(s->'settings') = 'object' then
    null;
  else
    s := jsonb_set(s, '{settings}', '{}'::jsonb, true);
  end if;

  return s;
end;
$$;

create or replace function public.apply_live_open()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  did boolean := false;
  week_id text := public.ranking_week_id();
begin
  begin
    insert into public.app_flags (key, at)
    values ('live-open-2026-10-10', now());
    did := true;
  exception
    when unique_violation then
      did := false;
  end;

  insert into public.app_flags (key, at)
  values ('live-wipe-2026-10-10', now())
  on conflict (key) do nothing;

  insert into public.app_flags (key, at)
  values ('rank-week-' || week_id, now())
  on conflict (key) do nothing;

  if not did then
    return false;
  end if;

  update public.profiles
  set
    display_name = null,
    display_name_set_at = null,
    save_data = public.live_open_save(save_data, week_id),
    mmr = 1000,
    rank_games = 0,
    rank_wins = 0,
    rank_losses = 0
  where true;

  begin delete from public.chat_messages; exception when undefined_table then null; end;
  begin delete from public.mail; exception when undefined_table then null; end;
  begin delete from public.friendships; exception when undefined_table then null; end;
  begin delete from public.friend_requests; exception when undefined_table then null; end;

  return true;
end;
$$;

create or replace function public.claim_live_wipe()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bangkok date := (timezone('Asia/Bangkok', now()))::date;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if bangkok < date '2026-10-10' then
    return false;
  end if;
  return public.apply_live_open();
end;
$$;

create or replace function public.settle_rank_week()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  week_id text := public.ranking_week_id();
  did boolean := false;
  empty jsonb := public.empty_rank_json(week_id);
begin
  begin
    insert into public.app_flags (key, at)
    values ('rank-week-' || week_id, now());
    did := true;
  exception
    when unique_violation then
      did := false;
  end;

  if did then
    update public.profiles
    set
      save_data = jsonb_set(
        jsonb_set(coalesce(save_data, '{}'::jsonb), '{rank}', empty, true),
        '{specialRank}', empty, true
      ),
      mmr = 1000,
      rank_games = 0,
      rank_wins = 0,
      rank_losses = 0
    where true;
  end if;

  return jsonb_build_object('ok', true, 'did', did, 'week', week_id);
end;
$$;

drop function if exists public.server_special_leaderboard(integer) cascade;

create or replace function public.server_special_leaderboard(p_limit integer default 100)
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
  season_mark jsonb,
  title_id text
)
language sql
security definer
set search_path = public
stable
as $$
  with ranked as (
    select
      row_number() over (
        order by
          coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000) desc,
          coalesce((p.save_data->'specialRank'->>'wins')::integer, 0) desc,
          coalesce((p.save_data->'specialRank'->>'games')::integer, 0) desc,
          p.display_name asc
      )::integer as place,
      p.id,
      p.display_name,
      coalesce(nullif(p.save_data->>'avatarId', ''), 'av01') as avatar_id,
      coalesce(
        nullif(p.save_data->>'showcaseId', ''),
        nullif(p.save_data->>'starterId', ''),
        'ignis'
      ) as fighter_id,
      coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000) as mmr,
      coalesce((p.save_data->'specialRank'->>'wins')::integer, 0) as wins,
      coalesce((p.save_data->'specialRank'->>'losses')::integer, 0) as losses,
      coalesce((p.save_data->'specialRank'->>'games')::integer, 0) as games,
      coalesce(p.save_data->'seasonMark', '{}'::jsonb) as season_mark,
      nullif(p.save_data->'titles'->>'worn', '') as title_id
    from public.profiles p
    where p.display_name is not null
      and length(btrim(p.display_name)) >= 2
      and coalesce((p.save_data->'specialRank'->>'games')::integer, 0) > 0
      and coalesce(p.save_data->'specialRank'->>'week', '') = public.ranking_week_id()
  )
  select *
  from ranked
  where ranked.place <= least(greatest(coalesce(p_limit, 100), 1), 100)
  order by ranked.place;
$$;

create or replace function public.my_special_board_place()
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
      when coalesce((p.save_data->'specialRank'->>'games')::integer, 0) > 0
        and coalesce(p.save_data->'specialRank'->>'week', '') = public.ranking_week_id()
      then (
        select count(*)::integer + 1
        from public.profiles q
        where q.display_name is not null
          and length(btrim(q.display_name)) >= 2
          and coalesce((q.save_data->'specialRank'->>'games')::integer, 0) > 0
          and coalesce(q.save_data->'specialRank'->>'week', '') = public.ranking_week_id()
          and (
            coalesce((q.save_data->'specialRank'->>'mmr')::integer, 1000)
              > coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000)
            or (
              coalesce((q.save_data->'specialRank'->>'mmr')::integer, 1000)
                = coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000)
              and coalesce((q.save_data->'specialRank'->>'wins')::integer, 0)
                > coalesce((p.save_data->'specialRank'->>'wins')::integer, 0)
            )
            or (
              coalesce((q.save_data->'specialRank'->>'mmr')::integer, 1000)
                = coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000)
              and coalesce((q.save_data->'specialRank'->>'wins')::integer, 0)
                = coalesce((p.save_data->'specialRank'->>'wins')::integer, 0)
              and coalesce((q.save_data->'specialRank'->>'games')::integer, 0)
                > coalesce((p.save_data->'specialRank'->>'games')::integer, 0)
            )
            or (
              coalesce((q.save_data->'specialRank'->>'mmr')::integer, 1000)
                = coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000)
              and coalesce((q.save_data->'specialRank'->>'wins')::integer, 0)
                = coalesce((p.save_data->'specialRank'->>'wins')::integer, 0)
              and coalesce((q.save_data->'specialRank'->>'games')::integer, 0)
                = coalesce((p.save_data->'specialRank'->>'games')::integer, 0)
              and q.display_name < p.display_name
            )
          )
      )
      else 0
    end as place,
    coalesce((p.save_data->'specialRank'->>'mmr')::integer, 1000) as mmr,
    coalesce((p.save_data->'specialRank'->>'wins')::integer, 0) as wins,
    coalesce((p.save_data->'specialRank'->>'losses')::integer, 0) as losses,
    coalesce((p.save_data->'specialRank'->>'games')::integer, 0) as games,
    (
      coalesce((p.save_data->'specialRank'->>'games')::integer, 0) > 0
      and coalesce(p.save_data->'specialRank'->>'week', '') = public.ranking_week_id()
    ) as on_board
  from public.profiles p
  where p.id = auth.uid();
$$;

drop function if exists public.server_leaderboard(integer) cascade;

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
  season_mark jsonb,
  title_id text
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
      coalesce(p.save_data->'seasonMark', '{}'::jsonb) as season_mark,
      nullif(p.save_data->'titles'->>'worn', '') as title_id
    from public.profiles p
    where p.display_name is not null
      and length(btrim(p.display_name)) >= 2
      and p.rank_games > 0
      and coalesce(p.save_data->'rank'->>'week', '') = public.ranking_week_id()
  )
  select *
  from ranked
  where ranked.place <= least(greatest(coalesce(p_limit, 100), 1), 100)
  order by ranked.place;
$$;

drop function if exists public.my_board_place() cascade;

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
      when p.rank_games > 0
        and coalesce(p.save_data->'rank'->>'week', '') = public.ranking_week_id()
      then (
        select count(*)::integer + 1
        from public.profiles q
        where q.display_name is not null
          and length(btrim(q.display_name)) >= 2
          and q.rank_games > 0
          and coalesce(q.save_data->'rank'->>'week', '') = public.ranking_week_id()
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
      else 0
    end as place,
    p.mmr,
    p.rank_wins as wins,
    p.rank_losses as losses,
    p.rank_games as games,
    (
      p.rank_games > 0
      and coalesce(p.save_data->'rank'->>'week', '') = public.ranking_week_id()
    ) as on_board
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.apply_live_open() from public;
revoke all on function public.claim_live_wipe() from public;
revoke all on function public.settle_rank_week() from public;
revoke all on function public.server_special_leaderboard(integer) from public;
revoke all on function public.my_special_board_place() from public;
revoke all on function public.server_leaderboard(integer) from public;
revoke all on function public.my_board_place() from public;
grant execute on function public.claim_live_wipe() to authenticated;
grant execute on function public.settle_rank_week() to authenticated;
grant execute on function public.server_special_leaderboard(integer) to authenticated;
grant execute on function public.my_special_board_place() to authenticated;
grant execute on function public.server_leaderboard(integer) to authenticated;
grant execute on function public.my_board_place() to authenticated;

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
  fruit integer;
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

  prem := public.save_int(s, array['currencies', 'premium']);
  coins := public.save_int(s, array['currencies', 'coins']);
  fruit := public.save_int(s, array['inventory', 'bodyfruit']);

  if coalesce((s->'beta'->>'giftTaken')::boolean, false) then
    return jsonb_build_object('ok', true, 'already', true, 'n', 0, 'premium', prem, 'coins', coins, 'fruit', fruit);
  end if;

  c := coalesce(s->'currencies', '{}'::jsonb);
  if jsonb_typeof(c) <> 'object' then
    c := '{}'::jsonb;
  end if;
  prem := greatest(prem, 80);
  coins := greatest(coins, 200);
  c := jsonb_set(c, '{premium}', to_jsonb(prem));
  c := jsonb_set(c, '{coins}', to_jsonb(coins));
  s := jsonb_set(s, '{currencies}', c, true);

  inv := coalesce(s->'inventory', '{}'::jsonb);
  if jsonb_typeof(inv) <> 'object' then
    inv := '{}'::jsonb;
  end if;
  fruit := greatest(fruit, 1);
  inv := jsonb_set(inv, '{bodyfruit}', to_jsonb(fruit));
  s := jsonb_set(s, '{inventory}', inv, true);

  beta := coalesce(s->'beta', '{}'::jsonb);
  if jsonb_typeof(beta) <> 'object' then
    beta := '{}'::jsonb;
  end if;
  beta := beta || jsonb_build_object('giftTaken', true);
  s := jsonb_set(s, '{beta}', beta, true);

  update public.profiles set save_data = s where id = uid;
  return jsonb_build_object('ok', true, 'already', false, 'n', 80, 'premium', prem, 'coins', coins, 'fruit', fruit);
end;
$$;

revoke all on function public.claim_beta_rest_gift() from public;
grant execute on function public.claim_beta_rest_gift() to authenticated;

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('evolley-rank-week');
    exception when others then
      null;
    end;
    perform cron.schedule(
      'evolley-rank-week',
      '0 17 * * 0',
      'select public.settle_rank_week()'
    );
  end if;
exception when others then
  null;
end;
$cron$;

select public.apply_live_open();
