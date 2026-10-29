// FILE: src/systems/PublicOpinionBugReactions.js
// Reaksi konsumen terhadap bug OS: ulasan saat bug muncul, saat selesai diperbaiki,
// atau saat bug diabaikan. Hanya menambah ulasan lewat _pushToFeed (tanpa mengubah
// sentimen dasar, yang dihitung ulang setiap hari oleh PublicOpinionSystem).
import { bus } from '../core/EventBus.js';
import { reviewSourceForYear } from '../data/feedback.data.js';

const TEXTS = {
    appear: [
        'Baru pakai {p}, tiba-tiba muncul masalah: {bug}. Kecewa.',
        'Kenapa {p} ada {bug}? Harusnya bisa lebih stabil.',
        '{bug} di {p} bikin repot. Tolong segera diperbaiki.'
    ],
    patched: [
        'Bagus, {bug} di {p} sudah diperbaiki. Sekarang lancar lagi.',
        'Update untuk {p} membereskan {bug}. Terima kasih cepat tanggap.',
        'Akhirnya {bug} hilang di {p}. Perbaikannya terasa.'
    ],
    ignored: [
        'Masih ada {bug} di {p} dan belum juga diperbaiki. Mengecewakan.',
        'Sudah lama {bug} di {p} dibiarkan. Kepercayaan saya turun.',
        '{p} masih {bug}, sepertinya bug ini tidak dianggap penting.'
    ]
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (lo, hi) => Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;

function sellingProduct(state) {
    const act = ((state.data.products && state.data.products.catalog) || []).filter(p => p.status === 'selling');
    return act.length ? pick(act) : null;
}

function pushBugReview(system, bug, phase, score) {
    const data = system.state.data;
    const fb = data.feedback;
    if (!fb.bugReactionsSent || typeof fb.bugReactionsSent !== 'object') fb.bugReactionsSent = {};
    const key = bug.id + ':' + phase;
    if (fb.bugReactionsSent[key]) return;          // sekali per bug per fase
    const p = sellingProduct(system.state);
    if (!p) return;                                  // belum ada produk terjual, tidak ada yang diulas
    fb.bugReactionsSent[key] = true;

    const text = pick(TEXTS[phase]).split('{p}').join(p.name).split('{bug}').join(bug.name);
    const year = data.time.currentYear || 2000;
    system._pushToFeed({
        id: 'rvbug_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        productId: p.id,
        productName: p.name,
        source: reviewSourceForYear(year),
        score: Math.max(1, Math.min(10, score)),
        text: text,
        year: data.time.currentYear,
        month: data.time.currentMonth,
        day: data.time.currentDay,
        gameMinute: data.time.elapsedGameMinutes,
        isInitial: false,
        bugReaction: phase
    });
}

// Pasang listener. Mengembalikan daftar fungsi unsubscribe (sama seperti bus.on).
export function attachBugReactions(system) {
    const findBug = (id) => ((system.state.data.os && system.state.data.os.bugs) || []).find(b => b.id === id);
    return [
        bus.on('os:bug-appeared', ({ bug } = {}) => {
            if (!bug) return;
            const sev = Number(bug.severity) || 1;
            pushBugReview(system, bug, 'appear', sev >= 3 ? rnd(2.5, 3.5) : rnd(3.5, 5));
        }),
        bus.on('os:bug-patched', ({ bugId } = {}) => {
            const bug = findBug(bugId);
            if (!bug) return;
            const fast = (Number(bug.patchDays) || 1) <= 3;
            pushBugReview(system, bug, 'patched', fast ? rnd(7.5, 8.5) : rnd(6, 7.2));
        }),
        bus.on('os:bug-ignored', ({ bugId } = {}) => {
            const bug = findBug(bugId);
            if (!bug) return;
            pushBugReview(system, bug, 'ignored', rnd(1.5, 3));
        })
    ];
}
