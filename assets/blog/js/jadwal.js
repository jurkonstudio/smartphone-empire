// Halaman Jadwal rilis (publik): linimasa per bulan + tabel perbandingan spek.
export const SPEC_KEYS = ['chipset', 'layar', 'ram', 'kamera', 'baterai', 'harga'];

const T = {
  id: { all: 'Semua', rumor: 'Rumor', dikonfirmasi: 'Dikonfirmasi', resmi: 'Resmi', tba: 'Tanggal belum pasti', past: 'Sudah lewat',
    today: 'Hari ini', tomorrow: 'Besok', inDays: (n) => `${n} hari lagi`, ago: (n) => `${n} hari lalu`,
    compare: 'Bandingkan', cmpTitle: 'Perbandingan spek', cmpHint: 'Centang 2–3 perangkat yang punya data spek untuk membandingkannya.',
    cmpOne: 'Pilih satu perangkat lagi.', cmpMax: 'Maksimal 3 perangkat.', clear: 'Kosongkan', source: 'Sumber', edit: 'Ubah',
    empty: 'Belum ada jadwal rilis.', emptyF: 'Tidak ada jadwal dengan status ini.', date: 'Jadwal', status: 'Status', soon: 'Segera',
    rumorNote: 'Spek perangkat berstatus Rumor belum dikonfirmasi produsen.', disclaimer: 'Tanggal dan spek dapat berubah. Rumor belum dikonfirmasi produsen.',
    spec: { chipset: 'Chipset', layar: 'Layar', ram: 'RAM', kamera: 'Kamera', baterai: 'Baterai', harga: 'Harga' }, filter: 'Filter status' },
  en: { all: 'All', rumor: 'Rumor', dikonfirmasi: 'Confirmed', resmi: 'Official', tba: 'Date not yet known', past: 'Already passed',
    today: 'Today', tomorrow: 'Tomorrow', inDays: (n) => `in ${n} days`, ago: (n) => `${n} days ago`,
    compare: 'Compare', cmpTitle: 'Spec comparison', cmpHint: 'Tick 2–3 devices that have spec data to compare them.',
    cmpOne: 'Pick one more device.', cmpMax: 'Maximum 3 devices.', clear: 'Clear', source: 'Source', edit: 'Edit',
    empty: 'No release schedule yet.', emptyF: 'No schedule entries with this status.', date: 'Date', status: 'Status', soon: 'Soon',
    rumorNote: 'Specs for devices marked Rumor are not confirmed by the manufacturer.', disclaimer: 'Dates and specs may change. Rumors are not confirmed by the manufacturer.',
    spec: { chipset: 'Chipset', layar: 'Display', ram: 'RAM', kamera: 'Camera', baterai: 'Battery', harga: 'Price' }, filter: 'Status filter' }
};

let filter = 'all';
let pastOpen = false;
const picked = [];            // id perangkat yang dicentang, urut sesuai pilihan
let last = null;              // argumen render terakhir (untuk render ulang saat interaksi)

const hasSpecs = (r) => !!(r.specs && typeof r.specs === 'object' && SPEC_KEYS.some((k) => r.specs[k]));

export function renderSchedule(el, releases, ctx) {
  last = { el, releases, ctx };
  const { esc, safeUrl, lang, tz, isAdmin } = ctx;
  const L = T[lang] || T.id;
  const loc = lang === 'en' ? 'en-US' : 'id-ID';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz });
  const dayNum = (d) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 864e5);
  const at = (d) => new Date(d + 'T00:00:00+07:00');
  const fmt = (d, o) => at(d).toLocaleDateString(loc, { ...o, timeZone: tz });

  // buang pilihan yang sudah tidak ada
  for (let i = picked.length - 1; i >= 0; i--) if (!releases.some((r) => r.id === picked[i])) picked.splice(i, 1);

  const shown = releases.filter((r) => filter === 'all' || r.status === filter);
  const dated = shown.filter((r) => r.expected_date);
  const upcoming = dated.filter((r) => dayNum(r.expected_date) >= 0).sort((a, b) => a.expected_date.localeCompare(b.expected_date));
  const past = dated.filter((r) => dayNum(r.expected_date) < 0).sort((a, b) => b.expected_date.localeCompare(a.expected_date));
  const tba = shown.filter((r) => !r.expected_date);

  const countdown = (d) => {
    const n = dayNum(d);
    if (n === 0) return L.today;
    if (n === 1) return L.tomorrow;
    return n > 0 ? L.inDays(n) : L.ago(-n);
  };

  const card = (r) => {
    const src = safeUrl(r.source_url);
    const pick = hasSpecs(r)
      ? `<label class="sch-pick"><input type="checkbox" data-sch-pick="${esc(r.id)}"${picked.includes(r.id) ? ' checked' : ''}${!picked.includes(r.id) && picked.length >= 3 ? ' disabled' : ''}> ${L.compare}</label>` : '';
    const dateBox = r.expected_date
      ? `<div class="sch-date" aria-hidden="true"><b>${esc(fmt(r.expected_date, { day: 'numeric' }))}</b><span>${esc(fmt(r.expected_date, { month: 'short' }))}</span></div>`
      : `<div class="sch-date tba" aria-hidden="true"><b>?</b><span>${esc(r.expected_label || '')}</span></div>`;
    const when = r.expected_date ? `${fmt(r.expected_date, { day: 'numeric', month: 'long', year: 'numeric' })} · ${countdown(r.expected_date)}` : (r.expected_label || L.tba);
    return `<article class="sch-card st-${esc(r.status)}">
      ${dateBox}
      <div class="sch-main">
        <div class="sch-top"><strong>${esc(r.device_name)}</strong><span class="tag st-${esc(r.status)}">${esc(L[r.status] || r.status)}</span></div>
        <small>${esc(r.brand || '')}${r.brand ? ' · ' : ''}${esc(when)}</small>
        ${r.notes ? `<p>${esc(r.notes)}</p>` : ''}
        <div class="sch-foot">
          ${src ? `<a href="${esc(src)}" target="_blank" rel="noopener nofollow">${L.source} ↗</a>` : ''}
          ${pick}
          ${isAdmin ? `<button class="act" type="button" data-edit-release="${esc(r.id)}">${L.edit}</button>` : ''}
        </div>
      </div></article>`;
  };

  // kelompok per bulan
  let monthsHtml = '';
  let curKey = '';
  upcoming.forEach((r) => {
    const key = r.expected_date.slice(0, 7);
    if (key !== curKey) {
      if (curKey) monthsHtml += '</div></section>';
      curKey = key;
      monthsHtml += `<section class="sch-month"><h3>${esc(fmt(r.expected_date, { month: 'long', year: 'numeric' }))}</h3><div class="sch-list">`;
    }
    monthsHtml += card(r);
  });
  if (curKey) monthsHtml += '</div></section>';
  if (tba.length) monthsHtml += `<section class="sch-month"><h3>${L.tba}</h3><div class="sch-list">${tba.map(card).join('')}</div></section>`;
  if (past.length) monthsHtml += `<details class="sch-past"${pastOpen ? ' open' : ''}><summary>${L.past} (${past.length})</summary><div class="sch-list">${past.map(card).join('')}</div></details>`;

  // tabel perbandingan
  let cmp = '';
  if (releases.some(hasSpecs)) {
    const devs = picked.map((id) => releases.find((r) => r.id === id)).filter(Boolean);
    let body = `<p class="sch-hint">${L.cmpHint}</p>`;
    if (devs.length === 1) body = `<p class="sch-hint">${L.cmpOne}</p>`;
    if (devs.length >= 2) {
      const rows = [];
      rows.push(`<tr><th scope="row">${L.date}</th>${devs.map((d) => `<td>${esc(d.expected_date ? fmt(d.expected_date, { day: 'numeric', month: 'short', year: 'numeric' }) : (d.expected_label || '—'))}</td>`).join('')}</tr>`);
      rows.push(`<tr><th scope="row">${L.status}</th>${devs.map((d) => `<td><span class="tag st-${esc(d.status)}">${esc(L[d.status] || d.status)}</span></td>`).join('')}</tr>`);
      SPEC_KEYS.filter((k) => devs.some((d) => d.specs && d.specs[k])).forEach((k) => {
        const vals = devs.map((d) => (d.specs && d.specs[k]) || '');
        const diff = new Set(vals.map((v) => v.toLowerCase())).size > 1;
        rows.push(`<tr${diff ? ' class="diff"' : ''}><th scope="row">${L.spec[k]}</th>${vals.map((v) => `<td>${v ? esc(v) : '—'}</td>`).join('')}</tr>`);
      });
      body = `<div class="sch-scroll"><table class="sch-table"><thead><tr><th></th>${devs.map((d) => `<th scope="col">${esc(d.device_name)}${d.brand ? `<small>${esc(d.brand)}</small>` : ''}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
        + (devs.some((d) => d.status === 'rumor') ? `<p class="sch-hint">${L.rumorNote}</p>` : '');
    }
    cmp = `<section class="sch-cmp" aria-labelledby="schCmpT"><div class="sch-cmp-head"><h2 id="schCmpT">${L.cmpTitle}</h2>${picked.length ? `<button class="act" type="button" data-sch-clear>${L.clear}</button>` : ''}</div>${body}</section>`;
  }

  const chips = ['all', 'rumor', 'dikonfirmasi', 'resmi'].map((k) =>
    `<button type="button" class="sch-chip${filter === k ? ' on' : ''}" data-sch-filter="${k}" aria-pressed="${filter === k}">${L[k]}</button>`).join('');

  const empty = !releases.length ? `<p class="sch-empty">${L.empty}</p>` : (!shown.length ? `<p class="sch-empty">${L.emptyF}</p>` : '');
  el.innerHTML = `${releases.length ? `<div class="sch-chips" role="group" aria-label="${L.filter}">${chips}</div>` : ''}${cmp}${empty}${monthsHtml}${releases.length ? `<p class="sch-disc">${L.disclaimer}</p>` : ''}`;

  if (!el.dataset.bound) {
    el.dataset.bound = '1';
    el.addEventListener('click', (e) => {
      const f = e.target.closest('[data-sch-filter]');
      if (f) { filter = f.dataset.schFilter; rerender(); return; }
      if (e.target.closest('[data-sch-clear]')) { picked.length = 0; rerender(); }
    });
    el.addEventListener('change', (e) => {
      const c = e.target.closest('[data-sch-pick]');
      if (!c) return;
      const id = c.dataset.schPick;
      const i = picked.indexOf(id);
      if (i >= 0) picked.splice(i, 1); else if (picked.length < 3) picked.push(id);
      rerender();
      const again = el.querySelector(`[data-sch-pick="${CSS.escape(id)}"]`);
      if (again) again.focus();
    });
    el.addEventListener('toggle', (e) => { if (e.target.matches && e.target.matches('.sch-past')) pastOpen = e.target.open; }, true);
  }
}

function rerender() { if (last) renderSchedule(last.el, last.releases, last.ctx); }
