// FILE: src/ui/panels/TutorialOverlay.js
// Overlay spotlight. Elemen target di-highlight, sisanya diredupkan.
import { bus } from '../../core/EventBus.js';

let _node = null;
let _currentStep = null;
let _stepIndex = 0;
let _totalSteps = 0;

export function initTutorialOverlay() {
    bus.on('tutorial:step-changed', ({ stepIndex, step }) => _show(stepIndex, step));
    bus.on('tutorial:completed', () => _hide());
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
                <button class="tut-skip" data-tut-skip>Lewati</button>
                <button class="tut-next" data-tut-next>Lanjut</button>
            </div>
        </div>
    `;
    document.body.appendChild(_node);

    _node.querySelector('[data-tut-skip]').addEventListener('click', () => {
        bus.emit('tutorial:skip');
    });
    _node.querySelector('[data-tut-next]').addEventListener('click', () => {
        bus.emit('tutorial:next');
    });
    window.addEventListener('resize', () => _reposition());
    return _node;
}

function _show(stepIndex, step) {
    _currentStep = step;
    _stepIndex = stepIndex;
    const node = _ensureNode();
    node.classList.add('visible');
    node.querySelector('.tut-title').textContent = step.title;
    node.querySelector('.tut-text').textContent = step.text;
    // Tombol "Lanjut" hanya untuk step acknowledge
    const nextBtn = node.querySelector('[data-tut-next]');
    nextBtn.style.display = step.waitFor === 'acknowledge' ? 'inline-flex' : 'none';
    // Reposisi setelah layout selesai
    requestAnimationFrame(() => _reposition());
    // Target bisa berubah (re-render); pantau singkat
    setTimeout(_reposition, 120);
    setTimeout(_reposition, 400);
}

function _reposition() {
    if (!_node || !_currentStep) return;
    const target = document.querySelector(_currentStep.target);
    if (!target) return;
    const r = target.getBoundingClientRect();
    const pad = 6;
    const hole = _node.querySelector('.tut-hole');
    hole.style.left   = (r.left - pad) + 'px';
    hole.style.top    = (r.top - pad) + 'px';
    hole.style.width  = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    // Posisi bubble: bawah target jika ada ruang, atas jika tidak
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
    setTimeout(() => { if (_node) _node.classList.remove('visible'); _currentStep = null; }, 200);
    _currentStep = null;
}
