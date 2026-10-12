<!-- FILE: src/config/events.md -->
# Dokumentasi Event — Smartphone Empire

Semua komunikasi antar modul lewat `EventBus` (`src/core/EventBus.js`).

## Waktu (dari TimeSystem)
- `time:tick` — tiap ~250ms — snapshot waktu
- `time:day-changed` — hari berganti — snapshot waktu
- `time:month-changed` — bulan berganti — snapshot waktu
- `time:year-changed` — tahun berganti — snapshot waktu
- `time:speed-changed` — pause/speed berubah — snapshot waktu

## State (dari GameState)
- `state:changed` — state manapun berubah — `stateData`
- `state:cash-changed` — `{ prev, next, delta }`
- `state:hydrated` — state dimuat dari save — `stateData`
- `state:log-changed` — `{ entry }`
- `state:milestone-added` — `{ milestone }`
- `team:changed` — komposisi tim berubah — `{ engineers, designers, marketers }`
- `tip:shown` — `{ id }`

## Ekonomi
- `economy:add-revenue` — revenue tambahan untuk bulan ini — `{ amount }`
- `economy:month-processed` — `{ year, month, income, expense, tax, net, cash, breakdown }`
- `economy:warn-burnrate` — `{ monthsLeft }`
- `economy:game-over` — `{ reason, negativeMonths }`
- `economy:loan-taken` — `{ amount, interestRate }`
- `economy:loan-repaid` — `{ loanId }`

## Riset (dari ResearchSystem)
- `research:started` — `{ nodeId, name, category, cost, durationDays }`
- `research:progress` — `{ active: [{ nodeId, name, progressDays, durationDays, percent, remainingDays }], maxSlots }`
- `research:completed` — `{ nodeId, name, category, effects }`
- `research:cancelled` — `{ nodeId, refund }`
- `research:slots-changed` — `{ maxSlots }`

## OS (dari OSSystem)
- `os:created` — `{ name }`
- `os:version-started` — `{ versionString, features, cost, durationDays }`
- `os:progress` — `{ versionString, progressDays, durationDays, percent, remainingDays }`
- `os:version-released` — `{ versionString, stats, features }`
- `os:version-cancelled` — `{ refund }`
- `os:bug-appeared` — `{ bug }`
- `os:bug-patching` — `{ bugId, name }`
- `os:bug-patched` — `{ bugId, name }`
- `os:bug-ignored` — `{ bugId, name }`
- `os:app-released` — `{ appId, name, appealBonus }`
- `os:updated` — `{ versionId, versionString }`

## Quest & Tutorial
- `quest:activated` — `{ id, title }`
- `quest:completed` — `{ id, title, rewards }`
- `tutorial:step-changed` — `{ stepIndex, step }`
- `tutorial:completed` — `{ skipped }`
- `tutorial:action` — aksi pemain untuk tutorial — `{ id }`
- `tutorial:skip` — pemain lewati tutorial
- `tutorial:next` — pemain klik lanjut
- `tutorial:restart` — minta ulang tutorial

## UI
- `ui:modal-open` — `{ id }`
- `ui:modal-close` — `{ id }`
- `view:changed` — `{ id }`
- `toast:show` — `{ id, message, type, durationMs }`

## Save
- `save:success` — `{ savedAt }`
- `save:error` — `{ error }`
- `save:cleared` — (tanpa payload)

## Era (Batch D)
- `era:changed` — `{ from, to, year }`
