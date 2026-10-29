-- ============================================================
-- 23-blog-masukan.sql — Formulir "Kirim koreksi atau tips" di blog
-- Tabel: blog_feedback. Pengunjung mengirim lewat fungsi blog_kirim_masukan
-- (tanpa akses tulis langsung ke tabel); hanya admin yang boleh membaca,
-- menandai selesai, dan menghapus.
-- Prasyarat: 05-admin-inti.sql (is_admin). Aman dijalankan ulang (idempoten).
-- ============================================================

create table if not exists public.blog_feedback (
    id           uuid primary key default gen_random_uuid(),
    kind         text not null check (kind in ('koreksi', 'tips')),
    message      text not null check (char_length(message) between 10 and 2000),
    article_slug text check (article_slug is null or char_length(article_slug) <= 80),
    contact      text check (contact is null or char_length(contact) <= 120),
    sid          text check (sid is null or char_length(sid) <= 80),
    status       text not null default 'baru' check (status in ('baru', 'selesai')),
    created_at   timestamptz not null default now()
);

create index if not exists blog_feedback_status_idx on public.blog_feedback (status, created_at desc);

alter table public.blog_feedback enable row level security;

drop policy if exists "blog_feedback_admin_all" on public.blog_feedback;
create policy "blog_feedback_admin_all" on public.blog_feedback
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Pengunjung tidak punya izin tabel; hanya admin (login) yang membaca/mengubah.
revoke all on public.blog_feedback from anon;
grant select, update, delete on public.blog_feedback to authenticated;

-- Kirim masukan: validasi di server, kolom jebakan (p_hp) untuk bot,
-- dan pembatas laju (maks 5 per perangkat per jam, 100 total per jam).
create or replace function public.blog_kirim_masukan(
    p_kind text, p_message text, p_slug text default null,
    p_contact text default null, p_sid text default null, p_hp text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_msg text := btrim(coalesce(p_message, ''));
    v_sid text := nullif(btrim(coalesce(p_sid, '')), '');
begin
    -- Bot mengisi kolom jebakan: pura-pura sukses, tidak disimpan.
    if coalesce(p_hp, '') <> '' then return jsonb_build_object('ok', true); end if;
    if p_kind not in ('koreksi', 'tips') then return jsonb_build_object('ok', false, 'error', 'jenis'); end if;
    if char_length(v_msg) < 10 or char_length(v_msg) > 2000 then return jsonb_build_object('ok', false, 'error', 'panjang'); end if;
    if v_sid is not null and (select count(*) from public.blog_feedback where sid = v_sid and created_at > now() - interval '1 hour') >= 5 then
        return jsonb_build_object('ok', false, 'error', 'terlalu_sering');
    end if;
    if (select count(*) from public.blog_feedback where created_at > now() - interval '1 hour') >= 100 then
        return jsonb_build_object('ok', false, 'error', 'terlalu_sering');
    end if;
    insert into public.blog_feedback (kind, message, article_slug, contact, sid)
    values (p_kind, v_msg, left(nullif(btrim(coalesce(p_slug, '')), ''), 80),
            left(nullif(btrim(coalesce(p_contact, '')), ''), 120), left(v_sid, 80));
    return jsonb_build_object('ok', true);
end $$;

revoke all on function public.blog_kirim_masukan(text, text, text, text, text, text) from public;
grant execute on function public.blog_kirim_masukan(text, text, text, text, text, text) to anon, authenticated;

-- Uji cepat (opsional): select public.blog_kirim_masukan('tips', 'Uji coba formulir masukan.');
--                       lalu, sebagai admin: select * from public.blog_feedback;
