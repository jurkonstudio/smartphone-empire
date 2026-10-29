// FILE: src/ui/panels/I18nAdminPanel.js
// v2027.1a — Panel admin untuk edit terjemahan.
// Akses: Settings → Data → Translation Admin (atau __game.i18nAdmin()).
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { LanguageService } from '../../core/LanguageService.js';
import { I18nCloudService } from '../../services/i18n/I18nCloudService.js';
import { CloudService } from '../../services/CloudService.js';

function _esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

var _filter = 'missing';
var _search = '';

function _renderRow(key) {
    var en = LanguageService.getEffectiveValue('en', key) || '';
    var id = LanguageService.getEffectiveValue('id', key) || '';
    var isCloud = LanguageService.isCloudOverridden(key);
    var badge = isCloud ? '<span style="color:var(--accent);font-size:9px;font-weight:700;"> • CLOUD</span>' : '';

    return '<div data-i18n-row="' + _esc(key) + '" style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;background:var(--bg-3);">' +
        '<div style="font-size:10px;font-family:ui-monospace,monospace;color:var(--text-mute);word-break:break-all;margin-bottom:6px;">' +
            _esc(key) + badge + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:10px;color:var(--text-mute);">EN</label>' +
            '<input data-i18n-input-en="' + _esc(key) + '" value="' + _esc(en) + '" ' +
                'style="width:100%;padding:6px 8px;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:12px;" />' +
            '<label style="font-size:10px;color:var(--text-mute);">ID</label>' +
            '<input data-i18n-input-id="' + _esc(key) + '" value="' + _esc(id) + '" ' +
                'style="width:100%;padding:6px 8px;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:12px;" />' +
            '<div style="display:flex;gap:6px;margin-top:4px;">' +
                '<button class="btn-primary" data-i18n-save="' + _esc(key) + '" style="flex:1;padding:6px;font-size:11px;">Save</button>' +
                '<button class="btn-secondary" data-i18n-del="' + _esc(key) + '" style="flex:1;padding:6px;font-size:11px;">Reset</button>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function _renderBody() {
    var missing = LanguageService.getMissingKeys();
    var localEn = LanguageService.getLocalDict('en');
    var localId = LanguageService.getLocalDict('id');
    var allKeys = new Set();
    Object.keys(localEn).forEach(function (k) { allKeys.add(k); });
    Object.keys(localId).forEach(function (k) { allKeys.add(k); });
    missing.forEach(function (k) { allKeys.add(k); });

    var list = Array.from(allKeys).sort();

    if (_filter === 'missing') {
        list = missing.slice();
    }
    if (_search) {
        var s = _search.toLowerCase();
        list = list.filter(function (k) { return k.toLowerCase().indexOf(s) !== -1; });
    }

    if (!list.length) {
        return '<div style="font-size:12px;color:var(--text-mute);padding:12px 0;text-align:center;">' +
            (_filter === 'missing' ? 'Tidak ada missing key 🎉' : 'Tidak ada hasil.') + '</div>';
    }

    return '<div style="max-height:60vh;overflow-y:auto;">' +
        list.map(_renderRow).join('') +
    '</div>';
}

export function openI18nAdmin() {
    var connected = CloudService.getStatus() === 'connected';
    var header =
        '<div class="modal-title">🌐 i18n Admin</div>' +
        '<div class="modal-sub">' +
            (connected ? 'Cloud: connected ✅' : 'Cloud: not connected — login dulu untuk save.') +
        '</div>' +

        '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
            '<button data-i18n-filter="missing" class="' + (_filter === 'missing' ? 'btn-primary' : 'btn-secondary') + '" style="flex:1;padding:8px;font-size:11px;">Missing</button>' +
            '<button data-i18n-filter="all" class="' + (_filter === 'all' ? 'btn-primary' : 'btn-secondary') + '" style="flex:1;padding:8px;font-size:11px;">All</button>' +
        '</div>' +
        '<input data-i18n-search placeholder="Cari key…" value="' + _esc(_search) + '" ' +
            'style="width:100%;padding:8px 10px;background:var(--bg-3);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:12px;margin-bottom:10px;" />' +

        '<div id="i18n-admin-list">' + _renderBody() + '</div>' +

        '<div style="display:flex;gap:6px;margin-top:10px;">' +
            '<button class="btn-secondary" data-i18n-clear-tracker style="flex:1;padding:8px;font-size:11px;">Clear Missing List</button>' +
            '<button class="btn-secondary" data-modal-close style="flex:1;padding:8px;font-size:11px;">Tutup</button>' +
        '</div>';

    Modal.open('i18n-admin', header, { dismissible: true });

    var root = document.querySelector('[data-modal-id="i18n-admin"]');
    if (!root) return;

    function refreshList() {
        var box = root.querySelector('#i18n-admin-list');
        if (box) box.innerHTML = _renderBody();
    }

    root.addEventListener('click', function (e) {
        var filterBtn = e.target.closest('[data-i18n-filter]');
        if (filterBtn) {
            _filter = filterBtn.dataset.i18nFilter;
            Modal.close('i18n-admin', true);
            openI18nAdmin();
            return;
        }
        var saveBtn = e.target.closest('[data-i18n-save]');
        if (saveBtn) {
            var key = saveBtn.dataset.i18nSave;
            var enEl = root.querySelector('[data-i18n-input-en="' + key + '"]');
            var idEl = root.querySelector('[data-i18n-input-id="' + key + '"]');
            var enVal = enEl ? enEl.value : '';
            var idVal = idEl ? idEl.value : '';
            Promise.all([
                I18nCloudService.saveString('en', key, enVal),
                I18nCloudService.saveString('id', key, idVal)
            ]).then(function (results) {
                if (results[0].ok && results[1].ok) {
                    ToastService.success('Saved: ' + key);
                    var map = I18nCloudService.getCached(LanguageService.getLang()) || {};
                    LanguageService.applyCloudStrings(LanguageService.getLang(), map);
                    LanguageService.clearMissingKeys();
                    refreshList();
                } else {
                    ToastService.error(results[0].reason || results[1].reason || 'Save gagal.');
                }
            });
            return;
        }
        var delBtn = e.target.closest('[data-i18n-del]');
        if (delBtn) {
            var key2 = delBtn.dataset.i18nDel;
            Promise.all([
                I18nCloudService.deleteString('en', key2),
                I18nCloudService.deleteString('id', key2)
            ]).then(function () {
                ToastService.info('Reset: ' + key2);
                var map = I18nCloudService.getCache ? I18nCloudService.getCache(LanguageService.getLang()) : null;
                var cached = I18nCloudService.getCached ? I18nCloudService.getCached(LanguageService.getLang()) : map;
                LanguageService.applyCloudStrings(LanguageService.getLang(), cached || {});
                refreshList();
            });
            return;
        }
        var clearBtn = e.target.closest('[data-i18n-clear-tracker]');
        if (clearBtn) {
            LanguageService.clearMissingKeys();
            ToastService.info('Missing list dibersihkan.');
            Modal.close('i18n-admin', true);
            openI18nAdmin();
            return;
        }
    });

    var searchEl = root.querySelector('[data-i18n-search]');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            _search = searchEl.value;
            refreshList();
        });
    }
}
