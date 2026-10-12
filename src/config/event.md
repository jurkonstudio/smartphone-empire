<!-- FILE: src/config/events.md -->
# Dokumentasi Event — Smartphone Empire

## Waktu (TimeSystem)
- `time:tick` — tiap ~250ms — snapshot
- `time:day-changed` / `time:month-changed` / `time:year-changed` — snapshot
- `time:speed-changed` — snapshot

## State (GameState)
- `state:changed` — stateData
- `state:cash-changed` — `{ prev, next, delta }`
- `state:hydrated` — stateData
- `state:log-changed` — `{ entry }`
- `state:milestone-added` — `{ milestone }`
- `team:changed` — `{ engineers, designers, marketers }`
- `tip:shown` — `{ id }`

## Ekonomi
- `economy:add-revenue` — `{ amount }`
- `economy:month-processed` — `{ year, month, income, expense, tax, net, cash, breakdown }`
- `economy:warn-burnrate` — `{ monthsLeft }`
- `economy:game-over` — `{ reason, negativeMonths }`
- `economy:loan-taken` / `economy:loan-repaid`

## Riset
- `research:started` — `{ nodeId, name, category, cost, durationDays }`
- `research:progress` — `{ active:[...], maxSlots }`
- `research:completed` — `{ nodeId, name, category, effects }`
- `research:cancelled` — `{ nodeId, refund }`
- `research:slots-changed` — `{ maxSlots }`

## OS
- `os:created` — `{ name }`
- `os:version-started` — `{ versionString, features, cost, durationDays }`
- `os:progress` — `{ versionString, progressDays, durationDays, percent, remainingDays }`
- `os:version-released` — `{ versionString, stats, features }`
- `os:version-cancelled` — `{ refund }`
- `os:bug-appeared` / `os:bug-patching` / `os:bug-patched` / `os:bug-ignored` — `{ bug }` / `{ bugId, name }`
- `os:app-released` — `{ appId, name, appealBonus }`
- `os:updated` — `{ versionId, versionString }`

## Produk (Batch B)
- `product:development-started` — `{ productId, name, phases }`
- `product:development-progress` — `{ productId, name, phase, percentOverall, remainingDays }`
- `product:phase-changed` — `{ productId, phase }`
- `product:development-cancelled` — `{ productId, refund }`
- `product:released` — `{ productId, name, score }`
- `product:daily-sales-processed` — `{ totalRevenue }`
- `product:stock-out` — `{ productId, name }`
- `product:campaign-started` — `{ productId, campaignId }`
- `product:discontinued` — `{ productId, fireSale }`

## Pasar (Batch B — dasar)
- `market:share-updated` — `{ playerShare, competitors:[{id,name,share}] }`

## Ulasan (Batch B)
- `review:received` — `{ productId, review }`

## Quest & Tutorial
- `quest:activated` / `quest:completed`
- `tutorial:step-changed` / `tutorial:completed` / `tutorial:action` / `tutorial:skip` / `tutorial:next` / `tutorial:restart`

## UI
- `ui:modal-open` / `ui:modal-close` — `{ id }`
- `view:changed` — `{ id }`
- `toast:show` — `{ id, message, type, durationMs }`

## Save
- `save:success` / `save:error` / `save:cleared`

## Era (Batch D)
- `era:changed` — `{ from, to, year }`
