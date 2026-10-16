// FILE: src/ui/social/ProfileEditModals.js  (BARU)
// Modal: ganti nama perusahaan (gratis 2x lalu 150 SIL) & edit profil pemain.
import { checkCompanyNameAvailable } from '../../services/cloud/CompanyNameCheck.js';
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import { t } from '../../core/LanguageService.js';
import {
    NAME_RULES, getNameChangeInfo, changeCompanyName, validateName, nameErrorKey,
    setDisplayName, getDisplayName, getAvatar, processImageFile, commitAvatar, pushToCloud
} from '../../systems/PlayerProfileService.js';
import { avatarHtml, esc } from './AvatarView.js';

function _rerender() { try { window.__game.render(); } catch (e) {} }

// ============================================================
// GANTI NAMA PERUSAHAAN
// ============================================================
export function openEditCompanyNameModal() {
    var s = state.get();
    var info = getNameChangeInfo();
    var paid = info.cost > 0;

    var rule = paid
        ? t('pp.company.rule_paid', { cost: NAME_RULES.silCost })
        : t('pp.company.rule_free', { n: info.freeLeft, cost: NAME_RULES.silCost });
    var badge = paid
        ? '<span class="pf-badge pf-badge-sil">💎 ' + esc(t('pp.company.paid_badge', { cost: info.cost })) + '</span>'
        : '<span class="pf-badge pf-badge-free">' + esc(t('pp.company.free_left', { n: info.freeLeft })) + '</span>';

    var html =
        '<div class="modal-title">' + esc(t('settings.edit_name.title')) + '</div>' +
        '<div class="modal-sub">' + esc(t('settings.edit_name.sub')) + '</div>' +
        '<div class="pf-rule">' + badge + '<span>' + esc(rule) + '</span></div>' +
        '<label class="field-label">' + esc(t('settings.edit_name.label')) + '</label>' +
        '<input class="field-input" data-edit-company-name maxlength="' + NAME_RULES.max + '" value="' + esc(s.companyName || '') +
            '" placeholder="' + esc(t('settings.edit_name.placeholder')) + '" autocomplete="off" />' +
        '<div class="pf-field-error" data-edit-name-error></div>' +
        '<div class="pf-pay" data-pay-box style="display:none;"></div>' +
        '<div class="pf-modal-actions">' +
            '<button class="btn-secondary" data-modal-close type="button">' + esc(t('common.cancel')) + '</button>' +
            '<button class="btn-primary" data-edit-company-confirm type="button">' +
                esc(paid ? t('pp.company.pay', { cost: info.cost }) : t('common.save')) + '</button>' +
        '</div>';

    Modal.open('edit-company-name', html);
    var root = document.querySelector('[data-modal-id="edit-company-name"]');
    if (!root) return;

    var input = root.querySelector('[data-edit-company-name]');
    var errEl = root.querySelector('[data-edit-name-error]');
    var payBox = root.querySelector('[data-pay-box]');
    var btn = root.querySelector('[data-edit-company-confirm]');
    var armed = false;
    if (input) { input.focus(); input.select(); }

    function showError(msg) {
        errEl.textContent = msg; errEl.style.display = 'block';
        input.classList.add('is-invalid');
    }
    function clearError() {
        errEl.style.display = 'none'; errEl.textContent = '';
        input.classList.remove('is-invalid');
        if (armed) { armed = false; payBox.style.display = 'none'; btn.textContent = t('pp.company.pay', { cost: info.cost }); }
    }
    input.addEventListener('input', clearError);

    btn.addEventListener('click', async function () {
        var v = validateName(input.value);
        if (!v.ok) { showError(t(nameErrorKey(v.reason))); input.focus(); return; }
        if (v.name === String(s.companyName || '').trim()) { showError(t('pp.company.same')); return; }

        // Nama harus unik antar pemain (dicek sebelum konfirmasi bayar).
        if (!armed) {
            var av = await checkCompanyNameAvailable(v.name);
            if (av === false) { showError(t('onb.name.error_taken')); input.focus(); return; }
        }

        // Berbayar: konfirmasi 2 langkah supaya SIL tidak terpotong tak sengaja.
        if (paid && !armed) {
            var fresh = getNameChangeInfo();
            var short = fresh.cost - fresh.balance;
            if (short > 0) {
                payBox.innerHTML =
                    '<div class="pf-pay-line is-short">' + esc(t('pp.company.short', { n: short })) + '</div>' +
                    '<button class="btn-secondary" data-topup type="button" style="width:100%;margin-top:8px;">💎 ' + esc(t('pp.company.topup')) + '</button>';
                payBox.style.display = 'block';
                var tb = payBox.querySelector('[data-topup]');
                if (tb) tb.addEventListener('click', function () {
                    Modal.close('edit-company-name', true);
                    try { window.__game.openSiliconStore(); } catch (e) {}
                });
                return;
            }
            armed = true;
            payBox.innerHTML =
                '<div class="pf-pay-line">' + esc(t('pp.company.confirm_paid', { cost: fresh.cost })) + '</div>' +
                '<div class="pf-pay-sub">' + esc(t('pp.company.balance', { n: fresh.balance })) + '</div>';
            payBox.style.display = 'block';
            btn.textContent = t('pp.company.confirm_yes');
            return;
        }

        var res = changeCompanyName(input.value);
        if (!res.ok) {
            if (res.reason === 'insufficient') { armed = false; btn.click(); return; }
            showError(t(res.reason === 'same' ? 'pp.company.same' : nameErrorKey(res.reason)));
            return;
        }
        Modal.close('edit-company-name', true);
        ToastService.success(res.cost > 0 ? t('pp.company.done_paid', { cost: res.cost }) : t('pp.company.done_free'));
        _rerender();
    });
}

// ============================================================
// EDIT PROFIL PEMAIN (nama pemain + foto)
// ============================================================
export function openEditPlayerModal() {
    var staged = { avatar: getAvatar(), blob: null, touched: false };
    var nameNow = getDisplayName();

    var html =
        '<div class="modal-title">' + esc(t('pp.player.edit')) + '</div>' +
        '<div class="modal-sub">' + esc(t('pp.player.edit_sub')) + '</div>' +
        '<div class="pf-photo-edit">' +
            '<div data-photo-preview></div>' +
            '<div class="pf-photo-actions">' +
                '<button class="btn-secondary" data-photo-pick type="button">' + esc(t('pp.player.photo_change')) + '</button>' +
                '<button class="btn-secondary" data-photo-remove type="button">' + esc(t('pp.player.photo_remove')) + '</button>' +
            '</div>' +
            '<div class="pf-hint">' + esc(t('pp.player.photo_hint')) + '</div>' +
            '<input type="file" accept="image/*" data-photo-file hidden />' +
        '</div>' +
        '<label class="field-label">' + esc(t('pp.player.name_label')) + '</label>' +
        '<input class="field-input" data-player-name maxlength="' + NAME_RULES.max + '" value="' + esc(nameNow) +
            '" placeholder="' + esc(t('pp.player.name_ph')) + '" autocomplete="off" />' +
        '<div class="pf-field-error" data-player-error></div>' +
        '<div class="pf-modal-actions">' +
            '<button class="btn-secondary" data-modal-close type="button">' + esc(t('common.cancel')) + '</button>' +
            '<button class="btn-primary" data-player-save type="button">' + esc(t('common.save')) + '</button>' +
        '</div>';

    Modal.open('edit-player', html);
    var root = document.querySelector('[data-modal-id="edit-player"]');
    if (!root) return;

    var preview = root.querySelector('[data-photo-preview]');
    var fileEl = root.querySelector('[data-photo-file]');
    var nameEl = root.querySelector('[data-player-name]');
    var errEl = root.querySelector('[data-player-error]');

    function paint() {
        var label = nameEl.value || getDisplayName() || state.get().companyName;
        preview.innerHTML = avatarHtml({ src: staged.avatar, name: label, size: 92, cls: 'pp-avatar-lg' });
    }
    function showError(msg) { errEl.textContent = msg; errEl.style.display = 'block'; nameEl.classList.add('is-invalid'); }
    function clearError() { errEl.style.display = 'none'; nameEl.classList.remove('is-invalid'); }
    paint();
    nameEl.addEventListener('input', function () { clearError(); if (!staged.avatar) paint(); });

    root.querySelector('[data-photo-pick]').addEventListener('click', function () { fileEl.click(); });
    root.querySelector('[data-photo-remove]').addEventListener('click', function () {
        staged.avatar = ''; staged.blob = null; staged.touched = true; paint();
    });
    fileEl.addEventListener('change', async function () {
        var f = fileEl.files && fileEl.files[0];
        fileEl.value = '';
        if (!f) return;
        try {
            var r = await processImageFile(f);
            staged.avatar = r.dataUrl; staged.blob = r.blob; staged.touched = true; paint();
        } catch (e) {
            var code = e && e.code;
            ToastService.error(t(code === 'type' ? 'pp.player.err_type' : code === 'big' ? 'pp.player.err_big' : 'pp.player.err_read'));
        }
    });

    root.querySelector('[data-player-save]').addEventListener('click', async function () {
        var res = setDisplayName(nameEl.value);
        if (!res.ok) { showError(t(nameErrorKey(res.reason))); nameEl.focus(); return; }
        Modal.close('edit-player', true);
        if (staged.touched) await commitAvatar(staged.avatar, staged.blob);
        pushToCloud({ force: true });
        ToastService.success(t('pp.player.saved'));
        _rerender();
    });
}
