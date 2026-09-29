-- ป้ายซีซั่นบนกระดาน/แชท (รันครั้งเดียวใน SQL Editor)
-- อ่าน seasonMark จาก save_data โดยไม่เปิด save ทั้งก้อนให้คนอื่น

create or replace function public.public_season_marks(p_ids uuid[])
returns table (
  id uuid,
  season_mark jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(p.save_data->'seasonMark', '{}'::jsonb) as season_mark
  from public.profiles p
  where p.id = any (p_ids);
$$;

revoke all on function public.public_season_marks(uuid[]) from public;
grant execute on function public.public_season_marks(uuid[]) to authenticated;
