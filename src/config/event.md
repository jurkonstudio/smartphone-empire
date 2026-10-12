<!-- FILE: src/config/events.md -->
# Dokumentasi Event — Smartphone Empire

Semua komunikasi antar modul lewat `EventBus` (`src/core/EventBus.js`).
Format: **`nama:event`** — deskripsi — payload.

## Waktu (dari TimeSystem)
- `time:tick` — dipanggil tiap ~250ms — `{ currentYear, currentMonth, currentDay, currentHour, currentMinute, elapsedGameMinutes, isPaused, gameSpeed }`
- `time:day-changed` — hari berganti — snapshot waktu
- `time:month-changed` — bulan berganti — snapshot waktu
- `time:year-changed` — tahun berganti — snapshot waktu
- `time:speed-changed` — pause/speed berubah — snapshot waktu

## State (dari GameState)
- `state:changed` — state manapun berubah — `stateData`
- `state:cash-changed` — uang berubah — `{ prev, next, delta }`
- `state:hydrated` — state dimuat dari save — `stateData`
- `state:log-changed` — log baru ditambahkan — `{ entry }`
- `state:milestone-added` — milestone baru — `{ milestone }`

## Ekonomi
- `economy:month-processed` — akhir bulan diproses — `{ year, month, income, expense, net, cash, breakdown }`
- `economy:warn-burnrate` — sisa uang < 2 bulan biaya — `{ monthsLeft }`
- `economy:game-over` — 2 bulan berturut negatif — `{ reason, negativeMonths }`
- `economy:loan-taken` — pinjaman diambil — `{ amount, interestRate }`
- `economy:loan-repaid` — pinjaman lunas — `{ loanId }`

## Tim
- `team:recruited` — anggota baru — `{ role, count, cost }`
- `team:changed` — komposisi berubah — `{ engineers, designers, marketers }`

## Quest & Tutorial
- `quest:activated` — `{ id, title }`
- `quest:completed` — `{ id, title, rewards }`
- `tutorial:step-changed` — `{ stepIndex, step }`
- `tutorial:completed` — `{ skipped: boolean }`
- `tip:shown` — `{ id }`

## UI
- `ui:modal-open` — `{ id, payload }`
- `ui:modal-close` — `{ id }`
- `view:changed` — `{ id }`
- `toast:show` — `{ id, message, type, durationMs }`

## Save
- `save:success` — `{ savedAt }`
- `save:error` — `{ error }`
- `save:cleared` — (tanpa payload)

## Era (Tahap 4)
- `era:changed` — `{ from, to, year }`
