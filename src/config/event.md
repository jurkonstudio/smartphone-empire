<!-- FILE: src/config/events.md -->
# Dokumentasi Event — Smartphone Empire

## Waktu
- `time:tick` / `time:day-changed` / `time:month-changed` / `time:year-changed` / `time:speed-changed`

## State
- `state:changed` / `state:cash-changed` / `state:hydrated` / `state:log-changed` / `state:milestone-added`
- `team:changed` / `tip:shown`

## Ekonomi
- `economy:add-revenue` / `economy:month-processed` / `economy:warn-burnrate` / `economy:game-over` / `economy:loan-taken` / `economy:loan-repaid`

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

## Kompetitor (Batch C)
- `competitor:activated` — `{ id, name }` — kompetitor mulai aktif
- `competitor:deactivated` — `{ id, name }` — kompetitor keluar dari pasar
- `competitor:released-product` — `{ competitorId, competitorName, productName, tier, year, month }`
- `competitor:life-event` — `{ competitorId, competitorName, year, text, shareDelta }`

## Pasar
- `market:share-updated` — `{ playerShare, competitors:[{id,name,share}] }`

## Feedback Publik (Batch C)
- `feedback:sentiment-changed` — `{ value }` — sentimen publik 0-100
- `feedback:review-received` — `{ review }` — ulasan baru masuk feed
- `feedback:viral-started` — `{ viral }` — viral event dimulai
- `feedback:viral-ended` — `{ count }` — viral event berakhir
- `feedback:viral-responded` — `{ viralId, responseId }`

## Ulasan (dari ProductSystem)
- `review:received` — `{ productId, review }`

## Quest & Tutorial
- `quest:activated` / `quest:completed`
- `tutorial:step-changed` / `tutorial:completed` / `tutorial:action` / `tutorial:skip` / `tutorial:next` / `tutorial:restart`

## UI
- `ui:modal-open` / `ui:modal-close` / `view:changed` / `toast:show`

## Save
- `save:success` / `save:error` / `save:cleared`

## Era (Batch D)
- `era:changed` — `{ from, to, year }`
