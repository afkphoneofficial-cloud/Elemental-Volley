-- รันครั้งเดียวใน Supabase SQL Editor
-- กล่องจดหมาย + คำเชิญเพื่อน (อีกฝ่ายต้องยอมรับ)
-- kind ที่รองรับ: friend_invite, friend_accept, news, server, dev

create table if not exists public.mail (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title_th text not null default '',
  title_en text not null default '',
  body_th text not null default '',
  body_en text not null default '',
  payload jsonb not null default '{}'::jsonb,
  unread boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mail_user_box_idx
  on public.mail (user_id, archived, created_at desc);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (from_id, to_id)
);

create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

alter table public.mail enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

drop policy if exists "mail self read" on public.mail;
create policy "mail self read" on public.mail
  for select using (auth.uid() = user_id);

drop policy if exists "mail self update" on public.mail;
create policy "mail self update" on public.mail
  for update using (auth.uid() = user_id);

drop policy if exists "friendships self read" on public.friendships;
create policy "friendships self read" on public.friendships
  for select using (auth.uid() = user_id);

drop policy if exists "friend_requests self read" on public.friend_requests;
create policy "friend_requests self read" on public.friend_requests
  for select using (auth.uid() = from_id or auth.uid() = to_id);

create or replace function public.player_card(p_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'fromId', p.id,
    'fromName', coalesce(p.display_name, ''),
    'fromAvatar', coalesce(nullif(p.save_data->>'avatarId', ''), 'av01'),
    'fromFighter', coalesce(
      nullif(p.save_data->>'showcaseId', ''),
      nullif(p.save_data->>'starterId', ''),
      'ignis'
    ),
    'fromMmr', coalesce((p.save_data->'rank'->>'mmr')::integer, 1000)
  )
  from public.profiles p
  where p.id = p_id;
$$;

create or replace function public.send_friend_invite(p_to uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  card jsonb;
  to_name text;
  incoming uuid;
  req_id uuid;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'cloud');
  end if;
  if p_to is null or p_to = me then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  select display_name into to_name
  from public.profiles
  where id = p_to and display_name is not null and length(btrim(display_name)) >= 2;
  if to_name is null then
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;
  if exists (select 1 from public.friendships where user_id = me and friend_id = p_to) then
    return jsonb_build_object('ok', false, 'reason', 'dup');
  end if;
  if (select count(*) from public.friendships where user_id = me) >= 50 then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  if exists (
    select 1 from public.friend_requests
    where from_id = me and to_id = p_to and status = 'pending'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'pending');
  end if;

  card := public.player_card(me);

  select id into incoming
  from public.friend_requests
  where from_id = p_to and to_id = me and status = 'pending'
  limit 1;

  if incoming is not null then
    insert into public.friendships (user_id, friend_id)
    values (me, p_to), (p_to, me)
    on conflict do nothing;
    update public.friend_requests set status = 'accepted' where id = incoming;
    insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en, payload)
    values (
      p_to,
      'friend_accept',
      coalesce(card->>'fromName', 'ผู้เล่น') || ' รับเป็นเพื่อนแล้ว',
      coalesce(card->>'fromName', 'A player') || ' accepted your invite',
      'ตอนนี้กระชับมิตรกันได้แล้ว',
      'You can play Exhibition together now.',
      card
    );
    return jsonb_build_object('ok', true, 'reason', 'accepted', 'name', to_name);
  end if;

  insert into public.friend_requests (from_id, to_id, status)
  values (me, p_to, 'pending')
  returning id into req_id;

  insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en, payload)
  values (
    p_to,
    'friend_invite',
    'คำเชิญจาก ' || coalesce(card->>'fromName', 'ผู้เล่น'),
    'Invite from ' || coalesce(card->>'fromName', 'a player'),
    coalesce(card->>'fromName', 'ผู้เล่น') || ' อยากเป็นเพื่อนกับคุณ กดยอมรับได้จากกล่องจดหมาย',
    coalesce(card->>'fromName', 'A player') || ' wants to be friends. Accept from your mailbox.',
    card || jsonb_build_object('requestId', req_id)
  );

  return jsonb_build_object('ok', true, 'reason', 'invited', 'name', to_name);
end;
$$;

create or replace function public.respond_friend_mail(p_mail_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  m public.mail%rowtype;
  from_id uuid;
  req_id uuid;
  my_card jsonb;
  their_name text;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'cloud');
  end if;
  select * into m from public.mail where id = p_mail_id and user_id = me;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;
  if m.kind is distinct from 'friend_invite' then
    update public.mail set unread = false, archived = true where id = m.id;
    return jsonb_build_object('ok', true, 'reason', 'read');
  end if;

  from_id := nullif(m.payload->>'fromId', '')::uuid;
  req_id := nullif(m.payload->>'requestId', '')::uuid;
  their_name := coalesce(m.payload->>'fromName', '');
  if from_id is null then
    update public.mail set unread = false, archived = true where id = m.id;
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;

  if not coalesce(p_accept, false) then
    if req_id is not null then
      update public.friend_requests set status = 'declined' where id = req_id and to_id = me;
    else
      update public.friend_requests
        set status = 'declined'
        where from_id = from_id and to_id = me and status = 'pending';
    end if;
    update public.mail set unread = false, archived = true where id = m.id;
    return jsonb_build_object('ok', true, 'reason', 'declined', 'name', their_name);
  end if;

  if exists (select 1 from public.friendships where user_id = me and friend_id = from_id) then
    update public.mail set unread = false, archived = true where id = m.id;
    return jsonb_build_object('ok', true, 'reason', 'dup', 'name', their_name);
  end if;
  if (select count(*) from public.friendships where user_id = me) >= 50 then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  if (select count(*) from public.friendships where user_id = from_id) >= 50 then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;

  insert into public.friendships (user_id, friend_id)
  values (me, from_id), (from_id, me)
  on conflict do nothing;

  if req_id is not null then
    update public.friend_requests set status = 'accepted' where id = req_id;
  else
    update public.friend_requests
      set status = 'accepted'
      where from_id = from_id and to_id = me and status = 'pending';
  end if;

  my_card := public.player_card(me);
  insert into public.mail (user_id, kind, title_th, title_en, body_th, body_en, payload)
  values (
    from_id,
    'friend_accept',
    coalesce(my_card->>'fromName', 'ผู้เล่น') || ' รับเป็นเพื่อนแล้ว',
    coalesce(my_card->>'fromName', 'A player') || ' accepted your invite',
    'ตอนนี้กระชับมิตรกันได้แล้ว',
    'You can play Exhibition together now.',
    my_card
  );
  update public.mail set unread = false, archived = true where id = m.id;
  return jsonb_build_object('ok', true, 'reason', 'accepted', 'name', their_name);
end;
$$;

create or replace function public.archive_mail(p_mail_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'cloud');
  end if;
  update public.mail
    set unread = false, archived = true
    where id = p_mail_id and user_id = me;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;
  return jsonb_build_object('ok', true, 'reason', 'read');
end;
$$;

create or replace function public.list_my_friends()
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
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by p.display_name;
$$;

create or replace function public.list_pending_out()
returns table (
  id uuid,
  display_name text,
  avatar_id text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.display_name,
    coalesce(nullif(p.save_data->>'avatarId', ''), 'av01')
  from public.friend_requests r
  join public.profiles p on p.id = r.to_id
  where r.from_id = auth.uid() and r.status = 'pending'
  order by r.created_at desc;
$$;

create or replace function public.unfriend(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_id is null then
    return jsonb_build_object('ok', false, 'reason', 'cloud');
  end if;
  delete from public.friendships
    where (user_id = me and friend_id = p_id)
       or (user_id = p_id and friend_id = me);
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.player_card(uuid) from public;
revoke all on function public.send_friend_invite(uuid) from public;
revoke all on function public.respond_friend_mail(uuid, boolean) from public;
revoke all on function public.archive_mail(uuid) from public;
revoke all on function public.list_my_friends() from public;
revoke all on function public.list_pending_out() from public;
revoke all on function public.unfriend(uuid) from public;

grant execute on function public.send_friend_invite(uuid) to authenticated;
grant execute on function public.respond_friend_mail(uuid, boolean) to authenticated;
grant execute on function public.archive_mail(uuid) to authenticated;
grant execute on function public.list_my_friends() to authenticated;
grant execute on function public.list_pending_out() to authenticated;
grant execute on function public.unfriend(uuid) to authenticated;
