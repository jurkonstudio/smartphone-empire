// FILE: src/systems/Advisor/AdvisorPatchHelper.js
// Helper integrasi patch untuk AdvisorBrain. Murni fungsi, tanpa state game.
import { PatchService, cmpVersion } from '../../services/PatchService.js';

// Intent patch (sudah dinormalisasi: huruf kecil, tanpa tanda baca).
export var PATCH_INTENT_RE = /\b(patch|patches|hotfix|changelog|release notes?)\b|catatan (rilis|patch|perubahan|update)|perbaikan (bug|game|aplikasi|versi)|bug ?fix(es)?|sudah diperbaiki|apa yang diperbaiki|(update|pembaruan|versi|version) (game|aplikasi|app|baru|terbaru|terkini)|(game|app|aplikasi) (update|versi)|new version|latest version|what s fixed|(ada|any|cek|check|apakah|is there).*(update|pembaruan|patch|perbaikan)/;

// Pertanyaan "apa yang baru" yang sebenarnya tentang patch -> jangan dialihkan ke briefing.
export var PATCH_WORD_RE = /patch|versi|version|pembaruan|update|rilis|release|perbaikan|bug/;

function itemText(it, isId) {
    var t = it && it.text ? (isId ? it.text.id : it.text.en) : '';
    return String(t || '').replace(/[.!\s]+$/, '');
}

export function collectItems(releases, isId) {
    var fix = [], feat = [], bal = [];
    (releases || []).forEach(function (r) {
        (r.items || []).forEach(function (it) {
            var t = itemText(it, isId);
            if (!t) return;
            var row = { v: r.version, t: t };
            if (it.type === 'fix') fix.push(row);
            else if (it.type === 'balance') bal.push(row);
            else feat.push(row);
        });
    });
    return { fix: fix, feat: feat, bal: bal, total: fix.length + feat.length + bal.length };
}

// p = hasil AdvisorSystem.getPatchStatus(). L(id, en) = fungsi bahasa dari brain.
export function buildPatchAnswer(p, L, isId) {
    var chips = [L('Kondisi bisnis', 'Business status'), L('Apa prioritas sekarang?', 'What should I do now?')];
    var lines = [], acts = [];

    if (!p || !p.checked) {
        lines.push(L('Belum bisa memeriksa patch (mungkin offline). Kamu memakai **v' + p.cur + '**. Coba lagi sebentar lagi.',
                     'Cannot check for patches right now (maybe offline). You are on **v' + p.cur + '**. Try again shortly.'));
        return { text: lines.join('\n'), actions: acts, chips: chips };
    }

    var rel;
    if (p.kind === 'update') {
        lines.push(L('**Pembaruan v' + p.ver + ' tersedia** (kamu di v' + p.cur + ').',
                     '**Update v' + p.ver + ' is available** (you are on v' + p.cur + ').'));
        acts.push({ label: L('Simpan & muat ulang', 'Save & reload'), patch: 'reload' });
        rel = PatchService.releasesAfter(p.cur);
    } else if (p.kind) {
        lines.push(L('**v' + p.ver + '** sudah aktif di game kamu.', '**v' + p.ver + '** is live in your game.'));
        acts.push({ label: L('Tandai dibaca', 'Mark as read'), patch: 'ack', ver: p.ver });
        rel = PatchService.releasesAfter('0.0.0', p.cur).filter(function (r) { return cmpVersion(r.version, p.ver) >= 0; });
    } else {
        lines.push(L('Kamu sudah di versi terbaru (**v' + p.cur + '**).', 'You are on the latest version (**v' + p.cur + '**).'));
        rel = PatchService.releasesAfter('0.0.0', p.cur).slice(0, 1);
        if (rel.length) lines.push(L('Catatan terakhir (v' + rel[0].version + '):', 'Latest notes (v' + rel[0].version + '):'));
    }

    var c = collectItems(rel, isId);
    var list = [];
    c.fix.slice(0, 3).forEach(function (x) { list.push('• ' + L('Perbaikan', 'Fix') + ': ' + x.t + '.'); });
    c.feat.slice(0, 3).forEach(function (x) { list.push('• ' + L('Fitur', 'Feature') + ': ' + x.t + '.'); });
    c.bal.slice(0, 2).forEach(function (x) { list.push('• ' + L('Balance', 'Balance') + ': ' + x.t + '.'); });
    if (list.length) lines.push(list.join('\n'));
    if (c.total > list.length) lines.push(L('(+' + (c.total - list.length) + ' lainnya di catatan rilis)', '(+' + (c.total - list.length) + ' more in the release notes)'));

    if (c.fix.length) lines.push(L('Tip: perbaikan bug biasanya langsung terasa. Jika masih ada masalah, buka laporan bug dari panel Asisten.',
                                   'Tip: bug fixes usually show up right away. If something still breaks, open a bug report from the Advisor panel.'));
    else if (c.bal.length) lines.push(L('Tip: perubahan balance bisa mengubah harga dan riset. Cek ulang produk dan riset yang sedang berjalan.',
                                        'Tip: balance changes can affect prices and research. Recheck your running products and research.'));
    else if (c.feat.length) lines.push(L('Tip: coba fitur barunya dari panel yang relevan.', 'Tip: try the new feature from its related panel.'));

    return { text: lines.join('\n'), actions: acts, chips: chips };
}
