// FILE: src/ui/panels/TutorialOverlay.js
// Overlay spotlight. Elemen target di-highlight, sisanya diredupkan.
// Tombol Lanjut selalu tampil; ketukan pada target juga tembus ke tombol aslinya
// karena overlay memakai pointer-events: none (lihat style.css .tut-*).
import { bus } from '../../core/EventBus.js';

let _node = null;
let _currentStep = null;
let _stepIndex = 0;
let _totalSteps = 0;

export function initTutorialOverlay() {
    bus.on('tutorial:step-changed', ({ stepIndex, step, totalSteps }) => _show(stepIndex, step, totalSteps));
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
            <div class="tut-progress"></div>
            <div class="tut-title"></div>
            <div class="tut-text"></div>
            <div class="tut-actions">
                <button class="tut-skip" data-tut-skip>Lewati</button>
                <button class="tut-next" data-tut-next>Lanjut</button>
            </div>
        </div>
    `;
    document.body.appendChild(_node);

    _node.querySelector('[data-tut-skip]').addEventListener('click', (e) => {
        e.stopPropagation();
        bus.emit('tutorial:skip');
    });
    _node.querySelector('[data-tut-next]').addEventListener('click', (e) => {
        e.stopPropagation();
        _onNextClick();
    });
    window.addEventListener('resize', () => _reposition());
    return _node;
}

// Klik Lanjut / Selesai:
//   - step acknowledge -> langsung lanjut
//   - step aksi        -> klik target agar aksi benar-benar terjadi
//   - target hilang    -> fallback emit tutorial:next
function _onNextClick() {
    if (!_currentStep) return;
    if (_currentStep.waitFor === 'acknowledge') {
        bus.emit('tutorial:next');
        return;
    }
    const target = document.querySelector(_currentStep.target);
    if (target) {
        target.click();
        return;
    }
    bus.emit('tutorial:next');
}

function _show(stepIndex, step, totalSteps) {
    _currentStep = step;
    _stepIndex = stepIndex;
    if (typeof totalSteps === 'number' && totalSteps > 0) _totalSteps = totalSteps;

    const node = _ensureNode();
    node.classList.add('visible');

    const total = _totalSteps || 0;
    const isLast = total > 0 && stepIndex === total - 1;

    node.querySelector('.tut-progress').textContent = total > 0 ? ((stepIndex + 1) + ' / ' + total) : '';
    node.querySelector('.tut-title').textContent = step.title;
    node.querySelector('.tut-text').textContent = step.text;

    const nextBtn = node.querySelector('[data-tut-next]');
    nextBtn.style.display = 'inline-flex';
    nextBtn.textContent = isLast ? 'Selesai' : 'Lanjut';

    requestAnimationFrame(() => _reposition());
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
    _currentStep = null;
}
