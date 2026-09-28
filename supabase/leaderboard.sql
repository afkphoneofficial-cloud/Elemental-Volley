-- กระดาน 100 อันดับ + คอลัมน์แต้มสนามจริง (รันครั้งเดียวถ้าโปรเจกต์มีอยู่แล้ว)
-- SQL Editor → วางทั้งไฟล์นี้ → Run

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
