-- เปิดเล่นทันทีแบบ Guest: Authentication → Providers → Anonymous ต้องเปิด
-- แล้ว Run ไฟล์นี้ (trigger เดิมบล็อก user ที่ไม่มี Gmail)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mail text;
begin
  mail := lower(coalesce(new.email, ''));
  if mail = '' then
    return new;
  end if;
  if mail not like '%@gmail.com' and mail not like '%@googlemail.com' then
    raise exception 'gmail_only';
  end if;
  insert into public.profiles (id, email)
  values (new.id, mail)
  on conflict (id) do nothing;
  return new;
end;
$$;
