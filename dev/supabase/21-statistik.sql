-- 21-statistik.sql — statistik pengunjung blog (tanpa IP, tanpa cookie pelacak pihak ketiga)
-- Prasyarat: 20-blog.sql dan fungsi is_admin(). Aman dijalankan ulang.
create table if not exists public.blog_views (
  id bigint generated always as identity primary key,
  post_id uuid references public.blog_posts(id) on delete cascade,
  path text not null check (char_length(path) <= 200),
  sid text not null check (char_length(sid) between 8 and 64),
  ref text check (ref is null or char_length(ref) <= 120),
  device text check (device in ('mobile','tablet','desktop')),
  created_at timestamptz not null default now()
);
create index if not exists blog_views_time_idx on public.blog_views (created_at desc);
create index if not exists blog_views_post_idx on public.blog_views (post_id, created_at desc);
alter table public.blog_views enable row level security;
revoke all on table public.blog_views from anon, authenticated;

create or replace function public.blog_track(p_slug text, p_path text, p_sid text, p_ref text, p_device text)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if p_path is null or p_sid is null then return; end if;
  if p_slug is not null then select id into pid from blog_posts where slug = p_slug and status = 'published'; end if;
  if exists (select 1 from blog_views where sid = p_sid and path = left(p_path,200) and created_at > now() - interval '30 minutes') then return; end if;
  insert into blog_views (post_id, path, sid, ref, device)
  values (pid, left(p_path,200), left(p_sid,64), nullif(left(coalesce(p_ref,''),120),''), case when p_device in ('mobile','tablet','desktop') then p_device end);
end $$;
grant execute on function public.blog_track(text,text,text,text,text) to anon, authenticated;

create or replace function public.blog_stats(p_days int default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d int := least(greatest(coalesce(p_days,30),1),365); since timestamptz; t0 timestamptz; res jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  t0 := date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  since := t0 - make_interval(days => d - 1);
  select jsonb_build_object(
    'totals', (select jsonb_build_object('views',count(*),'visitors',count(distinct sid)) from blog_views where created_at >= since),
    'today',  (select jsonb_build_object('views',count(*),'visitors',count(distinct sid)) from blog_views where created_at >= t0),
    'all_views', (select count(*) from blog_views),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', g::date, 'views', coalesce(v.views,0), 'visitors', coalesce(v.vis,0)) order by g), '[]'::jsonb)
              from generate_series((since at time zone 'Asia/Jakarta')::date, (now() at time zone 'Asia/Jakarta')::date, interval '1 day') g
              left join (select (created_at at time zone 'Asia/Jakarta')::date as day, count(*) views, count(distinct sid) vis from blog_views where created_at >= since group by 1) v on v.day = g::date),
    'posts', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
               select p.slug, p.title, count(v.id) as views, count(distinct v.sid) as visitors
               from blog_posts p left join blog_views v on v.post_id = p.id and v.created_at >= since
               where p.status = 'published' group by p.id order by count(v.id) desc, p.published_at desc nulls last limit 20) x),
    'refs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
               select coalesce(ref,'langsung') as name, count(*) as n from blog_views where created_at >= since group by 1 order by 2 desc limit 8) x),
    'devices', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
               select coalesce(device,'desktop') as name, count(*) as n from blog_views where created_at >= since group by 1 order by 2 desc) x)
  ) into res;
  return res;
end $$;
grant execute on function public.blog_stats(int) to authenticated;
