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
