<!-- FILE: src/config/events.md -->
# Dokumentasi Event — Smartphone Empire

## Waktu
- `time:tick` / `time:day-changed` / `time:month-changed` / `time:year-changed` / `time:speed-changed`

## State
- `state:changed` / `state:cash-changed` / `state:hydrated` / `state:log-changed` / `state:milestone-added`
- `team:changed` / `tip:shown`

## Tema
- `theme:changed` — `{ theme, accent }`

## Ekonomi
- `economy:add-revenue` / `economy:month-processed` / `economy:warn-burnrate` / `economy:game-over` / `economy:loan-taken` / `economy:loan-repaid`

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
- `product:stock-out` / `product:campaign-started` / `product:discontinued` / `product:auto-restocked`

## Chip (BARU)
- `chip:design-started` — `{ chipId, name }` — mulai desain chip
- `chip:design-progress` — `{ chipId, name, percent, progressDays, durationDays, remainingDays }`
- `chip:design-cancelled` — `{ chipId, refund }`
- `chip:released` — `{ chipId, name, stats }` — chip selesai didesain

## Fab (BARU)
- `fab:build-started` — `{ level, name }` — mulai bangun fab
- `fab:upgrade-started` — `{ level, name }` — mulai upgrade
- `fab:progress` — `{ percent, isBuild, targetLevel }`
- `fab:built` — `{ level }` — fab selesai dibangun
- `fab:upgraded` — `{ level }` — fab selesai di-upgrade
- `fab:production-started` — `{ chipId, qty }` — mulai produksi chip
- `fab:production-progress` — `{ chipId, percent, progressUnits, totalUnits }`
- `fab:production-completed` — `{ chipId, qty }`

## Kompetitor
- `competitor:activated` / `competitor:deactivated` / `competitor:released-product` / `competitor:life-event`
- `competitor:action` — `{ competitorId, competitorName, action, delta, modifier, untilTick, source, year, month }` — aksi dinamis kompetitor (`source`: 'pool' | 'release'); 'diam' tidak di-emit
- `competitor:threat` — `{ playerShare, previousShare, threshold, topCompetitorId, topCompetitorName, topCompetitorShare, year, month }` — share pemain turun melewati threshold (sekali per crossing)

## Pasar
- `market:share-updated`

## Feedback Publik
- `feedback:sentiment-changed` / `feedback:review-received` / `feedback:viral-started` / `feedback:viral-ended` / `feedback:viral-responded`

## Ulasan (produk)
- `review:received`

## Cloud (stub)
- `cloud:status-changed` / `cloud:sync-start` / `cloud:sync-success` / `cloud:sync-error`

## Event Pilihan Era (2000–2002)
- `eraevent:pending` — `{ event }` — event menunggu keputusan pemain (UI membuka modal dan menjeda game)
- `eraevent:resolved` — `{ eventId, choiceId, event, choice }` — pemain memilih; efek sudah diterapkan

## Quest & Tutorial
- `quest:activated` / `quest:completed` / `quest:expired` — `{ id, title }` — quest era bertenggat lewat batas waktu tanpa selesai
- `tutorial:step-changed` / `tutorial:completed` / `tutorial:action` / `tutorial:skip` / `tutorial:next` / `tutorial:restart`

## UI
- `ui:modal-open` / `ui:modal-close` / `view:changed` / `toast:show`

## Save
- `save:success` / `save:error` / `save:cleared`

## Era
- `era:changed` — `{ from, to, year }`

## Insiden Dinamis (BARU)
Memakai event bus yang sama dengan event era: `eraevent:pending` (`{ event }`, `event.kind === 'dynamic'` untuk insiden acak) dan `eraevent:resolved` (`{ eventId, choiceId, event, choice, roll }`, `roll` = 'success' | 'fail' | null untuk pilihan berisiko).
