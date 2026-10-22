-- ============================================================================
-- UJI PARITAS (opsional, jalankan setelah 15). Hanya membaca; tidak mengubah data.
-- Membandingkan public._company_xp() dengan deriveCompany() di klien untuk contoh input yang sama.
-- Jika ada yang tidak cocok, error "paritas gagal" muncul dan rumus harus diselaraskan.
-- Nilai yang diharapkan dihitung dari src/systems/PlayerProgression.js.
-- ============================================================================
do $$
declare
    x1 integer;
    x2 integer;
begin
    -- Kasus 1: perusahaan menengah di 2003 (klien: xp 603, level 10, batas 10)
    x1 := public._company_xp(50000000, 40000, 3, 25, 12, 3*525600 + 100000, 70, 60, 55, 65, 12.5);
    if x1 <> 603 then raise exception 'paritas gagal kasus 1: server=% klien=603', x1; end if;
    if least(public._level_from_xp(x1::bigint), public._level_cap(2003)) <> 10 then
        raise exception 'paritas gagal level kasus 1';
    end if;

    -- Kasus 2: awal 2000, sangat kuat (klien: xp 1680, level 5 karena batas era 2000)
    x2 := public._company_xp(9e12, 5000000000, 5, 900, 4000, 0, 100, 100, 100, 100, 100);
    if x2 <> 1680 then raise exception 'paritas gagal kasus 2: server=% klien=1680', x2; end if;
    if least(public._level_from_xp(x2::bigint), public._level_cap(2000)) <> 5 then
        raise exception 'paritas gagal level kasus 2';
    end if;

    raise notice 'paritas level perusahaan OK';
end $$;
