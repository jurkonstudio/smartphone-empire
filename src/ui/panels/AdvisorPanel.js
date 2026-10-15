// FILE: src/ui/panels/AdvisorPanel.js
// v2027.36a — tombol asisten (FAB) + panel saran (modal).
// Navigasi memakai bus 'advisor:go' ({nav, subtab}) supaya tidak menyentuh
// logika view di main.js selain satu handler kecil.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { tx } from '../../systems/AdvisorSystem.js';

var MODAL_ID = 'advisor';

var BULB_SVG =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 18h6"/><path d="M10 21h4"/>' +
    '<path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>';

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function renderItems(advisor) {
    return advisor.getAdvice().map(function (a) {
        var go = a.action
            ? '<button class="btn-primary advisor-btn" type="button" data-adv-go="1"' +
              ' data-adv-nav="' + esc(a.action.nav) + '"' +
              ' data-adv-subtab="' + esc(a.action.subtab || '') + '">' + esc(tx('ui.open')) + '</button>'
            : '';
        var snooze = a.id !== 'all_good'
            ? '<button class="btn-secondary advisor-btn" type="button" data-adv-snooze="' + esc(a.id) + '">' +
              esc(tx('ui.snooze')) + '</button>'
            : '';
        return '' +
            '<div class="advisor-item sev-' + a.sev + '">' +
                '<div class="advisor-ico" aria-hidden="true">' + a.icon + '</div>' +
                '<div class="advisor-body">' +
                    '<div class="advisor-title">' + esc(a.title) + '</div>' +
                    '<div class="advisor-detail">' + esc(a.detail) + '</div>' +
                    ((go || snooze) ? '<div class="advisor-actions">' + go + snooze + '</div>' : '') +
                '</div>' +
            '</div>';
    }).join('');
}

function renderAiBox(advisor) {
    if (!advisor.hasProvider()) return '';
    return '' +
        '<div class="advisor-ask">' +
            '<div class="advisor-ask-row">' +
                '<input class="advisor-input" type="text" maxlength="300" data-adv-input placeholder="' + esc(tx('ui.ask_ph')) + '">' +
                '<button class="btn-primary advisor-btn" type="button" data-adv-send="1">' + esc(tx('ui.ask_send')) + '</button>' +
            '</div>' +
            '<div class="advisor-answer" data-adv-answer hidden></div>' +
        '</div>';
}

export function openAdvisor(advisor) {
    var html = '' +
        '<div class="modal-title">💡 ' + esc(tx('ui.title')) + '</div>' +
        '<div class="modal-sub">' + esc(advisor.getSummary()) + '</div>' +
        '<div class="advisor-list" data-adv-list>' + renderItems(advisor) + '</div>' +
        renderAiBox(advisor) +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">' + esc(tx('ui.close')) + '</button>';

    Modal.open(MODAL_ID, html);

    var node = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (!node) return;

    node.addEventListener('click', function (e) {
        var goBtn = e.target.closest('[data-adv-go]');
        if (goBtn) {
            bus.emit('advisor:go', { nav: goBtn.dataset.advNav, subtab: goBtn.dataset.advSubtab || null });
            return;
        }
        var snz = e.target.closest('[data-adv-snooze]');
        if (snz) {
            advisor.snooze(snz.dataset.advSnooze);
            var list = node.querySelector('[data-adv-list]');
            if (list) list.innerHTML = renderItems(advisor);
            return;
        }
        var send = e.target.closest('[data-adv-send]');
        if (send) _sendQuestion(advisor, node);
    });

    var input = node.querySelector('[data-adv-input]');
    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); _sendQuestion(advisor, node); }
        });
    }
}

async function _sendQuestion(advisor, node) {
    var input = node.querySelector('[data-adv-input]');
    var out = node.querySelector('[data-adv-answer]');
    if (!input || !out) return;
    var q = input.value.trim();
    if (!q) return;
    out.hidden = false;
    out.textContent = tx('ui.thinking');
    input.disabled = true;
    var res = await advisor.ask(q);
    out.textContent = res.ok ? res.text : tx('ui.ask_fail');   // textContent: aman dari HTML injection
    input.disabled = false;
    if (res.ok) input.value = '';
}

// Tombol melayang. Disembunyikan selama tutorial berjalan.
export function mountAdvisorButton(advisor) {
    if (document.getElementById('advisor-fab')) return;

    var btn = document.createElement('button');
    btn.id = 'advisor-fab';
    btn.className = 'advisor-fab';
    btn.type = 'button';
    btn.innerHTML = BULB_SVG + '<span class="advisor-badge" hidden></span>';
    var badge = btn.querySelector('.advisor-badge');
    document.body.appendChild(btn);

    function paint() {
        var b = advisor.getBadge();
        badge.textContent = String(b.count);
        badge.hidden = b.count === 0;
        btn.classList.toggle('critical', b.critical > 0);
        btn.setAttribute('aria-label', tx('ui.title') + (b.count ? ' (' + b.count + ')' : ''));
    }
    function setHidden(h) { btn.classList.toggle('is-hidden', !!h); }

    var tut = (advisor.state.data && advisor.state.data.tutorial) || {};
    setHidden(!(tut.completed || tut.skipped));

    btn.addEventListener('click', function () { openAdvisor(advisor); });
    bus.on('advisor:updated', paint);
    bus.on('lang:changed', paint);
    bus.on('tutorial:step-changed', function () { setHidden(true); });
    bus.on('tutorial:completed', function () { setHidden(false); });
    paint();
}
