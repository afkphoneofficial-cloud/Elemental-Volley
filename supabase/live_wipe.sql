-- เปิดจริง 10 ต.ค. 2026: คืนชื่อให้จองใหม่ทุกไอดี
-- SQL Editor วางทั้งไฟล์แล้ว Run ครั้งเดียว ก่อนหรือเช้าวันเปิดเซิร์ฟก็ได้
-- ฟังก์ชันจะไม่ทำงานก่อนวันที่ 10 ต.ค. ตามนาฬิกากรุงเทพ
-- บัญชี Google เดิมยังเป็นคนเดิม ของที่ซื้อแล้วอยู่ในเซฟ ฉายาผู้ทดสอบกับของขวัญเบต้าเกมเก็บให้เอง

create table if not exists public.app_flags (
  key text primary key,
  at timestamptz not null default now()
);

alter table public.app_flags enable row level security;

create or replace function public.claim_live_wipe()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bangkok date := (timezone('Asia/Bangkok', now()))::date;
  did boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if bangkok < date '2026-10-10' then
    return false;
  end if;

  begin
    insert into public.app_flags (key, at)
    values ('live-wipe-2026-10-10', now());
    did := true;
  exception
    when unique_violation then
      did := false;
  end;

  if did then
    update public.profiles
      set display_name = null,
          display_name_set_at = null
      where display_name is not null;
    begin delete from public.chat_messages; exception when undefined_table then null; end;
    begin delete from public.mail; exception when undefined_table then null; end;
    begin delete from public.friendships; exception when undefined_table then null; end;
    begin delete from public.friend_requests; exception when undefined_table then null; end;
  end if;

  return did;
end;
$$;

revoke all on function public.claim_live_wipe() from public;
grant execute on function public.claim_live_wipe() to authenticated;

-- บังคับคืนชื่อทันทีหลังรันไฟล์นี้ (ถ้ายังไม่ถึงวันเปิด บล็อกด้านบนจะไม่ทำงาน — ใช้บล็อกนี้แทนตอนพร้อมเปิด)
-- เอาเครื่องหมายคอมเมนต์ออกเฉพาะเช้าวันเปิดเซิร์ฟถ้ายังไม่มีใครล็อกอิน

-- insert into public.app_flags (key, at)
-- values ('live-wipe-2026-10-10', now())
-- on conflict (key) do nothing;
-- update public.profiles set display_name = null, display_name_set_at = null where display_name is not null;
-- delete from public.chat_messages;
-- delete from public.mail;
-- delete from public.friendships;
-- delete from public.friend_requests;
