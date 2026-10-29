// FILE: src/data/i18n/research-localize.js  (BARU)
// Helper lokalisasi untuk nama & deskripsi data Riset, Fabrikasi, dan Future.
// Bahasa Indonesia selalu memakai data asli. English memakai RESEARCH_DATA_EN
// bila entri tersedia; jika tidak, jatuh ke data asli (tidak pernah kosong).
import { LanguageService } from '../../core/LanguageService.js';
import { RESEARCH_DATA_EN } from './research-data.en.js';

function _isEn() {
    try { return LanguageService.getLang() === 'en'; } catch (e) { return false; }
}

function _pick(bucket, id, field, fallback) {
    if (!_isEn() || !id) return fallback;
    var entry = RESEARCH_DATA_EN[bucket] && RESEARCH_DATA_EN[bucket][id];
    // field null = entri berupa string langsung (mis. kategori).
    var v = field == null ? entry : (entry && entry[field]);
    return (typeof v === 'string' && v) ? v : fallback;
}

// Node riset (tech tree)
export function nodeName(node) {
    return node ? _pick('nodes', node.id, 'name', node.name) : '';
}
export function nodeDesc(node) {
    return node ? _pick('nodes', node.id, 'description', node.description) : '';
}
export function nodeNameById(id, fallback) {
    return _pick('nodes', id, 'name', fallback);
}

// Kategori riset
export function catName(cat) {
    return cat ? _pick('categories', cat.id, null, cat.name) : '';
}

// Jalur R&D Lanjutan. key = id kategori (display, camera, ...).
export function rndTitle(key, fallback) {
    var e = _isEn() && RESEARCH_DATA_EN.rnd[key];
    return e ? e.title : fallback;
}
export function rndHint(key, fallback) {
    var e = _isEn() && RESEARCH_DATA_EN.rnd[key];
    return e ? e.hint : fallback;
}

// Pabrik komponen
export function plantName(pt) {
    return pt ? _pick('plants', pt.id, 'name', pt.name) : '';
}
export function plantDesc(pt) {
    return pt ? _pick('plants', pt.id, 'description', pt.description) : '';
}
export function plantLevelName(pt, level, fallback) {
    var e = _isEn() && pt && RESEARCH_DATA_EN.plants[pt.id] && RESEARCH_DATA_EN.plants[pt.id].levels;
    return (e && e[level]) || fallback;
}

// Panel Future
export function futureName(p) {
    return p ? _pick('future', p.id, 'name', p.name) : '';
}
export function futureDesc(p) {
    return p ? _pick('future', p.id, 'description', p.description) : '';
}
export function futureSystemLabel(key, fallback) {
    var v = _isEn() && RESEARCH_DATA_EN.futureSystems[key];
    return v || fallback;
}
