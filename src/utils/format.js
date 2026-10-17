const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return '$' + Math.round(value).toLocaleString('en-US');
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-US');
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}%`;
}

export function monthShort(month) {
  const idx = Math.max(0, Math.min(11, (month | 0) - 1));
  return MONTHS_SHORT[idx];
}

export function formatMonthYear(year, month) {
  return `${monthShort(month)} ${year}`;
}

// [v2027.31a] Uang ringkas untuk UI mobile: 4097004 -> "$4.1M", 191055 -> "$191K".
// Satu-satunya formatter ringkas; dipakai Hero, stat, chart, dan tooltip.
// opts.plus = true  -> angka positif diberi awalan "+".
export function formatCompactMoney(value, opts) {
  const v = Number(value);
  if (value == null || !Number.isFinite(v)) return '—';
  const sign = v < 0 ? '-' : (opts && opts.plus && v > 0 ? '+' : '');
  const abs = Math.abs(v);
  const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  const fmt = (n) => String(n >= 100 ? Math.round(n) : Math.round(n * 10) / 10);
  for (let i = 0; i < units.length; i++) {
    if (abs >= units[i][0]) {
      let txt = fmt(abs / units[i][0]);
      let unit = units[i][1];
      // 999.999K -> "1000K" harus naik jadi "1M"
      if (Number(txt) >= 1000 && i > 0) {
        txt = fmt(abs / units[i - 1][0]);
        unit = units[i - 1][1];
      }
      return sign + '$' + txt + unit;
    }
  }
  return sign + '$' + Math.round(abs);
}

// [v2027.31a] Skor 0-100 untuk tampilan: 18.966173739318037 -> 19.
// Hanya untuk tampilan; nilai di state (hasil smoothing) tidak diubah.
export function roundScore(value) {
  const v = Number(value);
  if (value == null || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
