# Security Policy

Smartphone Empire is a static web game (plain HTML, CSS, and JavaScript) that uses **Supabase** for login, cloud save, player profiles and messages, the Silicon (SIL) wallet, and the admin panel. This document explains what is protected, what is not, and how to report a problem.

## Supported versions

The project is deployed as a single live version, so security fixes are applied only to the latest version.

| Version | Supported |
| ------- | --------- |
| 0.2.x (latest, currently 0.2.5) | ✅ |
| < 0.2 | ❌ |

## How to report a vulnerability

**Do not open a public issue** for a security problem.

1. Use **GitHub Private Vulnerability Reporting**: the *Security* tab → *Report a vulnerability* on the [jurkonstudio/smartphone-empire](https://github.com/jurkonstudio/smartphone-empire) repo.
2. If that feature isn't available, contact the repo owner through the **jurkonstudio** GitHub profile and ask for a private channel. Don't put technical details anywhere public.

Please include: steps to reproduce, the impact you observed, the test account you used, and, if you have one, a suggested fix.

**What you can expect** (this is a one-person project, so these are best-effort targets, not a contractual guarantee):
- Acknowledgement of your report within **7 days**.
- A progress update at least every **14 days** until it is resolved.
- Valid issues are fixed as quickly as possible, and the reporter is credited as the finder if they wish.
- If a report is declined, the reason will be explained.

## Testing rules

Allowed: testing with **your own account** and your own data.
Not allowed: accessing, changing, or deleting other players' data; disrupting the service (DoS, mass spam); submitting fake top-ups or draining other people's SIL; sending mass messages or spam to other players; guessing or mass-collecting Player IDs; and social engineering of admins or players. Findings obtained this way will not be treated as good faith.

## In scope

- The code in this repo (`src/`, `index.html`, `web.html` (landing page), and the `031411/` admin panel). The `tools/` folder holds local test scripts that the game does not load, so it is not a production attack surface.
- The SQL schema and functions in `supabase/` (including `12` and `15` for levels and rewards, `11` for leaderboard validation, and `17` for the leaderboard view) and the Edge Function `supabase/function/advisor-chat`.
- The Supabase services belonging to this project that the game uses.

Out of scope: flaws in Supabase, GitHub, third-party CDNs (jsDelivr, esm.sh, Three.js), or the browser itself (report those to their vendors); attacks that require the victim's device to be already compromised; and findings that are only *best practice* suggestions with no real impact.

Also not a security issue: the game's offline, client-side logic. The simulation (demand, economy, competitors, the 2027–2030 scenario, and the Assembly and component plants) runs in the browser by design, so values in a local save can be changed by the player. See "What is deliberately NOT guaranteed" below.

## Security model (what is protected and where)

The core principle: **client code can be read and modified by anyone, so anything of value must be guarded by the server.**

| Asset | Protection |
| ----- | ---------- |
| SIL balance and ledger | Guarded on the server. Players have no `INSERT/UPDATE/DELETE` rights on `silicon_wallets` and `silicon_ledger`. The credit function `add_silicon` can only be called by `service_role`. SIL spending uses anti-duplicate server functions, and every credit is recorded in the ledger. |
| SIL → cash exchange | Handled on the server (`10-tukar-sil.sql`). The client sends only a package ID, the year, and a `request_id`. The server deducts the SIL and computes the cash amount. Retrying with the same `request_id` returns the earlier result, so SIL is not deducted twice and cash is not granted twice. |
| SIL top-up | Prices and package contents are validated on the server (`_sil_packages`). Orders stay `pending` until an admin approves them, one order cannot be credited twice, and one account can have at most 5 `pending` orders. Payment is currently manual (GoPay only; QRIS is locked) with no automatic provider. The order-by-player-ID function (`create_topup_order_by_public_id`) and `lookup_player_by_public_id` can only be called by `service_role`. |
| SIL transfers between players | Done atomically on the server with ordered two-wallet locking (deadlock-safe), a limit of 5,000 SIL per 24 hours, and a ledger entry. |
| Admin actions | Verified on the server through `is_admin()`, not on the client. The client-side admin gate is cosmetic. The admin table `admin_users` has RLS enabled with no policies and all API rights revoked. The admin panel (`031411/`) is marked `noindex`, but **its secrecy does not depend on its URL**. It signs out after 15 minutes of inactivity and does not keep the session after the tab or browser closes. |
| Player data | *Row Level Security* is enabled on core tables. `SECURITY DEFINER` functions set `search_path`, and their execute rights are revoked from `public/anon` and granted only to the roles that need them. |
| Level, XP, and credibility | The client does **not** send level or XP. The server computes them from raw components (`12-level-kredibilitas-reward.sql` and `15-level-perusahaan.sql`). Derived columns in `profiles` cannot be written directly from the client (`revoke update` on those columns). |
| Level and credibility rewards | Created only by the server and delivered to Messages. Claiming uses an atomic update so a reward can be claimed only **once**, and it is safe against repeated requests caused by network retries. |
| Leaderboard stats | Partly validated (see *What is deliberately NOT guaranteed*): sync frequency is limited, invariants are checked, and profiles that violate them are hidden from the leaderboard until an admin reviews them (`11-validasi-leaderboard.sql`). The `public_profiles` view hides flagged profiles (`15` and `17`). |
| Unique company name | Enforced on the server, including through a trigger on the save path (`14-nama-save-unik.sql`). |
| Player messages | Player-to-player messages support blocking and reporting (reports are visible to admins). The server enforces the rules, not the client. |
| Player input in the UI | Text from players or the server (names, bios, messages, inbox titles) must go through `escapeHtml` (`src/utils/html.js`) or `textContent` before entering `innerHTML`. Spot checks of the Messages panel, profile, and player list show the rule is followed, but there is no automated scan yet (see risk 8). |
| Accessory mockups (0.2.5) | Drawing only. `src/ui/phone/AccessoryMockup.js` produces inline SVG from fixed values in the code. It makes no network calls, loads no external images, and adds no new data, Supabase tables, functions, or secrets. |
| Ecosystem (accessories and App Store, 0.2.4) | Client-side simulation only. `src/systems/EcosystemSystem.js` makes no network calls and adds no Supabase tables, functions, or secrets. It does not touch the SIL wallet or the ledger. Its revenue and commission values are stored in the local save like the other simulation values, so they can be changed by the player (see "What is deliberately NOT guaranteed"). |
| Secrets | There is no `service_role` key or AI API key in client code. The Anthropic key for the Advisor is read only from an Edge Function secret (`ANTHROPIC_API_KEY`). |

### What is deliberately NOT guaranteed

- **The save signature (`src/core/Integrity.js`) is not encryption.** It only makes manual edits to `localStorage` or an exported file easy to detect. The penalty resets SIL to 0 and flags the save (`tamperFlag`). The key lives in client code, so a determined and capable player can still forge it. Real protection is on the server.
- **Leaderboard stats are still reported by the client** (revenue, cash, and so on). The server catches crude forgery (impossible numbers, syncing too often), but values that stay within plausible bounds can still be faked. Full validation would need server-side simulation or auditing, so the ranking is not official. Levels and scores derived from those stats inherit this limit.
- **The Top Up / QRIS lock is client-side only.** The game (`TOPUP_LOCKED` in `src/ui/panels/SiliconStorePanel.js`, mirrored by `STUDIO_TOPUP_LOCKED` in `src/ui/panels/SettingsPanel.js`; QRIS via `locked: true` in `src/data/silicon.data.js`) and the landing page (`web.html`, `TOPUP_LOCKED` / `QRIS_LOCKED`) hide or disable payment, but the server function `create_payment_order` doesn't check any flag or payment method. A logged-in player can still create a `pending` order through the API directly. That order does not automatically credit SIL (it still needs admin approval), but if top-up must be fully closed, the lock needs to be added on the server.
- **Player ID is public.** It is shown on the profile and visible to other players, so don't treat it as a secret and don't use it as proof of identity.
- **The Supabase URL and *publishable key*** in `src/services/cloud/supabase.config.js` are public by design. Data security depends on RLS and function rights, not on keeping that key secret.
- **Local saves are not encrypted.** Anyone using the same device can read them.
- **Game simulation runs on the client.** The economy, demand model, competitor actions, scenario content, and the 0.2.4 ecosystem (accessory sales, App Store commission, and lock-in) are computed in the browser and stored in the local save, so they can be modified by the player. Nothing that holds money-like value (SIL balance, account data) depends on them.

## Known risks

We list these openly so researchers don't waste time on what is already known, but reports with new impact are still welcome.

1. **Business Advisor Edge Function (`advisor-chat`)**: no per-user rate limit yet, and its CORS header is `Access-Control-Allow-Origin: *`. Because it calls a paid API, **don't enable it for a wide public** until a rate limit (for example per user in a Supabase table) and origin restrictions are added. Input is already truncated (question 300 characters, history 6 messages of 280 characters each, context 6,000 characters).
2. **The leaderboard** is based on client numbers that are only partly validated (see above).
3. **QRIS (and the Top Up switch) is locked only on the client** (see above). The landing page also includes the payment QRIS (`qris-gopay.png`) as a public static file.
4. **The global error overlay** in `index.html` shows the message and *stack trace* on screen when a JavaScript error happens, and is not gated by `DEV_BUILD`. It is useful for debugging but leaks file paths to players. Consider hiding it in production.
5. **CDN dependencies**: Three.js (`cdn.jsdelivr.net`, v0.160.0) and `supabase-js` (`cdn.jsdelivr.net` with an `esm.sh` fallback, v2.49.4) are loaded with pinned versions, but there is **no Content-Security-Policy**. Subresource Integrity (SRI) is also missing and can't be applied directly to dynamic `import()`. Fix options: keep a copy of the libraries in the repo (self-host) or use an import map with `integrity` attributes. A CDN compromise would affect every player.
6. **`DEV_BUILD`** must stay `false` in production (`src/config/dev.config.js`).
7. **Player ID enumeration**: the `get_player_by_id` function returns the company name and player name for any ID to a logged-in user, with no rate limit. Because Player IDs are public this is by design, but mass collection is still prohibited (see the testing rules).
8. **No automated XSS scanning yet.** The code has roughly a hundred `innerHTML` call sites and an `escapeHtml` rule, but no linter or test checks them. New components that display player text need a manual check. This applies in particular to the social, Messages, and profile screens.
9. **The admin panel (`031411/`) has a free-form RPC console.** An admin can call any function with JSON arguments. The only safeguard is `is_admin()` on the server, so admin accounts must use a strong password and 2FA.
10. **`supabase/BACA-DULU.md` is incomplete**: it doesn't list SQL files 10–13, 16, or 17. A project that skips a file can lose its protection (for example unique-name validation in `14`, leaderboard validation in `11`, server-side level calculation in `12` and `15`, or the corrected leaderboard view in `17`).
11. **The leaderboard view can be overwritten by older files.** Re-running `03` or `11` after `12`/`15` recreates `public_profiles` without the newer columns (and without hiding flagged profiles). Run `16` to check and `17` to repair.
12. **Two `patches.json` files** (root and `src/`) must stay identical. They were out of sync before 0.2.4 and are now both at 0.2.5. Keep them in sync when editing release notes, because the game reads the root one and fix notices may not reach players otherwise.
13. A comment in `src/core/Integrity.js` still refers to `supabase/hardening.sql`, which has been merged into the numbered files.

## Guidance for people running their own copy

- Replace `SUPABASE_URL` and `SUPABASE_KEY` with your own project's, and run the SQL in `supabase/` **in order** following the README (level chain: `09` → `10` → `11` → `12` → `15`; then optionally `16` to check the schema, and `17` if it reports missing view columns).
- Replace the e-mail in `08-jadikan-admin.sql` with your admin account. Protect that account with a strong password and 2FA at your e-mail provider.
- Replace `qris-gopay.png` with your own payment code, or delete it if you don't open top-up.
- If you want to close top-up, don't rely only on the client flag. Add a check in the `create_payment_order` function (for example a settings table or a flag that only an admin can change).
- Never commit a `service_role` key, tokens, or `.env`. If you already did, **rotate the key now** (deleting the commit is not enough).
- Keep `ANTHROPIC_API_KEY` only as an Edge Function secret (`supabase secrets set`), and add rate limiting and origin restrictions before enabling the Advisor Edge Function publicly.
- Consider adding security headers at your host (CSP, `X-Content-Type-Options`, `Referrer-Policy`). GitHub Pages doesn't allow custom headers, so that needs a CDN or proxy in front.
- Make sure `DEV_BUILD = false` before release.

## Other notes

The QRIS/GoPay image in the repo (`qris-gopay.png`) contains the top-up payment destination. Make sure it contains only an account that is meant to be public, and always match orders in the admin panel before approving them.
