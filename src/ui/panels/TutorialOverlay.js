// FILE: src/ui/panels/TutorialOverlay.js
// v2027.13c — i18n.
// Overlay spotlight. Elemen target di-highlight, sisanya diredupkan.
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';

let _node = null;
let _currentStep = null;
let _stepIndex = 0;
let _totalSteps = 0;

export function initTutorialOverlay() {
    bus.on('tutorial:step-changed', function (data) { _show(data.stepIndex, data.step); });
    bus.on('tutorial:completed', function () { _hide(); });
}

function _ensureNode() {
    if (_node) return _node;
    _node = document.createElement('div');
    _node.className = 'tut-root';
    _node.innerHTML = `
        <div class="tut-dim"></div>
        <div class="tut-hole"></div>
        <div class="tut-bubble">
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

function _show(stepIndex, step) {
    _currentStep = step;
    _stepIndex = stepIndex;
    const node = _ensureNode();
    node.classList.add('visible');
    node.querySelector('.tut-title').textContent = step.title;
    node.querySelector('.tut-text').textContent = step.text;
    const nextBtn = node.querySelector('[data-tut-next]');
    nextBtn.style.display = step.waitFor === 'acknowledge' ? 'inline-flex' : 'none';
    requestAnimationFrame(function () { _reposition(); });
    setTimeout(_reposition, 120);
    setTimeout(_reposition, 400);
}

function _reposition() {
    if (!_node || !_currentStep) return;
    // Ambil elemen target yang TERLIHAT (di desktop bottom nav tersembunyi, sidebar yang tampil; di mobile sebaliknya).
    const matches = document.querySelectorAll(_currentStep.target);
    let target = null;
    for (let i = 0; i < matches.length; i++) {
        if (matches[i].getClientRects().length) { target = matches[i]; break; }
    }
    if (!target) return;
    const r = target.getBoundingClientRect();
    const pad = 6;
    const hole = _node.querySelector('.tut-hole');
    hole.style.left   = (r.left - pad) + 'px';
    hole.style.top    = (r.top - pad) + 'px';
    hole.style.width  = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    const bubble = _node.querySelector('.tut-bubble');
    bubble.style.left = '12px';
    bubble.style.right = '12px';
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
    if (_node) _node.classList.remove('visible');
    setTimeout(function () { if (_node) _node.classList.remove('visible'); _currentStep = null; }, 200);
    _currentStep = null;
}
