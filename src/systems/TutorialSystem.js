// FILE: src/systems/TutorialSystem.js  (REPLACE — v2 misi pertama terarah)
import { bus } from '../core/EventBus.js';
import { TIP_IDS, LOG_TYPES } from '../config/constants.js';
import { ToastService } from '../core/ToastService.js';
import { LanguageService } from '../core/LanguageService.js';

// Tutorial interaktif + misi pertama: pemain baru diarahkan dari tombol Mulai
// sampai ponsel pertamanya TERJUAL, lalu dapat hadiah kas kecil.
//
// Cara kerja:
//   - TutorialSystem memancarkan 'tutorial:step-changed'; TutorialOverlay menampilkannya.
//   - Aksi pemain memicu bus.emit('tutorial:action', {id}). Awalan 'action:' boleh ada
//     atau tidak ('nav:products' sama dengan 'action:nav:products').
//   - Langkah juga bisa maju dari event game: product:released, product:sale.
//   - Langkah punya skipIf(state) agar otomatis dilewati bila sudah terpenuhi
//     (mis. saat tutorial diulang dari Pengaturan).
//
// Kompatibilitas save: state.data.tutorial.v = 2. Save lama (tanpa v) yang masih di
// tengah tutorial dipetakan: langkah 0-2 tetap, langkah >= 3 dimulai dari misi.
// Save yang sudah selesai/dilewati tidak diubah.

const TUTORIAL_VERSION = 2;
export const FIRST_SALE_REWARD = 10000;   // hadiah kas, sekali per save
export const FIRST_GOAL_UNITS = 1000;     // target "ponsel pertama": total unit terjual

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function _p(id, en) { return _en() ? en : id; }
function _usd(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

function _catalog(s) { return (s.data.products && s.data.products.catalog) || []; }
function _hasDev(s) { return !!(s.data.products && s.data.products.development); }
function _totalSold(s) { return _catalog(s).reduce(function (a, p) { return a + (p.totalSold || 0); }, 0); }
function _totalRevenue(s) { return _catalog(s).reduce(function (a, p) { return a + (p.totalRevenue || 0); }, 0); }
function _hasStarted(s) { return _hasDev(s) || _catalog(s).length > 0; }

const STEPS = [
    {
        id: 'welcome',
        title: () => _p('Selamat datang!', 'Welcome!'),
        text: () => _p('Kamu memimpin perusahaan ponsel baru. Misi pertamamu: jual ponsel pertama. Tekan Mulai untuk menjalankan waktu.',
                       'You run a brand-new phone company. Your first mission: sell your first phone. Press Start to run time.'),
        target: '[data-time-action="toggle-pause"]',
        waitFor: 'action:toggle-pause',
        tipOnEnter: TIP_IDS.FIRST_START
    },
    {
        id: 'speed',
        title: () => _p('Atur kecepatan', 'Set the speed'),
        text: () => _p('Tekan tombol kecepatan untuk mempercepat waktu. Pengembangan ponsel butuh sekitar 40 hari game.',
                       'Tap the speed button to fast-forward. Developing a phone takes about 40 game days.'),
        target: '[data-time-action="cycle-speed"]',
        waitFor: 'action:cycle-speed',
        tipOnEnter: TIP_IDS.FIRST_SPEED
    },
    {
        id: 'cash',
        title: () => _p('Perhatikan uang', 'Watch your cash'),
        text: () => _p('Uang tunai harus tetap positif. Biaya bulanan dipotong otomatis.',
                       'Cash must stay positive. Monthly costs are deducted automatically.'),
        target: '[data-cash]',
        waitFor: 'acknowledge',
        tipOnEnter: TIP_IDS.FIRST_CASH
    },
    {
        id: 'nav-products',
        title: () => _p('Misi 1: buka tab Produk', 'Mission 1: open Products'),
        text: () => _p('Ponsel dirancang di tab Produk. Tekan tab itu.', 'Phones are designed in the Products tab. Tap it.'),
        target: '[data-nav="products"]',
        waitFor: 'action:nav:products',
        skipIf: _hasStarted
    },
    {
        id: 'design-open',
        title: () => _p('Mulai rancang ponsel', 'Start designing a phone'),
        text: () => _p('Tekan tombol rancang ponsel baru.', 'Tap the button to design a new phone.'),
        target: '[data-prod-action="open-wizard"]',
        poll: { selector: '[data-modal-id="design-wizard"]', action: 'action:wizard-opened' },
        waitFor: 'action:wizard-opened',
        skipIf: _hasStarted
    },
    {
        id: 'design-autofill',
        title: () => _p('Pakai Isi Otomatis', 'Use Auto-Fill'),
        text: () => _p('Tekan Isi Otomatis: game memilih komponen terbaik yang kamu punya dan nama model, lalu langsung ke langkah terakhir.',
                       'Tap Auto-Fill: the game picks your best parts and a model name, then jumps to the last step.'),
        target: '[data-wiz-autofill]',
        poll: { selector: '[data-wiz-confirm]', action: 'action:wizard-ready' },
        waitFor: 'action:wizard-ready',
        skipIf: _hasStarted
    },
    {
        id: 'design-release',
        title: () => _p('Mulai pengembangan', 'Start development'),
        text: () => _p('Tekan Rilis untuk mulai mengembangkan. Jika dana kurang, matikan varian Pro / Pro Max atau kecilkan jumlah produksi.',
                       'Tap Release to start development. If cash is short, turn off the Pro / Pro Max variants or lower the production quantity.'),
        target: '[data-wiz-confirm]',
        waitFor: 'action:product-started',
        skipIf: _hasStarted
    },
    {
        id: 'wait-dev',
        mode: 'banner',
        title: () => _p('Ponselmu sedang dikembangkan', 'Your phone is in development'),
        text: () => _p('Jalankan waktu dan naikkan kecepatan (sampai 10x). Setelah rilis, penjualan pertama masuk dalam beberapa hari game.',
                       'Run time and raise the speed (up to 10x). After release, the first sales arrive within a few game days.'),
        target: '[data-time-action="cycle-speed"]',
        waitFor: 'event:product-released',
        skipIf: function (s) { return !_hasDev(s); }
    },
    {
        id: 'wait-sale',
        mode: 'banner',
        title: () => _p('Ponselmu sudah rilis!', 'Your phone is released!'),
        text: () => _p('Biarkan waktu berjalan sampai penjualan pertama masuk.', 'Let time run until the first sale comes in.'),
        target: '[data-time-action="cycle-speed"]',
        waitFor: 'event:first-sale',
        skipIf: function (s) { return _totalSold(s) > 0; }
    },
    {
        id: 'celebrate',
        mode: 'center',
        title: () => _p('Ponsel pertamamu terjual!', 'Your first phone sold!'),
        text: (s) => {
            const units = _totalSold(s).toLocaleString('en-US');
            const rev = _usd(_totalRevenue(s));
            const bonus = s.data.tutorial.rewardGiven ? _usd(s.data.tutorial.rewardGiven) : null;
            const base = _p('Terjual ' + units + ' unit, pendapatan ' + rev + '.', units + ' units sold, ' + rev + ' revenue.');
            const gift = bonus ? _p(' Bonus kas ' + bonus + ' sudah masuk.', ' A ' + bonus + ' cash bonus has been added.') : '';
            return base + gift;
        },
        waitFor: 'acknowledge',
        skipIf: function (s) { return !!s.data.tutorial.rewarded; },
        onEnter: '_grantReward'
    },
    {
        id: 'finish',
        mode: 'center',
        title: () => _p('Target berikutnya', 'Next goal'),
        text: () => _p('Jual ' + FIRST_GOAL_UNITS.toLocaleString('en-US') + ' ponsel. Pantau di Dashboard, lakukan riset, rekrut tim, dan rancang model yang lebih baik.',
                       'Sell ' + FIRST_GOAL_UNITS.toLocaleString('en-US') + ' phones. Track it on the Dashboard, do research, hire a team and design better models.'),
        waitFor: 'acknowledge',
        tipOnEnter: null
    }
];

function _norm(id) { return String(id || '').replace(/^action:/, ''); }

export class TutorialSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._goalUnsub = null;
    }

    start() {
        this._bindGoalWatcher();
        const tut = this.state.data.tutorial;
        if (tut.completed || tut.skipped) return;

        this._migrate();
        this.stop();

        this._unsubs.push(bus.on('tutorial:action', ({ id }) => this._handleAction(id)));
        this._unsubs.push(bus.on('tutorial:skip', () => this.skip()));
        this._unsubs.push(bus.on('tutorial:next', () => this.advance()));
        this._unsubs.push(bus.on('product:released', () => this._handleAction('event:product-released')));
        this._unsubs.push(bus.on('product:sale', () => this._handleAction('event:first-sale')));

        this._emitCurrent();
    }

    stop() {
        this._unsubs.forEach(u => { try { u(); } catch (e) {} });
        this._unsubs = [];
    }

    _migrate() {
        const tut = this.state.data.tutorial;
        if (tut.v === TUTORIAL_VERSION) return;
        if (typeof tut.currentStep !== 'number' || tut.currentStep < 0) tut.currentStep = 0;
        if (tut.currentStep >= 3) tut.currentStep = 3;
        tut.v = TUTORIAL_VERSION;
    }

    // Target "jual 1.000 ponsel pertama": notifikasi sekali, tidak tergantung tutorial.
    _bindGoalWatcher() {
        if (this._goalUnsub) return;
        this._goalUnsub = bus.on('product:sale', () => {
            const tut = this.state.data.tutorial;
            if (tut.goalDone) return;
            if (_totalSold(this.state) < FIRST_GOAL_UNITS) return;
            tut.goalDone = true;
            const msg = _p('Target tercapai: ' + FIRST_GOAL_UNITS.toLocaleString('en-US') + ' ponsel terjual!',
                           'Goal reached: ' + FIRST_GOAL_UNITS.toLocaleString('en-US') + ' phones sold!');
            try { ToastService.success(msg); } catch (e) {}
            try { this.state.addLog(msg, LOG_TYPES.success); } catch (e) {}
            try { this.state.addMilestone('first_1000_units', msg); } catch (e) {}
        });
    }

    getCurrentStep() {
        const idx = this.state.data.tutorial.currentStep;
        return STEPS[idx] || null;
    }

    getTotalSteps() { return STEPS.length; }

    _resolve(step) {
        const s = this.state;
        const r = Object.assign({}, step);
        r.title = typeof step.title === 'function' ? step.title(s) : step.title;
        r.text = typeof step.text === 'function' ? step.text(s) : step.text;
        delete r.skipIf;
        delete r.onEnter;
        return r;
    }

    _emitCurrent() {
        const tut = this.state.data.tutorial;
        let step = this.getCurrentStep();
        let guard = 0;
        while (step && typeof step.skipIf === 'function' && guard++ < 20) {
            let skip = false;
            try { skip = !!step.skipIf(this.state); } catch (e) { skip = false; }
            if (!skip) break;
            tut.currentStep += 1;
            step = this.getCurrentStep();
        }
        if (!step) {
            this._finish(false);
            return;
        }
        if (step.onEnter && typeof this[step.onEnter] === 'function') this[step.onEnter]();
        if (step.tipOnEnter && !this.state.hasSeenTip(step.tipOnEnter)) {
            this.state.markTipSeen(step.tipOnEnter);
        }
        bus.emit('tutorial:step-changed', {
            stepIndex: tut.currentStep,
            step: this._resolve(step)
        });
    }

    _grantReward() {
        const tut = this.state.data.tutorial;
        if (tut.rewarded) return;
        tut.rewarded = true;
        tut.rewardGiven = FIRST_SALE_REWARD;
        try {
            this.state.addCash(FIRST_SALE_REWARD);
            this.state.addLog(_p('Bonus ponsel pertama terjual: ' + _usd(FIRST_SALE_REWARD) + '.',
                                 'First phone sold bonus: ' + _usd(FIRST_SALE_REWARD) + '.'), LOG_TYPES.success);
            this.state.addMilestone('first_sale', _p('Ponsel pertama terjual', 'First phone sold'));
        } catch (e) { console.warn('[Tutorial] reward error:', e); }
    }

    _handleAction(actionId) {
        const step = this.getCurrentStep();
        if (!step) return;
        if (_norm(step.waitFor) === _norm(actionId)) this.advance();
    }

    advance() {
        this.state.data.tutorial.currentStep += 1;
        if (this.state.data.tutorial.currentStep >= STEPS.length) {
            this._finish(false);
        } else {
            this._emitCurrent();
        }
    }

    skip() {
        this.state.data.tutorial.skipped = true;
        this._finish(true);
    }

    restart() {
        const tut = this.state.data.tutorial;
        tut.completed = false;
        tut.skipped = false;
        tut.currentStep = 0;
        tut.v = TUTORIAL_VERSION;
        this.start();
    }

    _finish(skipped) {
        this.state.data.tutorial.completed = true;
        this.stop();
        bus.emit('tutorial:completed', { skipped });
        bus.emit('state:changed', this.state.data);
    }
}

export { STEPS as TUTORIAL_STEPS };
