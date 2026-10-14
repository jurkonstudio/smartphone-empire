// FILE: src/ui/panels/OnboardingModal.js
// v2027.13c — i18n.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { DIFFICULTY } from '../../config/constants.js';
import { t } from '../../core/LanguageService.js';

const DIFF_INFO = {
    santai: { labelKey: 'onb.diff_santai', descKey: 'onb.diff_santai_desc' },
    normal: { labelKey: 'onb.diff_normal', descKey: 'onb.diff_normal_desc' },
    sulit:  { labelKey: 'onb.diff_sulit',  descKey: 'onb.diff_sulit_desc' }
};

export function showOnboarding() {
    return new Promise(function (resolve) {
        let selected = DIFFICULTY.normal;

        const html = `
            <div class="modal-title">${t('onb.title')}</div>
            <div class="modal-sub">${t('onb.sub')}</div>

            <label class="field-label">${t('onb.name_label')}</label>
            <input class="field-input" data-onb-name maxlength="24" value="My Tech Co" />

            <label class="field-label" style="margin-top:12px;">${t('onb.diff_label')}</label>
            <div class="diff-grid">
                ${Object.keys(DIFF_INFO).map(function (k) {
                    const info = DIFF_INFO[k];
                    return '<button class="diff-btn ' + (k === 'normal' ? 'active' : '') + '" data-onb-diff="' + k + '">' +
                        '<div class="diff-label">' + t(info.labelKey) + '</div>' +
                        '<div class="diff-desc">' + t(info.descKey) + '</div>' +
                        '</button>';
                }).join('')}
            </div>

            <button class="btn-primary" data-onb-submit style="margin-top:16px;">${t('onb.submit')}</button>
        `;

        Modal.open('onboarding', html, { dismissible: false });

        const root = document.querySelector('[data-modal-id="onboarding"]');
        const nameInput = root.querySelector('[data-onb-name]');

        root.querySelectorAll('[data-onb-diff]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selected = btn.dataset.onbDiff;
                root.querySelectorAll('[data-onb-diff]').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });

        root.querySelector('[data-onb-submit]').addEventListener('click', function () {
            const name = (nameInput.value || '').trim() || 'My Tech Co';
            Modal.close('onboarding', true);
            bus.emit('onboarding:done', { companyName: name, difficulty: selected });
            resolve({ companyName: name, difficulty: selected });
        });
    });
}
