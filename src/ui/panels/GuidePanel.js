// FILE: src/ui/panels/GuidePanel.js
// v2027.13c — i18n.
import { t } from '../../core/LanguageService.js';

const GLOSSARY_KEYS = [
    { term: 'guide.term.reputation', def: 'guide.def.reputation' },
    { term: 'guide.term.share',      def: 'guide.def.share' },
    { term: 'guide.term.quality',    def: 'guide.def.quality' },
    { term: 'guide.term.burnrate',   def: 'guide.def.burnrate' },
    { term: 'guide.term.rnd',        def: 'guide.def.rnd' },
    { term: 'guide.term.era',        def: 'guide.def.era' },
    { term: 'guide.term.os',         def: 'guide.def.os' },
    { term: 'guide.term.prototype',  def: 'guide.def.prototype' },
    { term: 'guide.term.lifecycle',  def: 'guide.def.lifecycle' }
];

export function renderGuidePanel() {
    return `
        <div class="card">
            <div class="card-title">${t('guide.glossary_title')}</div>
            ${GLOSSARY_KEYS.map(function (g) {
                return '<div class="gloss-row">' +
                    '<b>' + t(g.term) + '</b>' +
                    '<span>' + t(g.def) + '</span>' +
                    '</div>';
            }).join('')}
        </div>
        <div class="card">
            <div class="card-title">${t('guide.tips_title')}</div>
            <ul class="tips-list">
                <li>${t('guide.tip.1')}</li>
                <li>${t('guide.tip.2')}</li>
                <li>${t('guide.tip.3')}</li>
                <li>${t('guide.tip.4')}</li>
                <li>${t('guide.tip.5')}</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">${t('guide.shortcuts_title')}</div>
            <div class="sum-row"><span>Space</span><b>${t('header.pause_aria')} / ${t('header.play_aria')}</b></div>
            <div class="sum-row"><span>F</span><b>${t('header.speed_aria')}</b></div>
        </div>
        <button class="btn-secondary" data-nav="settings" style="width:100%;margin-top:8px;">${t('guide.back')}</button>
    `;
}
