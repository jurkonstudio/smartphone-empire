// FILE: src/main.js
import { APP_CONFIG } from './config/app.config.js';
import { VIEW_TITLES } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { TimeSystem } from './core/TimeSystem.js';
import { SaveService } from './core/SaveService.js';
import { ToastService } from './core/ToastService.js';
import { ThemeService } from './core/ThemeService.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { ResearchSystem } from './systems/ResearchSystem.js';
import { OSSystem } from './systems/OSSystem.js';
import { ProductSystem } from './systems/ProductSystem.js';
import { MarketSystem } from './systems/MarketSystem.js';
import { CompetitorSystem } from './systems/CompetitorSystem.js';
import { PublicOpinionSystem } from './systems/PublicOpinionSystem.js';
import { EraSystem } from './systems/EraSystem.js';
import { TeamSystem } from './systems/TeamSystem.js';
import { renderHeader } from './ui/layout/Header.js';
import { renderMobileNav } from './ui/layout/MobileNav.js';
import { renderDashboard } from './ui/panels/DashboardPanel.js';
import { renderEmptyState } from './ui/panels/EmptyState.js';
import { renderSettingsPanel, bindSettingsActions } from './ui/panels/SettingsPanel.js';
import { renderGuidePanel } from './ui/panels/GuidePanel.js';
import { renderCompanyProfilePanel } from './ui/panels/CompanyProfilePanel.js';
import { mountToastContainer } from './ui/panels/ToastContainer.js';
import { drawCashChart } from './ui/panels/CashChart.js';
import { initTutorialOverlay } from './ui/panels/TutorialOverlay.js';
import { showOnboarding } from './ui/panels/OnboardingModal.js';
import { initMonthlySummary } from './ui/panels/MonthlySummaryModal.js';
import { initGameOverScreen } from './ui/panels/GameOverScreen.js';
import { Modal } from './ui/modal.js';
import {
    renderResearchPanel, setFilterCategory,
    openNodeDetailModal, openOsWizardModal, openCreateOsModal, openFeatureDetailModal
} from './ui/panels/ResearchPanel.js';
import {
    renderProductPanel, openProductDetailModal, openCampaignModal, openOrderProductionModal
} from './ui/panels/ProductPanel.js';
import { openDesignWizard } from './ui/panels/DesignWizard.js';
import { renderMarketPanel, drawShareChart } from './ui/panels/MarketPanel.js';
import { openCompetitorDetailModal } from './ui/panels/CompetitorDetailModal.js';
import { openViralResponseModal } from './ui/panels/PublicOpinionPanel.js';
import { drawSalesChart } from './ui/panels/SalesChart.js';
import { renderTeamPanel } from './ui/panels/TeamPanel.js';
import { openStaffDetailModal } from './ui/panels/StaffDetailModal.js';
import * as marketingModule from './data/marketing.data.js';
import * as feedbackModule from './data/feedback.data.js';
import { getActiveRendererIdPublic } from './ui/notifications/NotificationRenderer.js';

// ============ INSTANCE ============
const timeSystem  = new TimeSystem(state);
const economy     = new EconomySystem(state);
const quests      = new QuestSystem(state);
const tutorial    = new TutorialSystem(state);
const research    = new ResearchSystem(state);
const os          = new OSSystem(state);
const products    = new ProductSystem(state);
const market      = new MarketSystem(state);
const competitors = new CompetitorSystem(state);
const opinion     = new PublicOpinionSystem(state);
const eraSystem   = new EraSystem(state);
const teamSystem  = new TeamSystem(state);

market.setCompetitorSystem(competitors);

// ============ STATE UI ============
let activeView = 'dashboard';
let activeSubtab = 'tech';
let activeProdSubtab = 'design';
let activeMarketSubtab = 'share';
let activeTeamSubtab = 'active';
let _burnWarn = null;

const els = {
    header:  document.getElementById('app-header'),
    view:    document.getElementById('app-view'),
    nav:     document.getElementById('mobile-nav'),
    loading: document.getElementById('loading-screen'),
    error:   document.getElementById('error-message'),
    toast:   document.getElementById('toast-container')
};

function getTime() { return timeSystem.snapshot(); }
function hideLoading() { if (els.loading) els.loading.style.display = 'none'; }

function renderHeaderOnly() {
    if (!els.header) return;
    els.header.innerHTML = renderHeader({ state: state.get(), timeSnapshot: getTime(), warning: _burnWarn });
}

function renderNavOnly() {
    if (!els.nav) return;
    els.nav.innerHTML = renderMobileNav({ active: activeView });
}

// ============ RENDER VIEW (defensive + keepScroll) ============
// opts.keepScroll = true  → pertahankan posisi scroll (untuk re-render dari event)
// opts.keepScroll = false → reset scroll ke atas (untuk pindah tab / sub-tab)
function renderView(opts) {
    if (!els.view) return;

    const keepScroll = !!(opts && opts.keepScroll);
    const prevScroll = els.view.scrollTop;

    let html = '';
    try {
        switch (activeView) {
            case 'dashboard': html = renderDashboard(state.get(), getTime(), research, teamSystem); break;
            case 'profile':   html = renderCompanyProfilePanel({ teamSystem, marketSystem: market, competitors, opinionSystem: opinion }); break;
            case 'team':      html = renderTeamPanel({ subtab: activeTeamSubtab, teamSystem }); break;
            case 'research':  html = renderResearchPanel({ subtab: activeSubtab, researchSystem: research, osSystem: os }); break;
            case 'products':  html = renderProductPanel({ subtab: activeProdSubtab, productSystem: products, researchSystem: research, osSystem: os }); break;
            case 'market':    html = renderMarketPanel({ subtab: activeMarketSubtab, marketSystem: market, competitorSystem: competitors, opinionSystem: opinion }); break;
            case 'settings':  html = renderSettingsPanel(); break;
            case 'guide':     html = renderGuidePanel(); break;
            default:          html = renderEmptyState({ icon: '❓', title: 'Tidak ditemukan' });
        }
    } catch (err) {
        console.error('[renderView] Error di view "' + activeView + '":', err);
        html = '<div class="card" style="border-color:var(--danger);margin-top:20px;">' +
               '<div class="card-title" style="color:var(--danger);">⚠ Error Render</div>' +
               '<div style="font-size:13px;line-height:1.6;word-break:break-word;">' +
               '<b>View:</b> ' + activeView + '<br>' +
               '<b>Error:</b> ' + (err && err.message ? err.message : 'Unknown') + '<br>' +
               '<b>Stack:</b> <span style="font-family:monospace;font-size:11px;">' +
               (err && err.stack ? err.stack.split('\n').slice(0, 3).join('<br>') : '-') +
               '</span></div></div>';
    }
    els.view.innerHTML = html;

    // Restore scroll kalau keepScroll = true
    if (keepScroll) {
        els.view.scrollTop = prevScroll;
        requestAnimationFrame(() => { if (els.view) els.view.scrollTop = prevScroll; });
    } else {
        els.view.scrollTop = 0;
    }

    try {
        if (activeView === 'dashboard') {
            const chart = els.view.querySelector('.chart-wrap');
            if (chart) drawCashChart(chart);
        }
        if (activeView === 'products' && activeProdSubtab === 'sales') {
            const sc = els.view.querySelector('.chart-wrap');
            if (sc) drawSalesChart(sc);
        }
        if (activeView === 'market' && activeMarketSubtab === 'share') {
            const sc = els.view.querySelector('.chart-wrap');
            if (sc) drawShareChart(sc);
        }
        if (activeView === 'settings') bindSettingsActions(els.view);
    } catch (err) {
        console.error('[renderView] Post-render error:', err);
    }
}

function renderAll() { renderHeaderOnly(); renderNavOnly(); renderView(); }

// ============ ANIMASI UANG ============
let _cashRaf = null;
function animateCash(from, to) {
    if (_cashRaf) { cancelAnimationFrame(_cashRaf); _cashRaf = null; }
    const targets = document.querySelectorAll('[data-cash]');
    if (!targets.length || from === to) return;
    const start = performance.now();
    const step = function (ts) {
        const p = Math.min(1, (ts - start) / 520);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = from + (to - from) * eased;
        const text = '$' + Math.round(val).toLocaleString('en-US');
        targets.forEach(el => { el.textContent = text; });
        if (p < 1) _cashRaf = requestAnimationFrame(step);
        else _cashRaf = null;
    };
    _cashRaf = requestAnimationFrame(step);
}

// ============ NAVIGASI ============
function navigate(id) {
    if (id === activeView) return;
    activeView = id;
    renderAll();
    updateTitle();
    bus.emit('view:changed', { id });
    bus.emit('tutorial:action', { id: 'nav:' + id });
}

function updateTitle() {
    const meta = VIEW_TITLES[activeView];
    document.title = APP_CONFIG.name + ' — ' + (meta ? meta.title : 'Dashboard');
}

function vibrate(ms) {
    const s = state.get();
    if (!s.settings.vibrate) return;
    if (navigator && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(ms); } catch (e) {}
    }
}

// ============ EVENT DELEGATION ============
function bindGlobalClicks() {
    document.body.addEventListener('click', function (e) {
        const autoToggle = e.target.closest('[data-auto-toggle]');
        if (autoToggle) {
            e.preventDefault(); vibrate(8);
            const pid = autoToggle.dataset.prodId;
            const p = state.get().products.catalog.find(x => x.id === pid);
            if (p) {
                const newState = !(p.autoRestock && p.autoRestock.enabled);
                products.toggleAutoRestock(pid, newState);
                renderAll();
            }
            return;
        }

        const autoThresh = e.target.closest('[data-auto-threshold]');
        if (autoThresh) {
            e.preventDefault(); vibrate(6);
            const pid = autoThresh.dataset.prodId;
            const val = parseInt(autoThresh.dataset.autoThreshold, 10) || 20;
            products.setAutoRestockThreshold(pid, val);
            renderAll();
            return;
        }

        const navBtn = e.target.closest('[data-nav]');
        if (navBtn) { e.preventDefault(); vibrate(8); navigate(navBtn.dataset.nav); return; }

        const timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault(); vibrate(12);
            const a = timeBtn.dataset.timeAction;
            if (a === 'toggle-pause') { timeSystem.togglePause(); bus.emit('tutorial:action', { id: 'action:toggle-pause' }); }
            else if (a === 'cycle-speed') { timeSystem.cycleSpeed(); bus.emit('tutorial:action', { id: 'action:cycle-speed' }); }
            return;
        }

        const teamSub = e.target.closest('[data-team-subtab]');
        if (teamSub) { e.preventDefault(); activeTeamSubtab = teamSub.dataset.teamSubtab; renderView(); return; }

        const teamAction = e.target.closest('[data-team-action]');
        if (teamAction) {
            e.preventDefault(); vibrate(8);
            const act = teamAction.dataset.teamAction;
            if (act === 'hire') {
                const res = teamSystem.hireCandidate(teamAction.dataset.candidateId);
                if (!res.ok) ToastService.error(res.reason);
                else { renderAll(); }
                return;
            }
            if (act === 'refresh-pool') {
                teamSystem.refreshCandidates();
                ToastService.success('Pool kandidat diperbarui.');
                renderAll();
                return;
            }
            if (act === 'goto-recruit') {
                activeTeamSubtab = 'recruit';
                renderView();
                return;
            }
        }

        const staffCard = e.target.closest('[data-staff-detail]');
        if (staffCard && !e.target.closest('[data-staff-action]')) {
            e.preventDefault();
            openStaffDetailModal({ staffId: staffCard.dataset.staffDetail });
            return;
        }

        const staffAction = e.target.closest('[data-staff-action]');
        if (staffAction) {
            e.preventDefault();
            const act = staffAction.dataset.staffAction;
            const sid = staffAction.dataset.staffId;
            if (act === 'fire') {
                const res = teamSystem.fireStaff(sid);
                if (!res.ok) ToastService.error(res.reason);
                else { Modal.close('staff-detail', true); renderAll(); }
                return;
            }
            if (act === 'train') {
                const res = teamSystem.trainStaff(sid);
                if (!res.ok) ToastService.error(res.reason);
                else {
                    Modal.close('staff-detail', true);
                    openStaffDetailModal({ staffId: sid });
                    renderAll();
                }
                return;
            }
        }

        const subBtn = e.target.closest('[data-subtab]');
        if (subBtn) { e.preventDefault(); activeSubtab = subBtn.dataset.subtab; renderView(); return; }

        const chip = e.target.closest('[data-filter-cat]');
        if (chip) { e.preventDefault(); setFilterCategory(chip.dataset.filterCat); renderView(); return; }

        const nodeCard = e.target.closest('[data-node-detail]');
        if (nodeCard) { e.preventDefault(); openNodeDetailModal({ nodeId: nodeCard.dataset.nodeDetail, researchSystem: research }); return; }

        const rAction = e.target.closest('[data-research-action]');
        if (rAction) {
            e.preventDefault();
            const act = rAction.dataset.researchAction;
            const nodeId = rAction.dataset.nodeId;
            if (act === 'start') {
                const res = research.startResearch(nodeId);
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.success('Riset dimulai!'); Modal.close('node-detail', true); renderAll(); }
            } else if (act === 'cancel') {
                const res = research.cancelResearch(nodeId);
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.info('Dibatalkan.'); Modal.close('node-detail', true); renderAll(); }
            }
            return;
        }

        const osAction = e.target.closest('[data-os-action]');
        if (osAction) {
            e.preventDefault();
            const act = osAction.dataset.osAction;
            if (act === 'create') { openCreateOsModal({ osSystem: os }); return; }
            if (act === 'wizard') { openOsWizardModal({ osSystem: os }); return; }
            if (act === 'cancel-deving') {
                const res = os.cancelVersion();
                if (res.ok) { ToastService.info('Dibatalkan.'); renderAll(); }
                else ToastService.error(res.reason);
                return;
            }
            if (act === 'patch-bug')  { const r = os.patchBug(osAction.dataset.bugId);  r.ok ? (ToastService.success('Patch dimulai.'), renderAll()) : ToastService.error(r.reason); return; }
            if (act === 'ignore-bug') { const r = os.ignoreBug(osAction.dataset.bugId); r.ok ? (ToastService.warning('Diabaikan.'), renderAll()) : ToastService.error(r.reason); return; }
            if (act === 'start-app')  { const r = os.startApp(osAction.dataset.appId);  r.ok ? (ToastService.success('App dirilis.'), renderAll()) : ToastService.error(r.reason); return; }
            if (act === 'invite-devs'){ const r = os.inviteDevelopers(); r.ok ? (ToastService.success('+' + r.bonus + ' dev.'), renderAll()) : ToastService.error(r.reason); return; }
            if (act === 'feature-detail') { openFeatureDetailModal({ osSystem: os, featureId: osAction.dataset.featureId }); return; }
        }

        const prodSub = e.target.closest('[data-prod-subtab]');
        if (prodSub) { e.preventDefault(); activeProdSubtab = prodSub.dataset.prodSubtab; renderView(); return; }

        const prodAction = e.target.closest('[data-prod-action]');
        if (prodAction) {
            e.preventDefault();
            const act = prodAction.dataset.prodAction;
            const pid = prodAction.dataset.prodId;
            if (act === 'open-wizard') { openDesignWizard({ researchSystem: research, osSystem: os, productSystem: products }); return; }
            if (act === 'cancel-dev') {
                const r = products.cancelDevelopment();
                r.ok ? (ToastService.info('Dibatalkan.'), renderAll()) : ToastService.error(r.reason);
                return;
            }
            if (act === 'order-prod')  { openOrderProductionModal({ productId: pid }); return; }
            if (act === 'campaign')    { openCampaignModal({ productId: pid }); return; }
            if (act === 'discontinue') {
                const r = products.discontinueProduct(pid);
                r.ok ? (ToastService.info('Produk dihentikan.'), Modal.close('product-detail', true), renderAll()) : ToastService.error(r.reason);
                return;
            }
        }

        const prodCard = e.target.closest('[data-prod-detail]');
        if (prodCard && !e.target.closest('[data-prod-action]') && !e.target.closest('[data-auto-toggle]') && !e.target.closest('[data-auto-threshold]')) {
            e.preventDefault();
            openProductDetailModal({ productId: prodCard.dataset.prodDetail, productSystem: products });
            return;
        }

        const campPick = e.target.closest('[data-campaign-pick]');
        if (campPick) {
            e.preventDefault();
            const res = products.startCampaign(campPick.dataset.prodId, campPick.dataset.campaignPick);
            if (!res.ok) ToastService.error(res.reason);
            else { ToastService.success('Kampanye dimulai!'); Modal.close('campaign-pick', true); renderAll(); }
            return;
        }

        const orderConfirm = e.target.closest('[data-order-confirm]');
        if (orderConfirm) {
            e.preventDefault();
            const root = document.querySelector('[data-modal-id="order-prod"]');
            const qty = parseInt(root.querySelector('[data-order-qty]').value, 10) || 0;
            const res = products.orderProduction(orderConfirm.dataset.prodId, qty);
            if (!res.ok) ToastService.error(res.reason);
            else { ToastService.success('Order produksi dibuat.'); Modal.close('order-prod', true); renderAll(); }
            return;
        }

        const mktSub = e.target.closest('[data-market-subtab]');
        if (mktSub) { e.preventDefault(); activeMarketSubtab = mktSub.dataset.marketSubtab; renderView(); return; }

        const compCard = e.target.closest('[data-competitor-detail]');
        if (compCard) {
            e.preventDefault();
            const mode = state.get().settings.competitorMode || 'real';
            const data = competitors.getCompetitorData(compCard.dataset.competitorDetail, mode);
            openCompetitorDetailModal({ competitorData: data });
            return;
        }

        const viralRespond = e.target.closest('[data-viral-respond]');
        if (viralRespond) {
            e.preventDefault();
            openViralResponseModal({ viralId: viralRespond.dataset.viralId });
            return;
        }
        const viralPick = e.target.closest('[data-viral-response-pick]');
        if (viralPick) {
            e.preventDefault();
            const res = opinion.respondToViral(viralPick.dataset.viralId, viralPick.dataset.viralResponsePick);
            if (!res.ok) ToastService.error(res.reason);
            else { ToastService.success('Respons dikirim.'); Modal.close('viral-response', true); renderAll(); }
            return;
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); timeSystem.togglePause(); }
        if (e.key === 'f' || e.key === 'F') timeSystem.cycleSpeed();
    });
}

// ============ PROGRESS EVENTS ============
function bindProgressEvents() {
    bus.on('research:progress', (data) => {
        if (activeView !== 'research' || activeSubtab !== 'tech') return;
        const slotsEl = els.view.querySelector('[data-research-slots]');
        if (slotsEl) slotsEl.textContent = data.active.length + '/' + data.maxSlots;
        data.active.forEach(r => {
            const pct = Math.round(r.percent * 100);
            const bar = els.view.querySelector('[data-research-bar="' + r.nodeId + '"]');
            if (bar) bar.style.width = pct + '%';
            const pctEl = els.view.querySelector('[data-research-pct="' + r.nodeId + '"]');
            if (pctEl) pctEl.textContent = pct + '%';
            const etaEl = els.view.querySelector('[data-research-eta="' + r.nodeId + '"]');
            if (etaEl) etaEl.textContent = 'Sisa ~' + Math.ceil(r.remainingDays) + ' hari';
        });
    });
    bus.on('os:progress', (data) => {
        if (activeView !== 'research' || activeSubtab !== 'os') return;
        const pct = Math.round(data.percent * 100);
        const bar = els.view.querySelector('[data-os-dev-bar]');
        if (bar) bar.style.width = pct + '%';
        const pctEl = els.view.querySelector('[data-os-dev-pct]');
        if (pctEl) pctEl.textContent = pct + '%';
        const eta = els.view.querySelector('[data-os-dev-eta]');
        if (eta) eta.textContent = 'Sisa ~' + Math.ceil(data.remainingDays) + ' hari';
    });
    bus.on('product:development-progress', (data) => {
        if (activeView !== 'products' || activeProdSubtab !== 'design') return;
        const phaseMap = { design: 'Desain', prototype: 'Prototipe', production: 'Produksi', released: 'Rilis' };
        const phaseEl = els.view.querySelector('[data-prod-dev-phase]');
        const pctEl = els.view.querySelector('[data-prod-dev-pct]');
        const barEl = els.view.querySelector('[data-prod-dev-bar]');
        const etaEl = els.view.querySelector('[data-prod-dev-eta]');
        if (phaseEl) phaseEl.textContent = phaseMap[data.phase] || data.phase;
        if (pctEl) pctEl.textContent = data.percentOverall + '%';
        if (barEl) barEl.style.width = data.percentOverall + '%';
        if (etaEl) etaEl.textContent = 'Sisa ~' + data.remainingDays + ' hari di tahap ini';
    });
    // === KEEP SCROLL: re-render karena hari berubah → jangan reset scroll ===
    bus.on('time:day-changed', () => {
        if (activeView === 'research' || activeView === 'products' || activeView === 'market' || activeView === 'team') {
            renderView({ keepScroll: true });
        }
    });
}

// ============ TIME ============
function bindTimeEvents() {
    bus.on('time:tick', function () {
        const meta = els.header && els.header.querySelector('.header-meta');
        if (!meta) return;
        const t = getTime();
        const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
        const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
        const d = meta.querySelector('[data-time-date]');
        const c = meta.querySelector('[data-time-clock]');
        const s = meta.querySelector('[data-time-status]');
        if (d) d.textContent = 'Hari ' + t.currentDay + '/' + t.currentMonth + '/' + t.currentYear;
        if (c) c.textContent = hh + ':' + mm;
        if (s) { s.textContent = t.isPaused ? 'Paused' : (t.gameSpeed + 'x'); s.classList.toggle('running', !t.isPaused); }
    });
    // === KEEP SCROLL: hari berubah di dashboard → jangan reset scroll ===
    bus.on('time:day-changed', function () { if (activeView === 'dashboard') renderView({ keepScroll: true }); });
    bus.on('time:speed-changed', function () { renderHeaderOnly(); });
}

// ============ STATE EVENTS ============
function bindStateEvents() {
    bus.on('state:cash-changed', function (data) { animateCash(data.prev, data.next); });
    // === KEEP SCROLL: log & milestone update → jangan reset scroll ===
    bus.on('state:log-changed', function () { if (activeView === 'dashboard') renderView({ keepScroll: true }); });
    bus.on('state:milestone-added', function () { if (activeView === 'dashboard') renderView({ keepScroll: true }); });
    bus.on('quest:completed', function (data) { ToastService.success('Quest selesai: ' + data.title); vibrate(20); });
    bus.on('quest:activated', function () { if (activeView === 'dashboard') renderView({ keepScroll: true }); });
    bus.on('economy:warn-burnrate', function (data) {
        _burnWarn = 'Sisa ' + data.monthsLeft + ' bln';
        renderHeaderOnly();
        ToastService.warning('Peringatan: sisa uang ~' + data.monthsLeft + ' bulan biaya!');
        vibrate(30);
    });
    bus.on('settings:take-loan', function (data) {
        const res = economy.takeLoan(data.loanId);
        if (!res.ok) ToastService.error(res.error);
        else { ToastService.success('Pinjaman diterima.'); renderView(); }
    });
    bus.on('settings:changed', function () {});
    bus.on('tutorial:restart', function () { tutorial.restart(); });
    bus.on('era:changed', function () { renderAll(); });
    // === KEEP SCROLL: tim berubah → jangan reset scroll ===
    bus.on('team:changed', function () {
        if (activeView === 'dashboard' || activeView === 'team') renderView({ keepScroll: true });
    });
    bus.on('team:recruited', function () { if (activeView === 'team') renderView({ keepScroll: true }); });
    bus.on('team:fired', function () { if (activeView === 'team') renderView({ keepScroll: true }); });
}

// ============ BOOT ============
async function boot() {
    try {
        if (!els.header || !els.view || !els.nav) throw new Error('Elemen HTML utama tidak ditemukan.');

        ThemeService.init();
        mountToastContainer(els.toast);
        initTutorialOverlay();
        initMonthlySummary();
        initGameOverScreen();
        hideLoading();

        if (SaveService.hasSave()) {
            const saved = SaveService.load();
            if (saved) { state.hydrate(saved); console.info('[boot] Save dimuat.'); }
        } else {
            const onb = await showOnboarding();
            state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
            const mod = await import('./data/balance.data.js');
            const starting = mod.BALANCE.startingCash[onb.difficulty] || mod.BALANCE.startingCash.normal;
            state.setCash(starting);
            state.addMilestone('founded', 'Perusahaan ' + onb.companyName + ' didirikan.');
            state.addLog('Perusahaan ' + onb.companyName + ' didirikan dengan modal $' + starting.toLocaleString('en-US') + '.', 'success');
            SaveService.save(state);
        }

        if (!state.get().settings.competitorMode) state.get().settings.competitorMode = 'real';

        eraSystem.start();
        economy.start();
        quests.start();
        tutorial.start();
        teamSystem.start();

        if (!state.get().candidates || state.get().candidates.length === 0) {
            teamSystem.refreshCandidates();
        }

        research.start();
        os.start();
        products.start();
        competitors.start();
        market.start();
        opinion.start();

        window.__game = {
            state, bus, timeSystem, economy, quests, tutorial,
            research, os, products, market, competitors, opinion, eraSystem, teamSystem,
            ThemeService,
            SaveService, ToastService, Modal, navigate, render: renderAll,
            modules: {
                marketing: marketingModule,
                feedbackData: feedbackModule
            },
            cheat: {
                addCash: function (n) { state.addCash(n); },
                fastForwardDays: function (n) { return timeSystem.fastForwardDays(n); },
                skipDays: function (n) { return timeSystem.fastForwardDays(n); },
                skipToMonth: function (n) { timeSystem.fastForwardDays(n * 30); },
                finishTutorial: function () { tutorial.skip(); },
                addEngineers: function (n) { teamSystem.fillStaff('engineer', n, 3); },
                addDesigners: function (n) { teamSystem.fillStaff('designer', n, 3); },
                addMarketers: function (n) { teamSystem.fillStaff('marketer', n, 3); },
                completeAllResearch: function () { return research.completeAllResearch(); },
                completeResearch: function (id) { return research.completeResearch(id); },
                startOsWith: function (featureIds) { return os.quickSetup(featureIds); },
                spawnOsBug: function () { return os.spawnBug(); },
                quickRelease: function (cfg) { return products.quickRelease(cfg); },
                setYear: function (y) {
                    const cur = state.get().time.currentYear;
                    return timeSystem.fastForwardDays((y - cur) * 365.25);
                },
                spawnViralEvent: function (type) { return opinion.forceViral(type); },
                addCompetitorEvent: function (compId) { return competitors.triggerLifeEventFor(compId); },
                forceCompetitorRelease: function (compId) { return competitors.forceRelease(compId); },
                forceReview: function () { return opinion.forceReview(); },
                recomputeSentiment: function () { return opinion.recomputeNow(); },
                previewNotif: function (msg, type) {
                    ToastService.show(msg || 'Contoh notifikasi.', type || 'info', 3500);
                    return { renderer: getActiveRendererIdPublic() };
                },
                forceEra: function (eraId) {
                    state.get().era = eraId;
                    bus.emit('state:changed', state.get());
                    renderAll();
                    return { era: eraId, renderer: getActiveRendererIdPublic() };
                },
                enableAutoRestockAll: function (threshold) {
                    const list = state.get().products.catalog;
                    list.forEach(p => {
                        products.toggleAutoRestock(p.id, true);
                        if (threshold) products.setAutoRestockThreshold(p.id, threshold);
                    });
                    renderAll();
                    return { count: list.length };
                },
                tickAutoRestock: function () {
                    products._tickAutoRestock();
                    return { ok: true };
                },
                refreshCandidates: function () {
                    teamSystem.refreshCandidates();
                    renderAll();
                    return { count: state.get().candidates.length };
                },
                setTheme: function (id) { ThemeService.setTheme(id); renderAll(); return { theme: id }; },
                setAccent: function (id) { ThemeService.setAccent(id); renderAll(); return { accent: id }; },
                toggleTheme: function () { ThemeService.toggleTheme(); renderAll(); return { theme: ThemeService.getTheme() }; }
            }
        };

        window.render = renderAll;
        window.navigate = navigate;
        window.renderAll = renderAll;

        renderAll();
        bindGlobalClicks();
        bindTimeEvents();
        bindStateEvents();
        bindProgressEvents();
        updateTitle();

        timeSystem.start();
        SaveService.startAutoSave(function () { return state; });

        const cash = state.get().cash;
        if (cash > 0) {
            document.querySelectorAll('[data-cash]').forEach(el => { el.textContent = '$0'; });
            animateCash(0, cash);
        }

        console.info('[' + APP_CONFIG.name + '] siap. Era:', state.get().era);
    } catch (err) {
        console.error('[boot] gagal:', err);
        hideLoading();
        if (els.error) { els.error.style.display = 'block'; els.error.textContent = 'Boot error: ' + err.message; }
    }
}

boot();
