// FILE: src/ui/panels/OnboardingModal.js
// Modal awal: nama perusahaan + tingkat kesulitan.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { DIFFICULTY } from '../../config/constants.js';

const DIFF_INFO = {
    santai: { label: 'Santai',  desc: 'Modal besar, biaya ringan, kompetitor ramah.' },
    normal: { label: 'Normal',  desc: 'Pengalaman standar, seimbang.' },
    sulit:  { label: 'Sulit',   desc: 'Modal kecil, biaya tinggi, kompetitor agresif.' }
};

export function showOnboarding() {
    return new Promise((resolve) => {
        let selected = DIFFICULTY.normal;

        const html = `
            <div class="modal-title">Selamat Datang</div>
            <div class="modal-sub">Mari mendirikan perusahaan ponsel pertamamu.</div>

            <label class="field-label">Nama perusahaan</label>
            <input class="field-input" data-onb-name maxlength="24" value="My Tech Co" />

            <label class="field-label" style="margin-top:12px;">Tingkat kesulitan</label>
            <div class="diff-grid">
                ${Object.entries(DIFF_INFO).map(([k, v]) => `
                    <button class="diff-btn ${k === 'normal' ? 'active' : ''}" data-onb-diff="${k}">
                        <div class="diff-label">${v.label}</div>
                        <div class="diff-desc">${v.desc}</div>
                    </button>
                `).join('')}
            </div>

            <button class="btn-primary" data-onb-submit style="margin-top:16px;">Mulai Bermain</button>
        `;

        Modal.open('onboarding', html, { dismissible: false });

        const root = document.querySelector('[data-modal-id="onboarding"]');
        const nameInput = root.querySelector('[data-onb-name]');

        root.querySelectorAll('[data-onb-diff]').forEach(btn => {
            btn.addEventListener('click', () => {
                selected = btn.dataset.onbDiff;
                root.querySelectorAll('[data-onb-diff]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        root.querySelector('[data-onb-submit]').addEventListener('click', () => {
            const name = (nameInput.value || '').trim() || 'My Tech Co';
            Modal.close('onboarding', true);
            bus.emit('onboarding:done', { companyName: name, difficulty: selected });
            resolve({ companyName: name, difficulty: selected });
        });
    });
}
