<!-- FILE: src/config/events.md -->
# Dokumentasi Event — Smartphone Empire

## Waktu
- `time:tick` / `time:day-changed` / `time:month-changed` / `time:year-changed` / `time:speed-changed`

## State
- `state:changed` / `state:cash-changed` / `state:hydrated` / `state:log-changed` / `state:milestone-added`
- `team:changed` / `tip:shown`

## Tema
- `theme:changed` — `{ theme: 'dark'|'light', accent: 'blue'|'emerald'|'violet'|'amber'|'rose'|'cyan' }`

## Ekonomi
- `economy:add-revenue` / `economy:month-processed` / `economy:warn-burnrate` / `economy:game-over`
- `economy:loan-taken` / `economy:loan-repaid`

## Tim
- `team:recruited` / `team:fired` / `team:skill-up` / `team:candidates-refreshed`

## Riset
- `research:started` / `research:progress` / `research:completed` / `research:cancelled` / `research:slots-changed`

## OS
- `os:created` / `os:version-started` / `os:progress` / `os:version-released` / `os:version-cancelled`
- `os:bug-appeared` / `os:bug-patching` / `os:bug-patched` / `os:bug-ignored`
- `os:app-released` / `os:updated`

## Produk
- `product:development-started` / `product:development-progress` / `product:phase-changed`
- `product:development-cancelled` / `product:released` / `product:daily-sales-processed`
- `product:stock-out` / `product:campaign-started` / `product:discontinued`
- `product:auto-restocked` — `{ productId, name, qty, cost }`

## Kompetitor
- `competitor:activated` / `competitor:deactivated`
- `competitor:released-product` / `competitor:life-event`

## Pasar
- `market:share-updated`

## Feedback Publik
- `feedback:sentiment-changed` / `feedback:review-received`
- `feedback:viral-started` / `feedback:viral-ended` / `feedback:viral-responded`

## Ulasan
- `review:received`

## Cloud (stub, akan aktif di update mendatang)
- `cloud:status-changed` — `{ status: 'disconnected'|'connecting'|'connected'|'error' }`
- `cloud:sync-start` — `{ direction: 'up'|'down' }`
- `cloud:sync-success` — `{ direction, at }`
- `cloud:sync-error` — `{ direction, message }`

## Quest & Tutorial
- `quest:activated` / `quest:completed`
- `tutorial:step-changed` / `tutorial:completed` / `tutorial:action` / `tutorial:skip` / `tutorial:next` / `tutorial:restart`

## UI
- `ui:modal-open` / `ui:modal-close` / `view:changed` / `toast:show`

## Save
- `save:success` / `save:error` / `save:cleared`

## Era
- `era:changed` — `{ from, to, year }`
