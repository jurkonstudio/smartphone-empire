// FILE: src/ui/panels/OnboardingModal.js
// v2027.33a — validasi nama: blocklist kompetitor + kata kotor (ID/EN)
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { DIFFICULTY } from '../../config/constants.js';
import { t } from '../../core/LanguageService.js';

const DIFF_INFO = {
    santai: { labelKey: 'onb.diff_santai', descKey: 'onb.diff_santai_desc' },
    normal: { labelKey: 'onb.diff_normal', descKey: 'onb.diff_normal_desc' },
    sulit:  { labelKey: 'onb.diff_sulit',  descKey: 'onb.diff_sulit_desc' }
};

// ============================================================
// BLOCKLIST — nama yang tidak boleh dipakai
// ============================================================

// Nama kompetitor (exact match setelah normalisasi)
const BLOCK_COMPETITORS = [
    'nokia', 'motorola', 'sony', 'sonyericsson', 'ericsson',
    'samsung', 'lg', 'siemens', 'palm', 'blackberry', 'rim',
    'apple', 'htc', 'google', 'android', 'huawei', 'xiaomi',
    'oppo', 'vivo', 'microsoft', 'lumia', 'honor', 'nothing',
    'iphone', 'ipad', 'galaxy', 'pixel', 'redmi', 'poco',
    'oneplus', 'realme', 'asus', 'lenovo', 'alcatel', 'zte',
    'tecno', 'infinix', 'nubia', 'sharp', 'panasonic'
];

// Kata kotor Indonesia (partial match — kalau mengandung)
const BLOCK_PROFANITY_ID = [
    'anjing', 'anjg', 'anjeng', 'asu', 'babi', 'bangsat', 'bajingan',
    'monyet', 'kunyuk', 'kampret', 'keparat', 'goblok', 'goblog',
    'tolol', 'bego', 'idiot', 'sinting', 'gila', 'sarap', 'ontohod',
    'dungu', 'bodoh', 'ngentot', 'entot', 'memek', 'kontol', 'kntl',
    'pepek', 'jembut', 'tetek', 'sange', 'cabul', 'coli', 'colmek',
    'bokep', 'porno', 'tai', 'taik', 'sampah', 'bangke', 'najis',
    'setan', 'iblis', 'tuyul', 'jahanam', 'sialan', 'modar', 'mampus',
    'brengsek', 'bejat', 'peler', 'pler', 'jancok', 'jancuk', 'cok',
    'cuk', 'kampang', 'perek', 'lonte', 'pelacur', 'sundal', 'bispak'
];

// Kata kotor Inggris (partial match)
const BLOCK_PROFANITY_EN = [
    'fuck', 'fuk', 'fck', 'shit', 'sh1t', 'asshole', 'bastard',
    'bitch', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
    'porn', 'sex', 'penis', 'vagina', 'nigger', 'nigga', 'fag',
    'faggot', 'retard', 'chink', 'kike', 'crap', 'piss', 'anus'
];

// ============================================================
// NORMALISASI — hilangkan variasi leetspeak, spasi, simbol
// ============================================================
function _normalize(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/[\s\-_.]+/g, '')
        .replace(/(.)\1{2,}/g, '$1'); // gobloook -> goblok
}

// ============================================================
// VALIDASI
// ============================================================
function _validateName(rawName) {
    const name = (rawName || '').trim();

    if (!name) return { ok: false, errorKey: 'onb.name.error_empty' };
    if (name.length < 2) return { ok: false, errorKey: 'onb.name.error_too_short' };
    if (name.length > 24) return { ok: false, errorKey: 'onb.name.error_too_long' };

    const norm = _normalize(name);

    // Cek kompetitor (exact match setelah normalisasi)
    for (const comp of BLOCK_COMPETITORS) {
        if (_normalize(comp) === norm) {
            return { ok: false, errorKey: 'onb.name.error_competitor' };
        }
    }

    // Cek kata kotor ID (partial match)
    for (const word of BLOCK_PROFANITY_ID) {
        if (norm.includes(_normalize(word))) {
            return { ok: false, errorKey: 'onb.name.error_profanity' };
        }
    }

    // Cek kata kotor EN (partial match)
    for (const word of BLOCK_PROFANITY_EN) {
        if (norm.includes(_normalize(word))) {
            return { ok: false, errorKey: 'onb.name.error_profanity' };
        }
    }

    return { ok: true, name: name };
}

// ============================================================
// MODAL
// ============================================================
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

        // Helper: reset error state
        function _clearError() {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
            nameInput.style.borderColor = '';
        }

        function _showError(key) {
            errorEl.textContent = t(key);
            errorEl.style.display = 'block';
            nameInput.style.borderColor = 'var(--danger)';
        }

        // Real-time: clear error saat user ngetik
        nameInput.addEventListener('input', _clearError);

        // Real-time: validasi saat blur (biar gak ganggu saat ngetik)
        nameInput.addEventListener('blur', function () {
            const name = nameInput.value.trim();
            if (!name) return;
            const result = _validateName(name);
            if (!result.ok) _showError(result.errorKey);
        });

        // Difficulty
        root.querySelectorAll('[data-onb-diff]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selected = btn.dataset.onbDiff;
                root.querySelectorAll('[data-onb-diff]').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });

        // Submit
        submitBtn.addEventListener('click', function () {
            const rawName = nameInput.value;
            const result = _validateName(rawName);

            if (!result.ok) {
                _showError(result.errorKey);
                nameInput.focus();
                return;
            }

            const finalName = result.name;

            Modal.close('onboarding', true);
            bus.emit('onboarding:done', { companyName: finalName, difficulty: selected });
            resolve({ companyName: finalName, difficulty: selected });
        });
    });
}
