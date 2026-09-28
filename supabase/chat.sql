-- รันครั้งเดียวใน Supabase SQL Editor
-- แชทโลก + แชทเพื่อน และลบเพื่อนสองฝั่งโดยไม่ส่งจดหมาย

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_time_idx
  on public.chat_messages (channel, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat read" on public.chat_messages;
create policy "chat read" on public.chat_messages
  for select using (
    auth.uid() is not null
    and (
      channel = 'world'
      or (
        channel like 'dm:%'
        and (
          split_part(channel, ':', 2) = auth.uid()::text
          or split_part(channel, ':', 3) = auth.uid()::text
        )
      )
    )
  );

alter table public.chat_messages replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

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
  delete from public.friend_requests
    where (from_id = me and to_id = p_id)
       or (from_id = p_id and to_id = me);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.send_chat(p_to uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  ch text;
  nm text;
  raw text := btrim(coalesce(p_body, ''));
  rid uuid;
  rch text;
  rsid uuid;
  rname text;
  rbody text;
  rat timestamptz;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'cloud');
  end if;
  if char_length(raw) < 1 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;
  if char_length(raw) > 180 then
    raw := left(raw, 180);
  end if;
  select display_name into nm from public.profiles where id = me;
  if nm is null or length(btrim(nm)) < 2 then
    return jsonb_build_object('ok', false, 'reason', 'cloud');
  end if;
  if p_to is null then
    ch := 'world';
  else
    if p_to = me then
      return jsonb_build_object('ok', false, 'reason', 'self');
    end if;
    if not exists (
      select 1 from public.friendships where user_id = me and friend_id = p_to
    ) then
      return jsonb_build_object('ok', false, 'reason', 'notfriend');
    end if;
    if me::text < p_to::text then
      ch := 'dm:' || me::text || ':' || p_to::text;
    else
      ch := 'dm:' || p_to::text || ':' || me::text;
    end if;
  end if;
  insert into public.chat_messages (channel, sender_id, sender_name, body)
  values (ch, me, nm, raw)
  returning id, channel, sender_id, sender_name, body, created_at
  into rid, rch, rsid, rname, rbody, rat;
  return jsonb_build_object(
    'ok', true,
    'id', rid,
    'channel', rch,
    'sender_id', rsid,
    'sender_name', rname,
    'body', rbody,
    'created_at', rat
  );
end;
$$;

revoke all on function public.send_chat(uuid, text) from public;
grant execute on function public.send_chat(uuid, text) to authenticated;
grant execute on function public.unfriend(uuid) to authenticated;
