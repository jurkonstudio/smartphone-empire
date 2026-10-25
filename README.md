<div align="center">

# JURKON STUDIO

### Smartphone Empire

**Build a phone company from scratch. Start on January 1, 2000, take on Nokia, Apple, Samsung, and 28 other rivals, ride the industry through the touchscreen, AI, and foldable eras, and carry on into a speculative 2027–2030 scenario.**

Created by **Kalfin Agus Setiawan** under the **Jurkon Studio** banner.

[🎮 Play the game](https://www.smartphone-empire.my.id/) · [🐛 Report a bug](https://github.com/jurkonstudio/smartphone-empire/issues) · [🔒 Security policy](SECURITY.md)

</div>

---

## Why this game exists

I love simulation games, but I couldn't find one that really tells the story of **how the mobile phone evolved from the beginning until today**. It felt like it would be great to start as a tiny company in 2000, compete with Nokia at the height of its power, and slowly climb while watching the whole industry change, from monochrome candybars to foldables.

This is a fan project, not a commercial product. It has no affiliation with Nokia, Apple, Samsung, or any other company.

---

## Gameplay

You are the CEO of a phone company founded on January 1, 2000. Starting cash is limited: **$200K / $100K / $50K** on Easy (Santai) / Normal / Hard (Sulit).

Your job:

- Hire engineers, designers, and marketers
- Research technology so you don't fall behind
- Build your own OS, or license a third-party one (more expensive)
- Design phones, manufacture them (with your own component plants and assembly factory if you want), release them, then read the reviews and public reaction
- Manage money: salaries, rent, tax, loans, deposits, stocks, and plant investment
- Don't go bankrupt. Negative cash for **2 months in a row** means game over

Time runs in real time: **1 game day = 60 seconds**. You can pause or speed up to 2x, 5x, or 10x. While you work, competitors move too: they release products, climb research tiers, and take market share. **Historical life events** also shape the run. In 2007 the iPhone arrives and Nokia starts to wobble. If you were in Nokia's seat, what would you do?

The real-world timeline in the game stops at 2026. After that (2027–2030) the game uses a **speculative scenario**: a memory crisis and price hikes, Agentic AI phones, EU battery rules, and a fictional newcomer. All scenario content is tagged `speculative` in the data and is not fact or an official forecast.

A season ends when the game date enters **2051** (the `endYear` limit of 2050 in `src/config/endgame.config.js`). The final score is calculated from milestones, products in your catalog, completed research, active staff, and net worth.

---

## What's in the game

The numbers below were counted directly from the data files in this repo (v0.2.8; the subscription services added no new counted items).

### 🧭 Navigation

Bottom bar: **Home · HQ · Research · Products · Market · Settings**.

- **Home** has a **Campus | Office** switch (3D campus map or 3D office map).
- **HQ** has 6 sub-tabs: **Overview, Team, Exchange, Bank, Invest, History**.
- **Research** has 4 sub-tabs: **Tech, OS, Manufacturing, Chip**. **Products** has 5: **Design, Catalog, Accessories, Sales, Chip** (Chip appears only once the Chip Lab is unlocked). **Market** has 8: **Share, Competitors, Trends, Promo, Channels, Service, Ecosystem, Public**.
- The desktop layout has its own styling (`desktop.css`), so the game is comfortable on wide screens, not only on phones.

### 🏢 Campus, Office, and Team

- **3D Campus map** on Home: buildings grow and level up as you progress (HQ, R&D Lab, Chip Plant, Flagship Store, OS Center, Billboard, Monument, and more). Building style follows the era, there is a day and night cycle that follows the theme, and the city is animated.
  - The **Manufacturing Island** is linked to the campus by a bridge. Trucks cross between the two islands, and the camera can pan over to it.
- **3D Office map** (Home → Office): an isometric office interior with **9 rooms** connected to game data.
  - Staff sit at desks. Color shows their role and a small orb shows morale.
  - The lab shows active research, the server rack shows OS version and bugs, and the showroom shows the products on sale.
  - Rooms whose requirements aren't met appear locked.
  - Tap a room for an info card and shortcuts to the related panel. From that card you can build or upgrade a Fab (the construction grows in 3D as it progresses) and train staff without switching panels.
  - Tap a staff member for a detail card with "Manage Team" and training buttons.
  - The Work room has a **Recruit** button that opens recruit mode in the Team panel.
- **Team**: 3 roles (Engineer, Designer, Marketer), 5 skill tiers (Junior to Principal), 8 traits, and candidates from **9 regions** (US, Europe, Japan, Korea, China, India, Indonesia, Russia, Latin America). Up to 20 people per role. Skills grow over time, and morale and salary change with them.
  - New hires need **24 game hours** to onboard before they join.
  - The staff detail card has a **View in office** button that jumps to the office map and highlights that person.
  - A headhunter can replace the whole candidate pool for a fee and a cooldown. Salary negotiation (up to 15% off) has a success chance that depends on the candidate's traits.
- **HQ → Overview** (mobile-first): main finance card, 2x2 metrics (reputation, sentiment, team, era), live activity, 24-month chart, quick actions, then collapsible public highlights and timeline.

### 🔬 Research and OS

- **Tech tree**: **134 nodes** in **9 categories** (display, camera, battery, chip, network, sensor, body, audio, features), from 2000 to 2027. The last node, AI Agent Runtime, is part of the speculative scenario. The research queue runs in parallel, and more engineers means more slots. Early-2000s content includes infrared, MMS, Wi-Fi, e-mail, FM radio, MP3, memory cards, video recording, basic GPS, and USB Type-C.
- **Your own OS**: **50 OS features** across **5 eras** (Basic Firmware, Touchscreen Era, Modern Smartphone, AI & Ecosystem, On-Device AI). Three Agentic features (Agentic OS, Agent Guard, Agent Store) unlock from 2027 through the AI Agent Runtime research. There are OS versions, random bugs (**51 bug templates**, each with a patch), **7 built-in apps**, a third-party app ecosystem, and OS update cards organized into 9 tracks.
- **OS licensing**: **5 packages** if you'd rather not build your own OS.
- **Phone features**: **59 features** in 10 groups (connectivity, security, audio, extra camera, endurance, power, sensors, UX, storage, AI). Features are researched in the **Features** category, picked in the design wizard (step 3), and change stats, unit cost, demand (missing standard features, regional rules such as EU USB-C 2025), reviews, and advisor alerts. Phones without a feature list (old saves) stay neutral.
- **Future panels**: tech-preview panels (F-AI, Dev Tools, Game Engine) that unlock from research or year conditions and affect OS feature discounts and design suggestions. User Control is still locked.

### 📱 Products and Sales

- **Phone design wizard** with a real-time preview. There are **139 components** in **11 categories** (display, camera, battery, chip, RAM, storage, network, body, sensor, audio, form factor) and **18 body colors** that unlock progressively by era. Choices follow the year, so there's no OLED screen in 2001. RAM and storage are optional (default "Standard RAM", no cost). From 2027, LPDDR6 24GB is available, and the RAM market price follows the memory-crisis index (×1.35 in 2027, ×1.5 in 2028, ×1.2 in 2029, ×1.05 in 2030), which affects design cost, production bills, and the sale price from your own RAM plant.
- **Three-view phone mockup**: front, back, and **retail packaging** (an era-appropriate box with contents such as cable, charger, and earphones). The back view shows an **In-house** badge for components from your own plants.
- **4-phase development**: Design → Prototype → Production → Release.
- **Transparent demand formula**: quality × price × reputation × marketing × OS × trend × competitors × lifecycle × macro conditions.
- **Product lifecycle**: rising → peak → declining → dead. There is warehouse stock, automatic restock, and a maximum of **5 active products**.
- **Ecosystem** (Market → Ecosystem): three accessory lines (wireless earbuds from 2004, smartwatches from 2014, chargers from 2000). Each line has a Basic, Mid, or Premium tier and an adjustable price. Sales follow your active phone base, and each line has a fixed monthly cost and a setup cost. Once your OS has the App Store feature, you earn a monthly commission (15–30%, adjustable) on app spending by active OS users. A high commission lowers developer appeal, so the catalog shrinks. Owning accessories and an App Store raises phone demand by up to 6% and eases competitor pressure. Tier and price changes are locked for 3 months, and a line can't be closed for 6 months after it opens. Below the App Store card, two subscription services sit side by side: **Cloud** (from 2012, needs the Cloud Sync OS feature, subscribers follow your active phone base) and an **AI assistant** (from 2011, needs the Virtual Assistant OS feature, subscribers follow active OS users). Each has Free, Standard, or Premium tiers, a setup cost, and a monthly fixed cost. See `src/systems/EcosystemSystem.js`.
- **Sales channels** (Market → Channels): Mobile Carriers (2000), Online Store (2003), and Own Stores (2004) expand demand with era-based reach, but units sold through them are margin-cut and carry fixed costs. Production cost per unit does not change, so thin-margin phones lose money through carriers. See `CHANGES-channels.md`.
- **Marketing**: **5 campaign types** (Online Ads, Event Sponsorship, Product Launch, City Billboard, Influencer Campaign).
- **Promotions**: **18 packages**: 12 regional (Global, Asia, Europe, Americas & Rest, 3 each) and 6 per consumer segment. There are **12 seasonal events** such as Lunar New Year, 618, Singles' Day 11.11, Golden Week/Diwali, Carnival, Back to School, Summer Sales, Black Friday, and Christmas. At most 3 active promotion campaigns per product.
- **Market Navigation**: the market is read by **8 consumer segments** (value, mainstream, premium, gamer, creator, pro, youth, senior) and **8 sub-regions**. There are **19 trend waves** (16 historical plus 3 scenario waves for 2027–2029: Memory Crisis, AI Agent Phones, EU Battery Rules) and 4 extra trends, all feeding into the demand formula. The **Market** tab shows cards for Best Opportunities, Segments, Sub-Regions, Trend Waves, Reactions per segment, and Viral History. The data can also be read through `window.__game.marketNav`.

### 🧠 Chips, Fabs, and Manufacturing

- **Chip research**: **52 nodes** in **6 categories** (design, architecture, process, graphics, power, business).
- **Custom chip design**: **8 architectures**, **14 process nodes**, and **24 chip features** in 7 categories.
- **Fab** with 4 tiers, from Small Fab (5,000 chips/month, $5M) to Mega Fab (5 million chips/month, $600M). Build times, upgrades, a production queue, and yield all apply.
- **Component plants** (Manufacturing panel): **5 plant types** (Battery, Display, SoC, Camera, RAM) with 4 levels each. Every level adds a price discount, capacity, yield, and a spec bonus (for example SoC adds performance, Camera adds photo quality). Display, SoC, and RAM plants require a Fab. Plants unlock over time (Battery 2002, Display 2003, SoC and RAM 2004, Camera 2005), and the Manufacturing tab opens from 2003.
  - Plant stock is used at release and restock. Any shortfall is bought at market price.
  - There is a monthly **maintenance cost** and a 0.2% monthly **infrastructure tax** on installed capital.
  - Surplus stock can be **sold wholesale** (market price × 0.92, monthly quota of 40% of capacity). Low-level plants can lose money on wholesale, high-level plants profit.
- **Assembly factory** (Manufacturing tab and 3D island): a final-assembly plant with 4 levels (Manual Line, Semi-Automatic Line, Automated Factory, Robotic Smart Factory). You can start building from 2001, and it starts producing from 2002. Before it operates, production runs through contract manufacturing with no penalty.
  - Workers are modeled as headcount groups per role (operator, QC, technician, supervisor), roughly 120 people at level 1 up to about 1,500 at level 4, with a 14-day training period.
  - Once operating, it cuts restock cost by 5 / 9 / 13 / 17% (scaled by staffing), and production lag depends on queue versus capacity, operator and technician staffing, morale, and overtime. QC keeps the defect rate down (2–6%).
  - Wages and maintenance are charged daily, and unpaid wages hurt morale. Wage and maintenance costs follow a year-based index.

### 🌍 Competitors and the Market

- **32 companies** with personalities (dominant, aggressive, premium, follower, innovator, declining). They include Nokia, Motorola, Sony Ericsson, Siemens, Sagem, Alcatel, Palm, BlackBerry, Samsung, LG, HTC, Apple, Android, Huawei, Oppo, Vivo, Microsoft Lumia, Honor, OnePlus, Nothing, Asus, Sony Mobile, Realme, Meizu, Lenovo, Tecno, ZTE, Xiaomi, Sharp, NEC, and Panasonic, plus **Novamind**, a fictional AI-native newcomer that enters the market in 2028 (scenario).
  - Each brand's market share is carried forward to 2030 as a scenario direction: Samsung and Apple edge up, Chinese brands dip then partly recover, and small brands roughly halve by 2028.
  - Every company has active years, historical market share per year, signature products, milestones, and life events.
  - Factuality labels and source notes show what is fact and what was simplified.
- **Name mode**: use real names or fictional parody names (for example "Nokio", "Apel", "Samsul").
- **Dynamic competitor actions**: they can be aggressive, cut prices, or fade, depending on personality and difficulty. While the memory crisis is active, brands cut prices less often and small brands are quieter.
- **Emergent brand withdrawal** (from 2027): non-ecosystem brands exit the simulation if their share stays below 0.3% for 2 years in a row. This is the result of a data threshold, not a script. In test simulations the brands that left were Meizu (2028), Lenovo (2029), and Asus (2030). The thresholds can be tuned in `src/data/competitor-actions.data.js`.
- **Market share** is computed monthly with a 24-month history. A macro model (GDP, inflation, interest rates, 2000–2026) affects demand. Market-size and average-price anchors continue to 2030 (dipping at the 2028 memory-crisis peak, then recovering).
- **Public opinion**: sentiment across **11 aspects** (design, camera, battery, performance, price, reliability, OS, support, display, connectivity, usability), a review feed that gets more varied from era to era, and **26 viral events** you can respond to (apologize, recall, clarify, or ignore; "Ignore" can be used only once per event). Viral effects change daily sales.
- **News**: automatic headlines from **20 outlets**, with journalists and datelines per country. There are **96 monthly headlines** (2000–2007), 6 pre-history headlines, **33 headlines** for 2018–2026, **9 scenario stories** for 2027–2029 (labeled speculative, generic sources), **263 competitor release stories**, and templates that highlight product releases, milestones, and industry events.

### 💰 Finance

- **Economy**: salaries, rent, tax (12% / 15% / 20% by difficulty), burn-rate warnings, and a cash history.
- **Economy brakes** (so cash can't pile up forever):
  - Component cost rises with production volume (max ×2.2).
  - Demand is capped by a market ceiling that depends on difficulty.
  - Competitor pressure rises when utilization is high.
  - Places to spend cash in **HQ → Invest**: Plant Investment (L1–L5, which flattens the cost curve) and **rival brand acquisition** (from 2003, max 5, 6-month gap).
- **Bank**: **3 banks** (Global, Asia, Euro), loans with interest and term, flexible and fixed-term deposits, and an **8-tier credit rating (AAA to D)**. Late payments incur penalties and can block loan access.
- **Stock exchange** (HQ → Exchange): **84 stocks** in **12 categories** (Phone, Chip, Software, Social Media, Streaming, E-commerce, Finance, Energy & Mining, Consumer, Telecom, Other, and Your Company), **9 indices** (NASDAQ, Dow, S&P 500, IHSG, Nikkei, FTSE, DAX, Hang Seng, KOSPI), and **5 currencies** (USD, KRW, TWD, HKD, IDR) with historical rates.
  - The list of listed companies follows the game year: 43 are active in 2000 and 78 in 2026. Categories like Social Media and Streaming fill up only after those companies exist in the real world.
  - **Your buys and sells move prices.** A single trade shifts a price by at most 3%, the impact decays each month, and mega-tier stocks are harder to move.
  - Prices between two data years are interpolated, and after the last data year they are projected.
  - Each stock carries a data-confidence tag (`verified`, `trend`, `fictional`).

### 🎯 Help and Progression

- **Business Advisor**: rule-based advice ordered from critical to info, snoozable, with local Q&A. It also tells you when a new patch is out. A hook for AI is prepared.
- **Tutorial** (8 steps), starter **quests**, contextual tips, and a log with milestones.
- **Guide** and a history **Timeline** panel (23 iconic phones, 14 OS milestones, 5 eras).
- **Player level** (1–50), **company level**, and **credibility** (reputation, credit score, sentiment, payment integrity). Levels and leaderboard scores are computed on the server. Reaching levels and credibility tiers grants rewards that you claim through Messages.

### 🎨 Look and Language

- **Era-aware visuals**: **7 design eras** (Monochrome LCD → Color TFT → Touchscreen Revolution → Mature Smartphone → Premium & Bezel-less → AI & Notch → Foldable & Ultra). Phone mockups, screens, and notifications change by era.
- **Dark and light themes** with **6 accent colors** (blue, emerald, violet, amber, rose, cyan).
- **12 languages**: English, Bahasa Indonesia, Chinese (Simplified), Korean, Japanese, French, German, Spanish, Italian, Russian, Polish, and Hindi. Switch any time in Settings.
  - **Indonesian and English are full**, with roughly **2,900 and 3,000 keys** respectively (main dictionary plus per-feature dictionaries).
  - The **10 other languages** use a core dictionary (about 235 keys) and **fall back to English** for untranslated text.
  - Phone component names and descriptions are still in Indonesian (translation is on the roadmap).
- **Audio**: synthesized tap sounds (Web Audio API), plus vibration on supported devices.
- **Lite mode** turns on automatically on low-end phones (RAM, CPU, Data Saver, and battery are detected at startup). You can force it with `?perf=lite`, `?perf=full`, or `?perf=auto`. The game time loop stops entirely when the tab is hidden, and the 3D loops no longer wake on every vsync.
- **Language-aware loading screen**: Indonesian cover (`assets/img/loading-id.webp`) or English cover (`assets/img/loading-en.webp`), chosen before the page renders. The percentage under the image is real progress (JS modules downloaded plus boot stages). If the image fails to load, `assets/img/loading-screen.jpg` is used. Other languages use the English cover.
- Mobile-first layout with swipe between sub-tabs. The game can also be installed as a **PWA** (`manifest.webmanifest`), and the Android APK is just a wrapper (WebAPK) around the web version.

### ☁️ Cloud, Account, and Saves

- **Local save** runs automatically (when the browser is idle), plus save-file export and import.
- **Cloud save** through Supabase: login, **1 slot** (stores the latest save), player profile (display name and avatar), unique company-name check, and a leaderboard.
- **Player Profile**: an **8-digit Player ID** is shown in the Player Profile panel and **can be seen by other players**. Don't treat it as a secret. Settings now contain only settings, separate from the profile.
- **Messages**: an inbox for system notifications and rewards, player-to-player messages (with blocking), and SIL transfers between players (max 5,000 SIL per 24 hours).
- **Universal Wallet**: money ($) and Silicon (SIL) can be used for almost everything. Cash costs can be covered with SIL and vice versa. The rate follows inflation (year 2000: 1 SIL = $2,500, rising 15% per year). SIL is never minted from money. Pay modes (Auto, Cash first, SIL first, Strict) and the SIL Emergency Fund are in Settings → Finance.
- **Silicon (SIL)**: a premium currency for speeding up time and research, with a daily login bonus and quest rewards. It can also be exchanged into in-game cash (requires `supabase/10-tukar-sil.sql`).
  - **Top-up is temporarily closed.** The Buy tab and payment panel in the game are locked by the `TOPUP_LOCKED` flag in `src/ui/panels/SiliconStorePanel.js`, and the landing page (`web.html`) follows it. Balance, daily bonus, rewards, and SIL spending keep working.
  - When open, top-up is still manual (GoPay/QRIS) and approved by an admin through the `/fsociety` panel. No automatic payment provider is connected yet.
  - The lock is currently client-side only. Details are in Known issues and [`SECURITY.md`](SECURITY.md).
- **Security**: saves carry an integrity signature (a barrier against manual editing, not encryption). SIL balances and the ledger are protected on the server through Row Level Security and server-only functions. The full security policy and how to report issues are in [`SECURITY.md`](SECURITY.md).

### ⚠️ Known issues

- **The leaderboard is only partly validated by the server.** Stats are still sent from the player's device. The server limits sync frequency, checks invariants, and hides suspicious profiles (`supabase/11`), and it computes level and score itself (`supabase/12` and `15`). Values that stay within plausible bounds can still be faked, so this isn't an official ranking.
- **The top-up lock is client-side only.** The server function `create_payment_order` can still be called by a logged-in account through the API directly. Orders stay `pending` until an admin approves them, but if top-up must be fully closed, add a server-side flag.
- **Ecosystem revenue is low against real play.** The 0.2.6 calibration (`tools/eco-calib.mjs`) used a harness whose phone revenue stays flat at about 333,000 a month, which gave about 13% of phone revenue. In a browser run with real phone sales (a new phone each year, all three accessory lines, the App Store and both services open from 2013), ecosystem revenue was about 2% of phone revenue in 2013–2026 (about 168,000 against 7.3 million a month in 2026). Costs scale with the company-size factor, so in that run costs stayed close to revenue and the App Store card lost money. Whether to raise the numbers is an open design decision.
- **Subscription services were checked on real phones in 0.2.7, in one scenario.** Subscribers matched `getServicePreview` (for example 583 Cloud and 438 AI subscribers in 2023). The click flow (open, tier, price, close, locks) and the Indonesian labels work in the browser at 390×844. The OS features (`fw_cloud_sync`, `fw_siri`) and opening years (2012, 2011) are still first-pass choices to confirm. Not tested on a real mobile device.
- **Accessory visuals are fixed designs.** The mockups follow the tier and the open/closed state only. The player cannot yet choose color, material, or shape for accessories, and they are not shown in Market → Ecosystem (only linked).
- **Raw text in some places.** Four translation keys are used without fallback text and aren't in the dictionaries yet: `main.toast.fab_unlocked`, `wiz.warn.volume_cost`, `wiz.preview.unit_design`, `wiz.preview.unit_parts`. Many other keys (for example `team.recruit.*`, `team.nego.*`, `silstore.locked.*`) still rely on fallback text and haven't been merged into `src/data/i18n/en.js` and `id.js`.
- **`supabase/BACA-DULU.md` is incomplete.** Its table covers 01–09, 14, and 15, but is missing both file-10 variants, 11, 12, 13, 15b, 16, and 17.
- **SIL → money exchange** needs `supabase/10-tukar-sil.sql`. Without it the call fails and no SIL is deducted.
- **Business Advisor Edge Function (AI)** has no per-user rate limit and its CORS is open (`*`). Don't enable it for a wide public before that is added. Details in `SECURITY.md`.
- **Release notes are incomplete.** `src/patches.json` has 0.2.4 (and earlier versions), but several entries in the Versions section below haven't been moved into it yet.
- **Landing-page screenshots** (`assets/img/landing/`) need to be retaken. The HQ image still shows the old Office tab and the old Overview layout.
- **The client-side admin gate is cosmetic only.** Real admin status is verified on the server through `is_admin()`.
- **2027–2030 content is speculative.** Prices, the RAM index, brand shares, and withdrawal thresholds are game scenarios that still need calibration through play. The details of EU battery rules are not modeled (only the trend effect and news). Real brand names can "withdraw" in the simulation through the share threshold, and that is not a claim about real companies.
- **Component names and descriptions** (including the newer LPDDR6 entries) are still in Indonesian, like the other components.
- **The Office 3D Map** doesn't yet show recruit impact and trait bonuses from `TeamSystem`. The map's summary is still computed separately.
- **The Assembly 3D scene hasn't been tested in a real browser/WebGL** (only syntax checks and builder simulation with a mock THREE, per `CHANGES-assembly.md`).

---

## How to play

Open https://www.smartphone-empire.my.id/ (or https://jurkonstudio.github.io/smartphone-empire/) on a phone or desktop. You need an internet connection for the first load, because the 3D and cloud libraries come from a CDN. The game's intro page is `web.html`.

### Run locally

Because the project uses ES Modules, you need a local server (browsers block `file://`):

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`. There is no build step and no `npm install`.

---

## Tech

- **Plain JavaScript (ES Modules)**, HTML, and CSS. No framework and no bundler.
- **Three.js 0.160.0** (pinned, lazy-loaded from a CDN) for the Campus Map, Office 3D Map, and Manufacturing map. If WebGL or the CDN fails, the game still runs with a fallback view.
- **Supabase** (`supabase-js` 2.49.4 from a CDN) for auth, cloud save, profiles, messages, and avatar storage.
- Systems communicate through an **event bus** (`src/core/EventBus.js`). The event list is in `src/config/event.md`.
- Code size: **312 JS files** with about **88 thousand lines** in `src/`.
- There are no official automated tests, linter, or `package.json` yet. The `tools/` folder holds **26 manual test scripts** (Node, ES Modules) for calibration, demand simulation, economy brakes, promotions, panel rendering, the 2027–2030 package, and the Manufacturing and Assembly scenes (ships, cranes, trucks, road graph, weather, workers). These scripts are not loaded by the game. See `tools/README.md` for the ones that need a probe or a reference copy. Examples: `node --experimental-default-type=module tools/sim.mjs src` and `node tools/paket2027.mjs src`.

### Folder structure

```
smartphone-empire/
├─ index.html           main game (+ style.css · density.css · profile-ui.css · desktop.css)
├─ web.html             landing page (ID/EN, login, account status, and Silicon page)
├─ Welcome.html · campus-verify.html   supporting pages
├─ 031411/              admin panel (player data dashboard, SIL approvals), noindex
├─ supabase/            SQL schema 01–17, Advisor Edge Function (function/), guide (BACA-DULU.md)
├─ tools/               manual test scripts (not part of the game)
├─ _diff/               old change diffs for reference
├─ assets/              icons, audio, images (per-language loading screens, img/landing = landing screenshots)
├─ patches.json         release notes read by the Business Advisor (see Known issues)
├─ manifest.webmanifest · CNAME · .nojekyll   PWA and GitHub Pages hosting
├─ CHANGES*.md · PERF-CHANGES.md · econ-brakes.patch   change notes per update package
└─ src/
   ├─ main.js           boot, tab routing, event binding
   ├─ config/           constants, time, endgame, dev flag, event documentation
   ├─ core/             state, time, save, event bus, theme, language, audio, integrity, macro model
   ├─ data/             pure data: research, OS, components, competitors, stocks, bank, news, assembly, i18n/
   ├─ systems/          game logic: research, OS, products, market, team, bank, stocks, fab, chip, plants, assembly, news, advisor, economy brakes
   ├─ services/         cloud (Supabase), cloud i18n, patch checker
   ├─ diagnostics/      diagnostic report for debugging
   └─ ui/               panels, layout, modals, charts, icons, avatars, social, campus map (campus/), office (office/), manufacturing (manufacture/), phone mockups (phone/)
```

Data is separate from logic. To add a component, stock, competitor, or headline, just edit the files in `src/data/`.

---

## Supabase setup (cloud save, SIL, and admin panel)

The game runs without Supabase, but cloud save, SIL, and the admin panel need it. Run the files in `supabase/` **in order** in the SQL Editor (see `supabase/BACA-DULU.md`):

- **Required:** `01` → `05`, then `08` (change the e-mail in `08-jadikan-admin.sql` first), `14` after `03` (unique company name on the save path), and `15` after `12` (company level on the server).
- **Optional:** `06`–`07` (full admin panel), `09` (player messages), `10-pesan-antar-pemain` and `10-tukar-sil` (player-to-player messages and SIL exchange), `11` (leaderboard validation), `12` (credibility levels and rewards), `13` (leaderboard diagnostics, check-only), `15b` (company-level formula parity test, read-only), `16` (schema diagnostics, read-only), and `17` (rebuilds the `public_profiles` view; run it after 11, 12, and 15 if `16` reports missing view columns).
- **Order notes:** `12` needs `09`, `10`, and `11`, and `15` needs `12`. If you want levels and rewards, run that chain in full. Don't re-run `03` or `11` after `17` without running `17` again.
- **Optional, AI:** `function/advisor-chat/` (Business Advisor Edge Function). It needs the `ANTHROPIC_API_KEY` secret in Supabase, never in client code.
- The Supabase URL and *publishable key* in `src/services/cloud/supabase.config.js` are meant to be public. If you run your own project, replace both with yours. Never put a `service_role` key in the repo.

All files are safe to re-run. For an existing project, just run the files you haven't run yet, in the same order.

> Note: `BACA-DULU.md` doesn't list files 10–13, 16, and 17 yet. Run those manually according to the features you need, after 01–09.

---

## What's not done yet

The project is still in progress. Roadmap notes:

- ✅ **Office 3D Map stage 3**: build or upgrade Fabs and train staff straight from the map, 3D Fab construction, livelier staff activity, and a tidier mobile layout
- ✅ **Office ↔ Team integration**: staff cards open staff details, staff details can jump to the office, and the Work room has a recruit shortcut
- ✅ **Market Navigation** (data, demand, opinion, Americas & Rest promotions, per-segment promotions, and UI panels in the Market tab)
- ✅ **Manufacturing**: component plants (Battery, Display, SoC, Camera, RAM), wholesale, infrastructure tax, and the Campus ↔ Manufacturing Island bridge
- ✅ **Assembly factory**: 4 levels, headcount-based workforce, restock discounts, and a 3D plant on the Manufacturing Island
- ✅ **Economy brakes and the Invest tab**
- ✅ **Stock market v2**: player trade impact, more listed companies, world/IDX indices, and company tiers
- ✅ **2027–2030 package (speculative scenario)**: market anchors, RAM cost index, trends, news, Agentic AI OS features, the fictional newcomer Novamind, and emergent brand withdrawal
- ✅ **Early-2000s content**: infrared, MMS, Wi-Fi, e-mail, FM radio, MP3, memory cards (new storage component category), video, and basic GPS
- ✅ **Retail packaging in the mockup** and USB Type-C research
- ✅ **12 languages** (Indonesian and English in full, 10 others with a core dictionary)
- ✅ **Player and company levels on the server**, Messages, and rewards
- ✅ **Lite mode** for low-end phones and lower battery use
- ⏳ **Translation fixes (i18n)**: replace the remaining hardcoded text with keys, merge new keys into `en.js` and `id.js`, then translate the names and descriptions of the 139 components
- ⏳ **Office map reads TeamSystem**: recruit impact, trait bonuses, and the team summary computed from one source
- ✅ **Random events with choices** (5 dynamic incidents, 2000–2050, risky choices, cost scaled to company size; see `CHANGES-dynamic-events.md`)
- ✅ **Sales channels**: carriers, online store, and own stores (`CHANGES-channels.md`)
- ⏳ More incidents, per-era screen transitions, and UI polish
- ⏳ **UI Evolution patch**: notification styling that changes per era (monochrome → glossy → flat → Dynamic Island)
- ⏳ **Bilingual news**: English headlines exist, but some review templates are still Indonesian-only
- ⏳ **Silicon payments**: reopening top-up with a production payment provider and server-side verification (including a server-side lock)
- ⏳ **Fixing the known issues** above

---

## Versions

### 0.2.8 — Ecosystem economy recalibrated
- Balance: measured in the browser on real phone sales (one $250 phone a year, all lines and services open). Ecosystem revenue went from about 2% to about 10–17% of phone revenue (17.3% in 2026), gross margin about 50%. Levers: `fixedScaleExp` 0.3 (fixed costs only; setup keeps sqrt), `lineAttachScale` 0.18→1.7, `storeSpendBase` 0.3→2.1, `maxAttachShare` 0.05→0.12, Cloud attach 0.02→0.10, AI attach 0.015→0.09.
- Change: the AI assistant opens from 2023 and requires OS feature `fw_ai_on_device` (`llm_accelerator` is a chip feature, so the OS check cannot use it).
- Tools: `tools/eco-wiring-check.mjs` restored (it was missing from the repo zip); `tools/eco-services-sim.mjs` updated for the 2023 AI gate.
- Not done: `tools/eco-calib.mjs` still uses flat 333,333 phone revenue, and other scenarios (several phones, $600+ prices) are unmeasured. Advisor updates are not done.

### 0.2.7 — Subscription service buttons fixed
- Fix: the Cloud and AI assistant buttons (open, close, tier, price) did nothing, because `src/main.js` had no click handler for `data-eco-svc-*`. The handler is added and uses the existing `eco.svc.toast.*` and `eco.toast.*` keys.
- Fix: `src/patches.json` was still at 0.2.5 while the root file was at 0.2.6. Both are now identical at 0.2.7.
- The 0.2.6 note about "about 13% of phone revenue" is reworded: that figure came from the headless harness only (see Known issues).
- New `tools/eco-wiring-check.mjs`: checks that every `data-eco-*` button in the ecosystem panel has a click handler in `main.js`.
- No change to the economy formulas or the save format.

### 0.2.6 — Subscription services (Cloud and AI assistant)
- Cloud and an AI assistant are now subscription services in Market → Ecosystem, below the App Store card. Each has Free, Standard, and Premium tiers; paid tiers have an adjustable price.
- Cloud opens from 2012 and needs the Cloud Sync OS feature. The AI assistant opens from 2011 and needs the Virtual Assistant OS feature. Both have a setup cost and a monthly fixed cost.
- Lock-in weights changed to 40% accessory lines, 40% App Store, and 20% subscriptions (was 50/50 lines and App Store). Saves with every accessory line and the App Store open now reach 80% lock-in until a subscription opens.
- Accessory and App Store balance recalibrated against the game economy with `tools/eco-calib.mjs`: attach rate ×0.18, App Store spend per user 0.3, lower fixed costs. Ecosystem reaches about 13% of phone revenue in 2026.
- Older saves load with subscriptions closed.

Latest recorded version: **0.2.8** (October 25, 2026). Official change lists are in `src/patches.json` and `PERF-CHANGES.md`. The root `patches.json` is kept identical to `src/patches.json`.

### 0.2.5 — Accessory visuals
- New sub-tab Products → Accessories: inline SVG mockups for earbuds, smartwatches, and chargers (`src/ui/phone/AccessoryMockup.js`, `src/ui/panels/AccessoriesTab.js`). Shape and color follow the tier. Lines that are not open yet show in gray with a label.
- Market → Ecosystem has a shortcut button to the new tab. Tier, price, and open/close are still set in Market → Ecosystem.
- Visual only: no change to the economy formulas or the save format.

### 0.2.4 — Ecosystem (accessories and App Store)
- Accessory lines: wireless earbuds (2004), smartwatches (2014), and chargers (2000), each with Basic / Mid / Premium tiers and an adjustable price (Market → Ecosystem).
- App Store commission on app spending by active OS users, available once the OS has the App Store feature, with an adjustable 15–30% rate.
- Lock-in score: owning accessories and an App Store raises phone demand by up to 6% and eases competitor pressure.
- Monthly summary shows an Ecosystem cost row. Ecosystem revenue is included in income.
- Market tab now has 8 sub-tabs (Service and Ecosystem added).

Changes that are already in the code but not yet in `patches.json`:
- Market Navigation (segments, sub-regions, trend waves, 11 opinion aspects, 26 viral events, Americas & Rest and per-segment promotions, UI panels in the Market tab).
- Office map integration with the Team panel (staff deep-link, View in office button, Recruit shortcut from the Work room).
- Manufacturing, economy brakes, the Invest tab, and the Campus ↔ Manufacturing Island bridge.
- Assembly factory (see `CHANGES-assembly.md`).
- Stock market v2 (trade impact, new listed companies and indices).
- Retail packaging mockup and USB Type-C research.
- Early-2000s content: new OS features, research, bugs, and the storage component category (see `CHANGES-2001-2004-konten.md`).
- 12 languages and raw-text fixes.
- HQ → Overview overhaul, the Office tab moved to a switch on Home, and Player ID moved to Player Profile.
- Silicon top-up temporarily closed.
- 2027–2030 package: market, RAM cost index, scenario trends, news, Agentic AI OS features (Agentic OS, Agent Guard, Agent Store), the fictional newcomer Novamind, and emergent brand withdrawal (see `CHANGES-2027-kompetitor.md`).
- Per-language loading screen (Indonesian and English).

---

## Contributing and bug reports

Found a bug or have a suggestion? Open an [issue](https://github.com/jurkonstudio/smartphone-empire/issues). If you find a security hole, **do not** open a public issue. Follow the private reporting process in [`SECURITY.md`](SECURITY.md).

Company and brand names in the game are used for educational and entertainment purposes. Their copyrights belong to their respective owners. Historical data is simplified for gameplay.
