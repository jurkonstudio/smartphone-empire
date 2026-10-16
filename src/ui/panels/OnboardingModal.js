// FILE: src/ui/panels/OnboardingModal.js
// v2027.33b — validasi nama via name-blocklist.data.js
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { DIFFICULTY } from '../../config/constants.js';
import { t } from '../../core/LanguageService.js';
import { validateCompanyName } from '../../data/name-blocklist.data.js';
import { checkCompanyNameAvailable } from '../../services/cloud/CompanyNameCheck.js';

const DIFF_INFO = {
    santai: { labelKey: 'onb.diff_santai', descKey: 'onb.diff_santai_desc' },
    normal: { labelKey: 'onb.diff_normal', descKey: 'onb.diff_normal_desc' },
    sulit:  { labelKey: 'onb.diff_sulit',  descKey: 'onb.diff_sulit_desc' }
};

// Map reason -> i18n key
function _reasonToKey(reason) {
    switch (reason) {
        case 'empty':      return 'onb.name.error_empty';
        case 'too_short':  return 'onb.name.error_too_short';
        case 'too_long':   return 'onb.name.error_too_long';
        case 'competitor': return 'onb.name.error_competitor';
        case 'brand':      return 'onb.name.error_brand';
        case 'profanity':  return 'onb.name.error_profanity';
        default:           return 'onb.name.error_profanity';
    }
}

export function showOnboarding() {
    return new Promise(function (resolve) {
        let selected = DIFFICULTY.normal;

        const html = `
            <div class="modal-title">${t('onb.title')}</div>
            <div class="modal-sub">${t('onb.sub')}</div>

            <label class="field-label">${t('onb.name_label')}</label>
            <input class="field-input" data-onb-name maxlength="24"
                   placeholder="${t('onb.name_placeholder')}"
                   autocomplete="off" autocapitalize="words" />
            <div data-onb-error style="display:none;color:var(--danger);font-size:12px;margin-top:6px;line-height:1.4;"></div>

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
        const errorEl = root.querySelector('[data-onb-error]');
        const submitBtn = root.querySelector('[data-onb-submit]');

        function _clearError() {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
            nameInput.style.borderColor = '';
        }

        function _showError(reasonKey) {
            errorEl.textContent = t(reasonKey);
            errorEl.style.display = 'block';
            nameInput.style.borderColor = 'var(--danger)';
        }

        // Real-time: clear error saat user ngetik
        nameInput.addEventListener('input', _clearError);

        // Validasi saat blur
        nameInput.addEventListener('blur', function () {
            const name = nameInput.value.trim();
            if (!name) return;
            const result = validateCompanyName(name);
            if (!result.ok) { _showError(_reasonToKey(result.reason)); return; }
            // Cek nama sudah dipakai pemain lain (tanpa memblokir bila tidak bisa dicek).
            checkCompanyNameAvailable(name).then(function (av) {
                if (av === false && nameInput.value.trim() === name) _showError('onb.name.error_taken');
            });
        });

        root.querySelectorAll('[data-onb-diff]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selected = btn.dataset.onbDiff;
                root.querySelectorAll('[data-onb-diff]').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });

        let _checking = false;
        submitBtn.addEventListener('click', async function () {
            if (_checking) return;
            const result = validateCompanyName(nameInput.value);

            if (!result.ok) {
                _showError(_reasonToKey(result.reason));
                nameInput.focus();
                return;
            }

            const finalName = nameInput.value.trim();

            // Nama harus unik antar pemain.
            _checking = true;
            const origLabel = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = t('onb.name.checking');
            const available = await checkCompanyNameAvailable(finalName);
            _checking = false;
            submitBtn.disabled = false;
            submitBtn.textContent = origLabel;
            if (available === false) {
                _showError('onb.name.error_taken');
                nameInput.focus();
                return;
            }

            Modal.close('onboarding', true);
            bus.emit('onboarding:done', { companyName: finalName, difficulty: selected });
            resolve({ companyName: finalName, difficulty: selected });
        });
    });
}
