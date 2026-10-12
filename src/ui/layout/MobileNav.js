const items = MOBILE_NAV_IDS.map((id) => {
  const item = NAV_ITEMS.find((n) => n.id === id);
  if (!item) {
    console.warn(`[MobileNav] id "${id}" tidak ditemukan di NAV_ITEMS`);
    return '';
  }
  const isActive = item.id === active;
  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  return `
    <button class="nav-item${isActive ? ' is-active' : ''}"
            type="button"
            data-nav="${item.id}"${ariaCurrent}>
      <span class="nav-item__icon">${icon(item.icon, 20)}</span>
      <span class="nav-item__label">${item.label}</span>
    </button>
  `;
}).join('');
