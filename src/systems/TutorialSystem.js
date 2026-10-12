// FILE: src/systems/TutorialSystem.js
import { bus } from '../core/EventBus.js';
import { TIP_IDS } from '../config/constants.js';

// Tutorial interaktif: 8 langkah minimum. Setiap langkah maju ketika pemain
// melakukan aksi yang diminta. Mendukung tombol Lewati.
//
// Cara kerja:
//   - TutorialSystem memancarkan event 'tutorial:step-changed'.
//   - UI (TutorialOverlay) mendengarkan dan menampilkan spotlight + pesan.
//   - Aksi pemain (klik tombol, dst) memicu bus.emit('tutorial:action', {id}).
//   - System memajukan step jika cocok.
//
// Tips kontekstual: ditampilkan sekali per ID; disimpan di state.seenTips.

const STEPS = [
    {
        id: 'welcome',
        title: 'Selamat datang!',
        text: 'Kamu memimpin perusahaan ponsel baru. Tekan Mulai untuk menjalankan waktu.',
        target: '[data-time-action="toggle-pause"]',
        waitFor: 'action:toggle-pause',
        tipOnEnter: TIP_IDS.FIRST_START
    },
    {
        id: 'speed',
        title: 'Atur kecepatan',
        text: 'Percepat simulasi dengan tombol kecepatan.',
        target: '[data-time-action="cycle-speed"]',
        waitFor: 'action:cycle-speed',
        tipOnEnter: TIP_IDS.FIRST_SPEED
    },
    {
        id: 'cash',
        title: 'Perhatikan uang',
        text: 'Uang tunai harus tetap positif. Biaya bulanan akan dipotong otomatis.',
        target: '[data-cash]',
        waitFor: 'acknowledge',
        tipOnEnter: TIP_IDS.FIRST_CASH
    },
    {
        id: 'nav-research',
        title: 'Buka tab Riset',
        text: 'Riset teknologi adalah kunci. Buka tab Riset.',
        target: '[data-nav="research"]',
        waitFor: 'action:nav:research',
        tipOnEnter: null
    },
    {
        id: 'nav-products',
        title: 'Lihat Produk',
        text: 'Desain ponsel ada di tab Produk.',
        target: '[data-nav="products"]',
        waitFor: 'action:nav:products',
        tipOnEnter: null
    },
    {
        id: 'nav-market',
        title: 'Cek Pasar',
        text: 'Pantau kompetitor dan pangsa pasar.',
        target: '[data-nav="market"]',
        waitFor: 'action:nav:market',
        tipOnEnter: null
    },
    {
        id: 'settings',
        title: 'Tab Pengaturan',
        text: 'Kelola save, getar, dan bantuan di sini.',
        target: '[data-nav="settings"]',
        waitFor: 'action:nav:settings',
        tipOnEnter: TIP_IDS.FIRST_SETTINGS
    },
    {
        id: 'finish',
        title: 'Siap!',
        text: 'Kembali ke Dashboard kapan pun. Selamat bermain!',
        target: '[data-nav="dashboard"]',
        waitFor: 'acknowledge',
        tipOnEnter: null
    }
];

export class TutorialSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        if (this.state.data.tutorial.completed || this.state.data.tutorial.skipped) return;

        // Dengarkan aksi dari UI
        this._unsubs.push(bus.on('tutorial:action', ({ id }) => this._handleAction(id)));
        this._unsubs.push(bus.on('tutorial:skip', () => this.skip()));
        this._unsubs.push(bus.on('tutorial:next', () => this.advance()));

        // Pancarkan step pertama
        this._emitCurrent();
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    getCurrentStep() {
        const idx = this.state.data.tutorial.currentStep;
        return STEPS[idx] || null;
    }

    getTotalSteps() { return STEPS.length; }

    _emitCurrent() {
        const step = this.getCurrentStep();
        if (!step) {
            this._finish(false);
            return;
        }
        // Tampilkan tip sekali jika diminta
        if (step.tipOnEnter && !this.state.hasSeenTip(step.tipOnEnter)) {
            this.state.markTipSeen(step.tipOnEnter);
        }
        bus.emit('tutorial:step-changed', {
            stepIndex: this.state.data.tutorial.currentStep,
            step
        });
    }

    _handleAction(actionId) {
        const step = this.getCurrentStep();
        if (!step) return;
        if (step.waitFor === actionId) this.advance();
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
        this.state.data.tutorial.completed = false;
        this.state.data.tutorial.skipped = false;
        this.state.data.tutorial.currentStep = 0;
        this.start();
        this._emitCurrent();
    }

    _finish(skipped) {
        this.state.data.tutorial.completed = true;
        bus.emit('tutorial:completed', { skipped });
        bus.emit('state:changed', this.state.data);
    }
}

export { STEPS as TUTORIAL_STEPS };
