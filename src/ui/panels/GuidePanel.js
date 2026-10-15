// FILE: src/ui/panels/GuidePanel.js
// v2027.14a — full guide: quick start, systems, glossary, tips, backup, diagnostic.
import { t } from '../../core/LanguageService.js';

// Section: Quick Start (7 steps)
function _quickStart() {
    var steps = ['1','2','3','4','5','6','7'].map(function (n) {
        return '<div class="guide-step">' +
            '<span class="guide-step-num">' + n + '</span>' +
            '<span class="guide-step-text">' + t('guide.qs.' + n) + '</span>' +
            '</div>';
    }).join('');
    return _card(t('guide.section.quickstart'),
        '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">' +
            t('guide.qs.intro') +
        '</div>' + steps, true);
}

// Section: Game Systems
function _systems() {
    var items = [
        ['phone', '📱'], ['research', '🔬'], ['os', '🧩'], ['chip', '💠'],
        ['fab', '🏭'], ['team', '👥'], ['market', '🌐'],
        ['exchange', '📈'], ['news', '📰']
    ];
    var html = items.map(function (it) {
        return '<div class="guide-sys-row">' +
            '<div class="guide-sys-icon">' + it[1] + '</div>' +
            '<div class="guide-sys-body">' +
                '<div class="guide-sys-title">' + t('guide.sys.' + it[0] + '.t') + '</div>' +
                '<div class="guide-sys-desc">' + t('guide.sys.' + it[0] + '.d') + '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    return _card(t('guide.section.systems'), html, false);
}

// Section: Glossary
function _glossary() {
    var keys = [
        'reputation','share','quality','burnrate','rnd','era','os','prototype','lifecycle',
        'networth','portfolio','yield','tier','morale'
    ];
    var html = keys.map(function (k) {
        return '<div class="gloss-row">' +
            '<b>' + t('guide.term.' + k) + '</b>' +
            '<span>' + t('guide.def.' + k) + '</span>' +
            '</div>';
    }).join('');
    return _card(t('guide.section.glossary'), html, false);
}

// Section: Tips
function _tips() {
    var list = ['1','2','3','4','5','6','7','8'].map(function (n) {
        return '<li>' + t('guide.tips.' + n) + '</li>';
    }).join('');
    return _card(t('guide.section.tips'), '<ul class="tips-list">' + list + '</ul>', false);
}

// Section: Backup
function _backup() {
    var html =
        '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">' +
            t('guide.backup.intro') +
        '</div>' +
        '<div class="sum-row"><span style="color:var(--accent);font-weight:700;">Export</span><span style="font-size:12px;color:var(--text-dim);">' +
            t('guide.backup.export').replace(/^Export:\s*/, '') +
        '</span></div>' +
        '<div class="sum-row"><span style="color:var(--accent);font-weight:700;">Import</span><span style="font-size:12px;color:var(--text-dim);">' +
            t('guide.backup.import').replace(/^Import:\s*/, '') +
        '</span></div>' +
        '<div style="margin-top:10px;padding:8px 10px;background:var(--warn-soft);border-radius:8px;font-size:11.5px;color:var(--warn);line-height:1.5;">' +
            t('guide.backup.warn') +
        '</div>';
    return _card(t('guide.section.backup'), html, false);
}

// Section: Diagnostic
function _diagnostic() {
    var html =
        '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">' +
            t('guide.diag.intro') +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--text-dim);line-height:1.55;margin-bottom:10px;">' +
            t('guide.diag.what') +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--text-dim);line-height:1.55;margin-bottom:12px;">' +
            t('guide.diag.how') +
        '</div>' +
        '<button class="btn-primary" data-guide-report style="width:100%;padding:10px;font-weight:700;">' +
            t('guide.diag.btn') +
        '</button>' +
        '<div style="font-size:10.5px;color:var(--text-mute);margin-top:10px;line-height:1.5;text-align:center;">' +
            t('guide.diag.privacy') +
        '</div>';
    return _card(t('guide.section.diagnostic'), html, false);
}

// Section: Shortcuts
function _shortcuts() {
    var html =
        '<div class="sum-row"><span>' + t('guide.sc.space') + '</span><b>' + t('guide.sc.space.d') + '</b></div>' +
        '<div class="sum-row"><span>' + t('guide.sc.f') + '</span><b>' + t('guide.sc.f.d') + '</b></div>';
    return _card(t('guide.section.shortcuts'), html, false);
}

// ---------- Helpers ----------
function _card(title, contentHtml, openByDefault) {
    return '<details class="collapsible-card"' + (openByDefault ? ' open' : '') + '>' +
        '<summary class="collapsible-summary">' +
            '<span>' + title + '</span>' +
        '</summary>' +
        '<div class="collapsible-body">' + contentHtml + '</div>' +
    '</details>';
}

// ---------- Main render ----------
export function renderGuidePanel() {
    return '<div style="margin-bottom:8px;">' +
            '<div style="font-size:15px;font-weight:800;letter-spacing:-0.01em;">' +
                t('guide.title') +
            '</div>' +
        '</div>' +
        _quickStart() +
        _systems() +
        _glossary() +
        _tips() +
        _backup() +
        _diagnostic() +
        _shortcuts() +
        '<button class="btn-secondary" data-nav="settings" style="width:100%;margin-top:8px;">' +
            t('guide.back') +
        '</button>';
}
