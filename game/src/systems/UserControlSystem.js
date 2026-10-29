// FILE: src/systems/UserControlSystem.js  (BARU)
// ============================================================
// Kontrol Pengguna v3: Monetisasi Data, Regulasi per negara, Survei pengguna.
//
//  - Regulasi: tiap negara punya tingkat aturan privasi (0 bebas … 3 ketat) yang naik seiring tahun.
//    Dipakai bobot pengguna OS per negara (computeOsCountryUsage) -> "paparan regulasi".
//  - Monetisasi Data: pemain boleh menjual data teragregasi ke pengiklan. Pendapatan bulanan
//    dipotong di negara beraturan ketat; tiap bulan ada peluang sanksi regulator / kebocoran.
//  - Survei: tiap 3 bulan, hasil survei pengguna masuk Inbox (pesan lokal, tetap muncul saat offline).
//
// State baru (otomatis, save lama aman): data.userControl.monetize, data.userControl.surveys, data.userControl.surveySeq.
// Semua angka keseimbangan ada di MONETIZE_CONFIG / REGULATION_FACTORS.
// ============================================================
import { bus } from '../core/EventBus.js';
import { LanguageService } from '../core/LanguageService.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { computeOsAdoption } from './OsAdoptionModel.js';
import { computeOsCountryUsage } from './CountryMarketModel.js';
import {
    isUserControlActive, getUserControlPolicyId, getUserControlPolicy, playerOsHasFeature,
    getAlgoValue, computeUsageMix, USER_CONTROL_CONFIG
} from './FutureEffects.js';

// ---------- Regulasi per negara (PERKIRAAN untuk game, bukan nasihat hukum) ----------
// [tahun mulai, tingkat]; tingkat 0 bebas, 1 ringan, 2 sedang, 3 ketat. Tingkat = entri terakhir yang tahunnya <= tahun sekarang.
export const REGULATION_TIMELINE = {
    US: [[2000, 0], [2020, 1]],
    JP: [[2005, 2]],
    GB: [[2000, 2], [2018, 3]],
    DE: [[2000, 2], [2018, 3]],
    FR: [[2000, 2], [2018, 3]],
    IT: [[2000, 2], [2018, 3]],
    ES: [[2000, 2], [2018, 3]],
    KR: [[2011, 2], [2020, 3]],
    CN: [[2017, 2], [2021, 3]],
    CA: [[2004, 1], [2024, 2]],
    AU: [[2000, 1], [2018, 2]],
    RU: [[2015, 3]],
    IN: [[2023, 2]],
    BR: [[2020, 2]],
    MX: [[2011, 1]],
    ID: [[2022, 2]],
    TR: [[2016, 2]],
    TH: [[2022, 2]],
    ZA: [[2021, 2]],
    PH: [[2012, 1]],
    VN: [[2023, 2]],
    SA: [[2023, 2]],
    EG: [[2020, 1]],
    NG: [[2019, 1]],
    PK: [[2025, 1]],
    BD: [[2023, 1]],
    KE: [[2019, 2]],
    ET: [[2024, 1]],
    AE: [[2022, 2]]
};

export const REGULATION_LEVELS = [
    { level: 0, name: 'Bebas',  nameEn: 'Open',     color: '#10b981' },
    { level: 1, name: 'Ringan', nameEn: 'Light',    color: '#84cc16' },
    { level: 2, name: 'Sedang', nameEn: 'Moderate', color: '#f59e0b' },
    { level: 3, name: 'Ketat',  nameEn: 'Strict',   color: '#ef4444' }
];

// Pengali pendapatan monetisasi di negara menurut tingkat regulasi (butuh persetujuan pengguna).
export const REGULATION_FACTORS = { revenue: [1, 0.85, 0.5, 0.15], fine: [0.3, 0.6, 1.2, 2.5] };

export const MONETIZE_CONFIG = {
    minUsers: 1000,            // pengguna aktif minimum agar pengiklan tertarik
    arpuBase: 0.45,            // USD per pengguna aktif per bulan (2019), naik sedikit tiap tahun
    arpuYearGrowth: 0.05,
    arpuBaseYear: 2019,
    arpuPersonalBoost: 0.5,    // slider Personalisasi AI 100 = +50% (0 = -50%)
    balancedFactor: 0.4,       // kebijakan Seimbang: hanya data anonim -> 40% pendapatan
    // peluang sanksi/kebocoran per bulan
    riskBase: 0.03,
    riskPerExposure: 0.12,     // tambahan per 1.0 paparan regulasi
    riskOpenPolicy: 1.5,
    riskBalanced: 1.0,
    privacyOsMult: 0.5,        // Pusat Privasi memangkas peluang & denda
    fineMonths: 2,             // denda dasar = pendapatan monetisasi sekian bulan terakhir
    fineCashCap: 0.25,         // maks. 25% kas
    repHit: 4,
    sentimentHit: 6
};

export const SURVEY_EVERY_MONTHS = 3;
export const SURVEY_MIN_USERS = 500;
export const SURVEY_KEEP = 12;

function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'id'; } }
function _L(id, en) { return _lang() === 'id' ? id : en; }
function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function _fmtMoney(n) {
    n = Math.round(n || 0);
    var a = Math.abs(n);
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e3) return '$' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + n;
}

export function getRegulationLevel(countryId, year) {
    var tl = REGULATION_TIMELINE[countryId];
    if (!tl) return 0;
    var lv = 0;
    for (var i = 0; i < tl.length; i++) if (year >= tl[i][0]) lv = tl[i][1];
    return lv;
}

export function ensureUserControlState(data) {
    if (!data.userControl || typeof data.userControl !== 'object') data.userControl = {};
    var uc = data.userControl;
    if (!uc.monetize || typeof uc.monetize !== 'object') uc.monetize = {};
    var m = uc.monetize;
    m.on = m.on === true;
    ['earned', 'last', 'fines', 'incidents'].forEach(function (k) { m[k] = Number(m[k]) || 0; });
    if (!Array.isArray(uc.surveys)) uc.surveys = [];
    uc.surveySeq = Number(uc.surveySeq) || 0;
    return uc;
}

// Paparan regulasi pengguna OS: { rows:[{id,flag,name,share,active,level}], exposure 0..1, avgLevel }.
export function computeRegulationExposure(data) {
    var year = (data && data.time && data.time.currentYear) || 2019;
    var usage;
    try { usage = computeOsCountryUsage(data); } catch (e) { usage = { list: [], total: 0 }; }
    var rows = [], exposure = 0, revFactor = 0;
    (usage.list || []).forEach(function (r) {
        var c = r.country;
        var lv = getRegulationLevel(c.id, year);
        exposure += r.share * lv / 3;
        revFactor += r.share * REGULATION_FACTORS.revenue[lv];
        rows.push({ id: c.id, flag: c.flag, name: _lang() === 'id' ? c.id_name : c.en_name, share: r.share, active: r.active, level: lv });
    });
    if (!rows.length) revFactor = 1;
    return { rows: rows, exposure: exposure, revenueFactor: revFactor, total: usage.total || 0 };
}

// Ringkasan Monetisasi Data (untuk panel & perhitungan bulanan). Tidak mengubah state.
export function describeMonetization(data) {
    var cfg = MONETIZE_CONFIG;
    var uc = ensureUserControlState(data);
    var pol = getUserControlPolicyId(data);
    var users = 0;
    try { users = computeOsAdoption(data).activeUsers || 0; } catch (e) {}
    var reg = computeRegulationExposure(data);
    var year = (data.time && data.time.currentYear) || cfg.arpuBaseYear;
    var arpu = cfg.arpuBase * (1 + Math.max(0, year - cfg.arpuBaseYear) * cfg.arpuYearGrowth);
    var pv = (getAlgoValue('personal', data) - 50) / 50;
    arpu *= 1 + cfg.arpuPersonalBoost * pv;
    var polFactor = pol === 'open' ? 1 : (pol === 'balanced' ? cfg.balancedFactor : 0);
    var revenue = users >= cfg.minUsers ? users * arpu * reg.revenueFactor * polFactor : 0;
    var hasPriv = playerOsHasFeature(USER_CONTROL_CONFIG.requiredOsFeature, data);
    var risk = cfg.riskBase + cfg.riskPerExposure * reg.exposure;
    risk *= pol === 'open' ? cfg.riskOpenPolicy : cfg.riskBalanced;
    if (hasPriv) risk *= cfg.privacyOsMult;
    var blocked = null;
    if (pol === 'strict') blocked = 'strict';
    else if (users < cfg.minUsers) blocked = 'users';
    return {
        on: uc.monetize.on, blocked: blocked, users: users, arpu: arpu, polFactor: polFactor,
        revenue: revenue, risk: _clamp(risk, 0, 0.6), hasPrivacyOs: hasPriv, reg: reg,
        earned: uc.monetize.earned, last: uc.monetize.last, fines: uc.monetize.fines, incidents: uc.monetize.incidents
    };
}

export function setDataMonetization(on, data) {
    if (!data || !isUserControlActive(data)) return false;
    var uc = ensureUserControlState(data);
    var d = describeMonetization(data);
    if (on && d.blocked) return false;
    uc.monetize.on = !!on;
    return true;
}

// ---------- Survei ----------
function _noise(seed, amp) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return (x - Math.floor(x) - 0.5) * 2 * amp;
}

// Menyusun satu survei. topicIdx memilih topik (berputar). Mengembalikan { title, body } atau null.
export function buildSurvey(data, topicIdx) {
    var users = 0;
    try { users = computeOsAdoption(data).activeUsers || 0; } catch (e) {}
    if (users < SURVEY_MIN_USERS) return null;
    var year = (data.time && data.time.currentYear) || 2019;
    var month = (data.time && data.time.currentMonth) || 1;
    var seed = year * 12 + month;
    var pol = getUserControlPolicyId(data);
    var notify = getAlgoValue('notify', data), personal = getAlgoValue('personal', data), rec = getAlgoValue('recommend', data);
    var topics = ['notify', 'personal', 'recommend', 'wellbeing', 'region'];
    var topic = topics[topicIdx % topics.length];
    var n = Math.max(120, Math.min(5000, Math.round(users / 50)));   // jumlah responden (perkiraan)
    var head = _L('Survei ' + n + ' pengguna OS-mu. ', 'We surveyed ' + n + ' users of your OS. ');
    var title, body;

    if (topic === 'notify') {
        var muted = Math.round(_clamp(12 + 0.38 * notify + _noise(seed, 3), 5, 70));
        title = _L('Survei: Notifikasi', 'Survey: Notifications');
        body = head + _L(muted + '% pengguna mematikan atau membisukan notifikasi. ', muted + '% of users mute or disable notifications. ') +
            (muted >= 40 ? _L('Terlalu banyak. Turunkan slider Notifikasi di Kontrol Pengguna.', 'That is a lot. Lower the Notifications slider in User Control.')
                : _L('Masih dalam batas wajar.', 'Still within a reasonable range.'));
    } else if (topic === 'personal') {
        var polAdj = pol === 'strict' ? 14 : (pol === 'open' ? -10 : 0);
        var okPct = Math.round(_clamp(72 - 0.4 * personal + polAdj + _noise(seed + 1, 3), 10, 92));
        title = _L('Survei: Data & Personalisasi', 'Survey: Data & personalisation');
        body = head + _L(okPct + '% pengguna nyaman dengan penggunaan data untuk personalisasi. ', okPct + '% of users are comfortable with data use for personalisation. ') +
            (okPct < 45 ? _L('Kepercayaan rendah. Pertimbangkan kebijakan Seimbang/Privasi Ketat atau kurangi Personalisasi AI.', 'Trust is low. Consider the Balanced/Strict policy or lower AI personalisation.')
                : _L('Kepercayaan cukup baik.', 'Trust is fairly good.'));
    } else if (topic === 'recommend') {
        var helpful = Math.round(_clamp(40 + 0.3 * rec + _noise(seed + 2, 3), 10, 90));
        var pushy = Math.round(_clamp(8 + 0.3 * rec + _noise(seed + 3, 3), 3, 60));
        title = _L('Survei: Rekomendasi Aplikasi', 'Survey: App recommendations');
        body = head + _L(helpful + '% merasa rekomendasi membantu, ' + pushy + '% merasa aplikasi "dipaksakan". ', helpful + '% find recommendations helpful, ' + pushy + '% feel apps are being pushed on them. ') +
            _L('Slider yang tinggi menaikkan belanja App Store tetapi juga rasa terganggu.', 'A high slider raises App Store spending but also annoyance.');
    } else if (topic === 'wellbeing') {
        var mix = computeUsageMix(data, users);
        var heavy = 0;
        mix.cats.forEach(function (c) { if (c.id === 'games' || c.id === 'social' || c.id === 'video') heavy += c.share; });
        var hours = Math.round((2 + heavy * 7 + notify / 100 * 1.2 + _noise(seed + 4, 0.3)) * 10) / 10;
        var wantLimit = Math.round(_clamp(10 + hours * 6, 10, 80));
        var hasWell = playerOsHasFeature(USER_CONTROL_CONFIG.wellbeingFeature, data);
        title = _L('Survei: Waktu Layar', 'Survey: Screen time');
        body = head + _L('Rata-rata ' + hours + ' jam per hari; ' + wantLimit + '% ingin batas waktu pemakaian. ', 'Average ' + hours + ' h per day; ' + wantLimit + '% want usage limits. ') +
            (hasWell ? _L('Fitur Kesejahteraan Digital OS-mu sudah menjawab sebagian keluhan ini.', 'Your OS Digital Wellbeing feature already answers part of this.')
                : _L('OS-mu belum punya Kesejahteraan Digital. Fitur itu membantu segmen anak muda dan senior.', 'Your OS has no Digital Wellbeing yet. It helps the youth and senior segments.'));
    } else {
        var reg = computeRegulationExposure(data);
        var strict = reg.rows.filter(function (r) { return r.level >= 2; }).sort(function (a, b) { return b.share - a.share; })[0];
        var m = ensureUserControlState(data).monetize;
        title = _L('Survei: Kesadaran Regulasi', 'Survey: Regulation awareness');
        if (strict) {
            var aware = Math.round(_clamp(30 + strict.level * 12 + _noise(seed + 5, 4), 10, 90));
            body = head + _L('Di ' + strict.name + ' (' + Math.round(strict.share * 100) + '% penggunamu), ' + aware + '% tahu hak data mereka. ', 'In ' + strict.name + ' (' + Math.round(strict.share * 100) + '% of your users), ' + aware + '% know their data rights. ') +
                (m.on ? _L('Monetisasi Data aktif: waspadai sanksi regulator di sana.', 'Data Monetisation is on: watch out for regulator action there.')
                    : _L('Kamu aman dari risiko sanksi karena tidak menjual data.', 'You are safe from penalties because you do not sell data.'));
        } else {
            body = head + _L('Sebagian besar penggunamu ada di negara dengan aturan privasi longgar, jadi risiko regulasi rendah untuk saat ini.', 'Most of your users live in countries with light privacy rules, so regulatory risk is low for now.');
        }
    }
    return { title: title, body: body, topic: topic };
}

export class UserControlSystem {
    constructor(state) {
        this.state = state;
        this._unsubs = [bus.on('time:month-changed', (snap) => this._onMonth(snap))];
    }

    destroy() { this._unsubs.forEach(function (u) { try { u(); } catch (e) {} }); this._unsubs = []; }

    _onMonth() {
        var data = this.state.data;
        if (!data || !isUserControlActive(data)) return;
        ensureUserControlState(data);
        try { this._monetizeMonth(data); } catch (e) { /* jangan ganggu loop game */ }
        try { this._surveyMonth(data); } catch (e) {}
    }

    _monetizeMonth(data) {
        var m = data.userControl.monetize;
        m.last = 0;
        if (!m.on) return;
        var d = describeMonetization(data);
        if (d.blocked) {
            m.on = false;
            ToastService.warning(_L('Monetisasi Data dihentikan: ' + (d.blocked === 'strict' ? 'kebijakan Privasi Ketat.' : 'pengguna terlalu sedikit.'), 'Data Monetisation stopped: ' + (d.blocked === 'strict' ? 'Strict Privacy policy.' : 'too few users.')));
            return;
        }
        var rev = Math.round(d.revenue);
        if (rev > 0) {
            this.state.addCash(rev);
            m.last = rev;
            m.earned += rev;
        }
        // Sanksi regulator / kebocoran
        if (Math.random() < d.risk) {
            var cfg = MONETIZE_CONFIG;
            var lvAvg = 0;
            d.reg.rows.forEach(function (r) { lvAvg += r.share * REGULATION_FACTORS.fine[r.level]; });
            if (!d.reg.rows.length) lvAvg = REGULATION_FACTORS.fine[0];
            var base = Math.max(rev, m.earned / 6) * cfg.fineMonths;
            var fine = Math.round(Math.min(base * lvAvg * (d.hasPrivacyOs ? cfg.privacyOsMult : 1), Math.max(0, data.cash) * cfg.fineCashCap));
            if (fine > 0) { this.state.addCash(-fine); m.fines += fine; }
            m.incidents += 1;
            try { this.state.addReputation(-cfg.repHit); this.state.addSentiment(-cfg.sentimentHit); } catch (e) {}
            var top = d.reg.rows.slice().sort(function (a, b) { return b.level * b.share - a.level * a.share; })[0];
            var where = top ? top.name : _L('beberapa negara', 'several countries');
            var msg = _L('Regulator di ' + where + ' menindak penjualan data penggunamu. Denda ' + _fmtMoney(fine) + ', reputasi turun.',
                'Regulators in ' + where + ' acted against your data sales. Fine ' + _fmtMoney(fine) + ', reputation down.');
            this.state.addLog(msg, LOG_TYPES.warning || LOG_TYPES.info);
            ToastService.warning(msg);
        }
    }

    _surveyMonth(data) {
        var t = data.time || {};
        var uc = data.userControl;
        var abs = (t.currentYear || 0) * 12 + (t.currentMonth || 1);
        if (abs % SURVEY_EVERY_MONTHS !== 0) return;
        var s = buildSurvey(data, uc.surveySeq);
        if (!s) return;
        uc.surveySeq += 1;
        // InboxService diimpor dinamis supaya sistem ini tetap bisa dites tanpa DOM/cloud.
        import('../services/InboxService.js').then(function (mod) {
            if (mod && mod.InboxService && mod.InboxService.addLocal) {
                mod.InboxService.addLocal({ kind: 'survey', title: s.title, body: s.body });
            }
        }).catch(function () {});
    }
}
