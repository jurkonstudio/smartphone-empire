// FILE: src/ui/panels/DesignTracksPanel.js  (BARU — 0.2.9)
// Bilah kategori di atas tab Produk → Desain: Ponsel, Tablet, Earbuds nirkabel, Jam pintar, Charger.
// Tiap kategori menampilkan mockup, tahun dibuka, tahap popularitas (dihitung dari tahun game),
// dan grafik tren. Ponsel memakai kartu wizard asli dari ProductPanel (diteruskan lewat phoneHtml).
import { t } from '../../core/LanguageService.js';
import { DESIGN_TRACKS, getDesignTrack, trackPopularity, trackStage, trackSeries } from '../../data/design-tracks.data.js';
import { renderAccessoryMockup } from '../phone/AccessoryMockup.js';
import { renderTabletMockup } from '../phone/TabletMockup.js';

var _track = 'phone';

export function setDesignTrack(id) { if (getDesignTrack(id)) _track = id; }
export function getActiveDesignTrack() { return _track; }

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _bar(year) {
    var tracks = DESIGN_TRACKS;
    return '<div class="design-track-bar" style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px;">' +
        tracks.map(function (tr) {
            var active = tr.id === _track;
            var stage = trackStage(tr, year);
            var dot = stage === 'locked' ? '🔒 ' : '';
            return '<button class="subtab-btn ' + (active ? 'active' : '') + '" data-design-track="' + tr.id + '" ' +
                'style="flex:0 0 auto;padding:6px 10px;">' + dot + esc(t(tr.nameKey)) + '</button>';
        }).join('') + '</div>';
}

function _sparkline(track, year) {
    var from = Math.max(2000, track.intro - 2), to = track.peak + 8;
    var series = trackSeries(track, from, to);
    var W = 300, H = 64, n = series.length, bw = W / n;
    var bars = series.map(function (p, i) {
        var bh = Math.max(2, Math.round(p.value * (H - 14)));
        var cur = p.year === year;
        var fill = p.year > year ? '#3a3a3c' : (cur ? '#0a84ff' : '#5e5ce6');
        return '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (H - 12 - bh) + '" width="' + (bw - 2).toFixed(1) +
            '" height="' + bh + '" rx="2" fill="' + fill + '"><title>' + p.year + ': ' + Math.round(p.value * 100) + '%</title></rect>';
    }).join('');
    var labels = '<text x="0" y="' + (H - 1) + '" font-size="9" fill="#8e8e93">' + from + '</text>' +
        '<text x="' + W + '" y="' + (H - 1) + '" font-size="9" fill="#8e8e93" text-anchor="end">' + to + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(t('dt.trend', { from: from, to: to })) + '">' +
        bars + labels + '</svg>';
}

function _trackCard(track, year) {
    var stage = trackStage(track, year);
    var open = year >= track.intro;
    var pop = trackPopularity(track, year);
    var pct = Math.round(pop * 100);
    var closedLabel = t('dt.stage.locked');
    var mock = track.mock === 'tablet'
        ? renderTabletMockup(open, { width: 220, closedLabel: closedLabel })
        : renderAccessoryMockup(track.lineId, 'mid', { size: 170, open: open, closedLabel: closedLabel });
    var openLine = open
        ? t('dt.opens', { year: track.intro })
        : t('dt.locked_for', { year: track.intro, n: track.intro - year });
    var btn;
    if (track.mock === 'tablet') {
        btn = '<button class="btn-primary" disabled style="width:100%;margin-top:12px;opacity:.6;">' + esc(t('dt.soon')) + '</button>';
    } else if (open) {
        btn = '<div class="rg-btn-row"><button class="btn-secondary" data-nav="market" data-nav-sub="ecosystem">' + esc(t('dt.manage_line')) + '</button></div>';
    } else {
        btn = '<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:.6;">' + esc(openLine) + '</button>';
    }
    return '<div class="card">' +
        '<div class="card-title">' + esc(t(track.nameKey)) + ' · ' + esc(t('dt.stage.' + stage)) + '</div>' +
        '<div style="display:flex;justify-content:center;margin:8px 0;">' + mock + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;">' + esc(t('dt.desc.' + track.id)) + '</div>' +
        '<div class="progress-label" style="margin-top:10px;"><span>' + esc(t('dt.popularity', { year: year })) + '</span><span>' + pct + '%</span></div>' +
        '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;"></div></div>' +
        '<div style="font-size:11.5px;color:var(--text-mute);margin:10px 0 4px;">' + esc(openLine) + '</div>' +
        '<div style="font-size:11px;color:var(--text-mute);margin-bottom:4px;">' + esc(t('dt.trend', { from: Math.max(2000, track.intro - 2), to: track.peak + 8 })) + '</div>' +
        _sparkline(track, year) +
        btn + '</div>';
}

// phoneHtml: kartu desain ponsel asli (dari ProductPanel), dipakai bila kategori Ponsel aktif.
export function renderDesignTracks(params) {
    params = params || {};
    var year = Number(params.year) || 2000;
    var track = getDesignTrack(_track) || DESIGN_TRACKS[0];
    var body = track.core ? (params.phoneHtml || '') : _trackCard(track, year);
    return _bar(year) + body;
}
