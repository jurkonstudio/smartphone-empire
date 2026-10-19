// FILE: src/ui/campus/CampusFallback.js
// Tampilan loading + fallback responsif; tetap memakai ikon dan string i18n yang ada.
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

export function renderCampusLoading() {
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'font-size:13px;color:var(--text-tertiary);">' + t('home.campus.loading') + '</div>';
}

export function renderCampusFallback() {
    return '<div style="text-align:center;padding:60px 20px;">' +
        '<div style="display:inline-flex;align-items:center;justify-content:center;width:clamp(64px,18vw,88px);height:clamp(64px,18vw,88px);border-radius:24px;background:var(--accent-soft);color:var(--accent);margin-bottom:18px;">' +
            renderIcon('layers', 40) +
        '</div>' +
        '<div style="font-size:17px;font-weight:700;margin-bottom:8px;letter-spacing:-0.01em;">' +
            t('home.placeholder.title') +
        '</div>' +
        '<div style="font-size:13px;color:var(--text-tertiary);line-height:1.6;max-width:300px;margin:0 auto;">' +
            t('home.placeholder.body') +
        '</div>' +
        '</div>';
}
