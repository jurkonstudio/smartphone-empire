const items = NAV_ITEMS.map((item) => {
  const isActive = item.id === active;
  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  return `
    <button class="nav-item${isActive ? ' is-active' : ''}"
            type="button"
            data-nav="${item.id}"${ariaCurrent}>
      <span class="nav-item__icon">${icon(item.icon, 18)}</span>
      <span class="nav-item__label">${item.label}</span>
      ${item.badge ? `<span class="nav-item__badge">${item.badge}</span>` : ''}
    </button>
  `;
}).join('');
