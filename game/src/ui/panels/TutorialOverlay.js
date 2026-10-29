// FILE: src/ui/panels/TutorialOverlay.js  (REPLACE — v2 misi pertama terarah)
// Overlay spotlight. Elemen target di-highlight, sisanya diredupkan.
// Mode langkah:
//   (biasa)  spotlight pada target, gelembung di bawah/atas target.
//   'banner' tanpa redup, gelembung kecil di bawah layar (untuk langkah menunggu).
//   'center' kartu di tengah dengan redup (perayaan / penutup).
// Klik TIDAK diblokir: pemain bisa menekan target (dan elemen lain) saat tutorial aktif.
// Langkah dengan `poll` memancarkan 'tutorial:action' otomatis saat selector muncul di DOM
// (dipakai untuk wizard desain agar tidak perlu mengubah DesignWizard.js).
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';

let _node = null;
let _currentStep = null;
let _pollTimer = null;
let _pollFired = false;
let _bound = false;

export function initTutorialOverlay() {
    if (_bound) return;
    _bound = true;
    bus.on('tutorial:step-changed', function (data) { _show(data.stepIndex, data.step); });
    bus.on('tutorial:completed', function () { _hide(); });
}

function _ensureNode() {
    if (_node) return _node;
    _node = document.createElement('div');
    _node.className = 'tut-root';
    // Jangan blokir klik ke game; hanya gelembung dan kartu tengah yang menerima klik.
    _node.style.pointerEvents = 'none';
    _node.innerHTML = `
        <div class="tut-dim" style="display:none;"></div>
        <div class="tut-hole"></div>
        <div class="tut-bubble" style="pointer-events:auto;">
            <div class="tut-title"></div>
            <div class="tut-text"></div>
            <div class="tut-actions">
                <button class="tut-skip" data-tut-skip>${t('tut.skip')}</button>
                <button class="tut-next" data-tut-next>${t('tut.next')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(_node);

    _node.querySelector('[data-tut-skip]').addEventListener('click', function () {
        bus.emit('tutorial:skip');
    });
    _node.querySelector('[data-tut-next]').addEventListener('click', function () {
        bus.emit('tutorial:next');
    });
    window.addEventListener('resize', function () { _reposition(); });
    return _node;
}

function _stopPoll() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

function _startPoll(step) {
    _stopPoll();
    _pollFired = false;
    if (!step || !step.poll) return;
    _pollTimer = setInterval(function () {
        if (!_currentStep || _currentStep !== step) { _stopPoll(); return; }
        const el = document.querySelector(step.poll.selector);
        if (el && el.getClientRects().length && !_pollFired) {
            _pollFired = true;
            bus.emit('tutorial:action', { id: step.poll.action });
            return;
        }
        _reposition();
    }, 350);
}

function _show(stepIndex, step) {
    _currentStep = step;
    const node = _ensureNode();
    node.classList.add('visible');
    node.querySelector('.tut-title').textContent = step.title || '';
    node.querySelector('.tut-text').textContent = step.text || '';
    const nextBtn = node.querySelector('[data-tut-next]');
    nextBtn.style.display = step.waitFor === 'acknowledge' ? 'inline-flex' : 'none';
    // Tombol Lewati tidak perlu di kartu penutup.
    const skipBtn = node.querySelector('[data-tut-skip]');
    skipBtn.style.display = step.mode === 'center' ? 'none' : '';
    _startPoll(step);
    requestAnimationFrame(function () { _reposition(); });
    setTimeout(_reposition, 120);
    setTimeout(_reposition, 400);
}

function _reposition() {
    if (!_node || !_currentStep) return;
    const hole = _node.querySelector('.tut-hole');
    const dim = _node.querySelector('.tut-dim');
    const bubble = _node.querySelector('.tut-bubble');
    const mode = _currentStep.mode || 'normal';

    bubble.style.transform = '';
    bubble.style.left = '12px';
    bubble.style.right = '12px';

    if (mode === 'center') {
        hole.style.display = 'none';
        dim.style.display = 'block';
        dim.style.pointerEvents = 'auto';
        bubble.style.top = '50%';
        bubble.style.bottom = 'auto';
        bubble.style.transform = 'translateY(-50%)';
        return;
    }

    dim.style.display = 'none';

    if (mode === 'banner') {
        hole.style.display = 'none';
        bubble.style.top = 'auto';
        bubble.style.bottom = 'calc(84px + env(safe-area-inset-bottom, 0px))';
        return;
    }

    // Ambil elemen target yang TERLIHAT (di desktop bottom nav tersembunyi, sidebar yang tampil; di mobile sebaliknya).
    const matches = _currentStep.target ? document.querySelectorAll(_currentStep.target) : [];
    let target = null;
    for (let i = 0; i < matches.length; i++) {
        if (matches[i].getClientRects().length) { target = matches[i]; break; }
    }
    if (!target) {
        // Target belum ada (mis. modal belum terbuka): tanpa spotlight, gelembung di bawah.
        hole.style.display = 'none';
        bubble.style.top = 'auto';
        bubble.style.bottom = 'calc(84px + env(safe-area-inset-bottom, 0px))';
        return;
    }
    hole.style.display = '';
    const r = target.getBoundingClientRect();
    const pad = 6;
    hole.style.left   = (r.left - pad) + 'px';
    hole.style.top    = (r.top - pad) + 'px';
    hole.style.width  = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow > 220) {
        bubble.style.top = (r.bottom + 14) + 'px';
        bubble.style.bottom = 'auto';
    } else {
        bubble.style.bottom = (window.innerHeight - r.top + 14) + 'px';
        bubble.style.top = 'auto';
    }
}

function _hide() {
    _stopPoll();
    if (_node) _node.classList.remove('visible');
    setTimeout(function () { if (_node) _node.classList.remove('visible'); }, 200);
    _currentStep = null;
}
