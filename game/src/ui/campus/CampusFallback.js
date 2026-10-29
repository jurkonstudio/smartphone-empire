// FILE: src/ui/campus/CampusFallback.js
// Tampilan loading + fallback responsif dengan panel glass dan latar atmosferik; i18n tetap dipakai.
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

export function renderCampusLoading() {
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--text-secondary);' +
        'background:radial-gradient(ellipse at 50% 35%,var(--accent-soft),transparent 68%);">' +
        '<span style="display:inline-flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid var(--border-subtle);' +
        'border-radius:16px;background:var(--surface-glass,rgba(255,255,255,.72));backdrop-filter:blur(12px);' +
        'box-shadow:0 8px 28px rgba(15,23,42,.08);">' + t('home.campus.loading') + '</span></div>';
}

export function renderCampusFallback() {
    return '<div style="position:relative;overflow:hidden;text-align:center;padding:clamp(36px,9vw,60px) 20px;' +
        'border:1px solid var(--border-subtle);border-radius:24px;background:radial-gradient(ellipse at 50% 0%,var(--accent-soft),transparent 65%);">' +
        '<div style="display:inline-flex;align-items:center;justify-content:center;width:clamp(64px,18vw,88px);height:clamp(64px,18vw,88px);border-radius:24px;background:linear-gradient(145deg,var(--accent-soft),var(--surface-secondary,rgba(127,127,127,.08)));color:var(--accent);margin-bottom:18px;border:1px solid var(--border-subtle);box-shadow:0 12px 28px rgba(15,23,42,.10);">' +
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
