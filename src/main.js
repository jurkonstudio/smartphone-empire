// FILE: src/main.js
import { APP_CONFIG } from './config/app.config.js';
import { VIEW_TITLES } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { TimeSystem } from './core/TimeSystem.js';
import { SaveService } from './core/SaveService.js';
import { ToastService } from './core/ToastService.js';
import { ThemeService } from './core/ThemeService.js';
import { ChipResearchSystem } from './core/ChipResearchSystem.js';
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
import { ChipSystem } from './systems/ChipSystem.js';
import { FabSystem } from './systems/FabSystem.js';
import { NewsSystem } from './systems/NewsSystem.js';
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
import { renderResearchPanel, setFilterCategory, setTimelineFilter, getChipResearchFilter, setChipResearchFilter, openNodeDetailModal, openOsWizardModal, openCreateOsModal, openFeatureDetailModal, openChipNodeModal } from './ui/panels/ResearchPanel.js';
import { renderProductPanel, openProductDetailModal, openCampaignModal, openOrderProductionModal } from './ui/panels/ProductPanel.js';
import { openDesignWizard } from './ui/panels/DesignWizard.js';
import { renderMarketPanel, drawShareChart } from './ui/panels/MarketPanel.js';
import { openCompetitorDetailModal } from './ui/panels/CompetitorDetailModal.js';
import { openViralResponseModal } from './ui/panels/PublicOpinionPanel.js';
import { drawSalesChart } from './ui/panels/SalesChart.js';
import { renderTeamPanel } from './ui/panels/TeamPanel.js';
import { openStaffDetailModal } from './ui/panels/StaffDetailModal.js';
import { openChipDesigner } from './ui/panels/ChipDesignerPanel.js';
import { openFabPanel, openProductionQtyModal } from './ui/panels/FabPanel.js';
import { openNewsArticleModal } from './ui/panels/NewsArticleModal.js';
import { handleNewsListClick } from './ui/panels/NewsListPanel.js';
import { renderChipMockup } from './ui/phone/ChipMockup.js';
import { renderChipRadarChart } from './ui/charts/ChipRadarChart.js';
import * as marketingModule from './data/marketing.data.js';
import * as feedbackModule from './data/feedback.data.js';
import { getActiveRendererIdPublic } from './ui/notifications/NotificationRenderer.js';
import { initSwipe, showSwipeAnimation } from './core/SwipeService.js';
import { initNavSliderDrag } from './core/NavSliderDrag.js';

// ============ INSTANCE ============
var timeSystem        = new TimeSystem(state);
var economy           = new EconomySystem(state);
var quests            = new QuestSystem(state);
var tutorial          = new TutorialSystem(state);
var research          = new ResearchSystem(state);
var chipResearch      = new ChipResearchSystem(state);
var os                = new OSSystem(state);
var products          = new ProductSystem(state);
var market            = new MarketSystem(state);
var competitors       = new CompetitorSystem(state);
var opinion           = new PublicOpinionSystem(state);
var eraSystem         = new EraSystem(state);
var teamSystem        = new TeamSystem(state);
var chipSystem        = new ChipSystem(state);
var fabSystem         = new FabSystem(state);

market.setCompetitorSystem(competitors);

// ============ STATE UI ============
var activeView = 'dashboard';
var activeSubtab = 'tech';
var activeProdSubtab = 'design';
var activeMarketSubtab = 'share';
var activeTeamSubtab = 'active';
var _burnWarn = null;

var els = {
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

// ============================================================
// NAV RENDER — Liquid Glass Slider
// ============================================================
function renderNavOnly() {
    if (!els.nav) return;

    var hasRendered = !!els.nav.querySelector('.nav-btn');

    if (!hasRendered) {
        els.nav.innerHTML = renderMobileNav({ active: activeView });
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { updateNavSlider(false); });
        });
    } else {
        var buttons = els.nav.querySelectorAll('.nav-btn');
        for (var i = 0; i < buttons.length; i++) {
            var isActive = buttons[i].dataset.nav === activeView;
            buttons[i].classList.toggle('active', isActive);
            buttons[i].setAttribute('aria-current', isActive ? 'page' : 'false');
        }
        updateNavSlider(true);
    }
}

function updateNavSlider(animated) {
    if (!els.nav) return;
    if (els.nav.dataset.dragging === '1') return;

    var slider = els.nav.querySelector('.nav-slider');
    if (!slider) return;

    var buttons = els.nav.querySelectorAll('.nav-btn');
    if (!buttons.length) return;

    var idx = -1;
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].classList.contains('active')) { idx = i; break; }
    }
    if (idx < 0) idx = 0;

    var navW = els.nav.clientWidth;
    if (navW <= 0) return;

    var count = buttons.length;
    var itemW = navW / count;
    var sliderW = Math.max(56, Math.min(itemW * 0.88, 80));
    var x = (idx * itemW) + ((itemW - sliderW) / 2);

    if (!animated) {
        slider.style.transition = 'none';
        slider.style.width = sliderW + 'px';
        slider.style.transform = 'translateX(' + x + 'px)';
        void slider.offsetWidth;
        requestAnimationFrame(function () { slider.style.transition = ''; });
    } else {
        slider.style.width = sliderW + 'px';
        slider.style.transform = 'translateX(' + x + 'px)';
    }
}

// ============ RENDER VIEW ============
function renderView(opts) {
    if (!els.view) return;
    var soft = !!(opts && opts.soft);
    var prevScroll = els.view.scrollTop;
    if (soft) els.view.classList.add('soft-update');

    var html = '';
    try {
        if (activeView === 'dashboard') html = renderDashboard(state.get(), getTime(), research, teamSystem);
        else if (activeView === 'profile') html = renderCompanyProfilePanel({ teamSystem: teamSystem, marketSystem: market, competitors: competitors, opinionSystem: opinion });
        else if (activeView === 'team') html = renderTeamPanel({ subtab: activeTeamSubtab, teamSystem: teamSystem });
        else if (activeView === 'research') html = renderResearchPanel({ subtab: activeSubtab, researchSystem: research, osSystem: os, chipResearchSystem: chipResearch });
        else if (activeView === 'products') html = renderProductPanel({ subtab: activeProdSubtab, productSystem: products, researchSystem: research, osSystem: os });
        else if (activeView === 'market') html = renderMarketPanel({ subtab: activeMarketSubtab, marketSystem: market, competitorSystem: competitors, opinionSystem: opinion });
        else if (activeView === 'settings') html = renderSettingsPanel();
        else if (activeView === 'guide') html = renderGuidePanel();
        else html = renderEmptyState({ icon: '?', title: 'Tidak ditemukan' });
    } catch (err) {
        console.error('[renderView] Error:', err);
        html = '<div class="card" style="border-color:var(--danger);margin-top:20px;"><div class="card-title" style="color:var(--danger);">Error Render</div><div style="font-size:13px;line-height:1.6;word-break:break-word;"><b>View:</b> ' + activeView + '<br><b>Error:</b> ' + (err && err.message ? err.message : 'Unknown') + '</div></div>';
    }
    els.view.innerHTML = html;

    if (!soft) {
        els.view.classList.add('view-fresh');
        if (window.__viewFreshTimer) clearTimeout(window.__viewFreshTimer);
        window.__viewFreshTimer = setTimeout(function () {
            if (els.view) els.view.classList.remove('view-fresh');
        }, 600);
    }

    if (soft) {
        els.view.scrollTop = prevScroll;
        requestAnimationFrame(function () { if (els.view) { els.view.scrollTop = prevScroll; els.view.classList.remove('soft-update'); } });
    } else {
        els.view.scrollTop = 0;
    }
    try {
        if (activeView === 'dashboard') { var chart = els.view.querySelector('.chart-wrap'); if (chart) drawCashChart(chart); }
        if (activeView === 'products' && activeProdSubtab === 'sales') { var sc = els.view.querySelector('.chart-wrap'); if (sc) drawSalesChart(sc); }
        if (activeView === 'market' && activeMarketSubtab === 'share') { var sc2 = els.view.querySelector('.chart-wrap'); if (sc2) drawShareChart(sc2); }
        if (activeView === 'settings') bindSettingsActions(els.view);
    } catch (err) { console.error('[renderView] Post:', err); }
}

function renderAll() { renderHeaderOnly(); renderNavOnly(); renderView(); }

function updateDashboardLive() {
    var t = state.get().time;
    var d = document.querySelector('[data-kpi-day]'); if (d) d.textContent = t.currentDay;
    var m = document.querySelector('[data-kpi-month]'); if (m) m.textContent = t.currentMonth;
    var y = document.querySelector('[data-kpi-year]'); if (y) y.textContent = t.currentYear;
}

// ============ CASH ANIMATION ============
var _cashRaf = null;
function animateCash(from, to) {
    if (_cashRaf) { cancelAnimationFrame(_cashRaf); _cashRaf = null; }
    var targets = document.querySelectorAll('[data-cash]');
    if (!targets.length || from === to) return;
    var start = performance.now();
    function step(ts) {
        var p = Math.min(1, (ts - start) / 520);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = from + (to - from) * eased;
        var text = '$' + Math.round(val).toLocaleString('en-US');
        targets.forEach(function (el) { el.textContent = text; });
        if (p < 1) _cashRaf = requestAnimationFrame(step); else _cashRaf = null;
    }
    _cashRaf = requestAnimationFrame(step);
}

// ============ NAV ============
function navigate(id) {
    if (id === activeView) return;
    activeView = id;
    if (els.view) els.view.classList.add('soft-update');
    renderAll();
    updateTitle();
    if (els.view) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (els.view) els.view.classList.remove('soft-update');
            });
        });
    }
    bus.emit('view:changed', { id: id });
    bus.emit('tutorial:action', { id: 'nav:' + id });
}

function updateTitle() {
    var meta = VIEW_TITLES[activeView];
    document.title = APP_CONFIG.name + ' - ' + (meta ? meta.title : 'Dashboard');
}

function vibrate(ms) {
    var s = state.get();
    if (!s.settings.vibrate) return;
    if (navigator && typeof navigator.vibrate === 'function') { try { navigator.vibrate(ms); } catch (e) {} }
}

// ============ CLICKS ============
function bindGlobalClicks() {
    document.body.addEventListener('click', function (e) {
        var autoToggle = e.target.closest('[data-auto-toggle]');
        if (autoToggle) {
            e.preventDefault(); vibrate(8);
            var p = state.get().products.catalog.find(function (x) { return x.id === autoToggle.dataset.prodId; });
            if (p) { products.toggleAutoRestock(p.id, !(p.autoRestock && p.autoRestock.enabled)); renderAll(); }
            return;
        }
        var autoThresh = e.target.closest('[data-auto-threshold]');
        if (autoThresh) { e.preventDefault(); vibrate(6); products.setAutoRestockThreshold(autoThresh.dataset.prodId, parseInt(autoThresh.dataset.autoThreshold, 10) || 20); renderAll(); return; }

        var chipAction = e.target.closest('[data-chip-action]');
        if (chipAction) {
            e.preventDefault(); vibrate(8);
            var a = chipAction.dataset.chipAction;
            if (a === 'new') { openChipDesigner(); return; }
            if (a === 'fab') { openFabPanel(); return; }
            if (a === 'cancel-design') { var r = chipSystem.cancelDesign(); if (r.ok) { ToastService.info('Dibatalkan.'); renderAll(); } else ToastService.error(r.reason); return; }
        }

        var fabAction = e.target.closest('[data-fab-action]');
        if (fabAction) {
            e.preventDefault(); vibrate(8);
            var a = fabAction.dataset.fabAction;
            if (a === 'build') { var r = fabSystem.buildFab(parseInt(fabAction.dataset.fabLevel, 10) || 1); if (r.ok) { Modal.close('fab-panel', true); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'upgrade') { var r = fabSystem.upgradeFab(); if (r.ok) { Modal.close('fab-panel', true); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'cancel-upgrade') { var r = fabSystem.cancelUpgrade(); if (r.ok) { Modal.close('fab-panel', true); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'cancel-prod') { var r = fabSystem.cancelProduction(); if (r.ok) { Modal.close('fab-panel', true); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'select-prod') { Modal.close('fab-panel', true); setTimeout(function () { openProductionQtyModal(fabAction.dataset.chipId); }, 100); return; }
            if (a === 'confirm-prod') {
                var root = document.querySelector('[data-modal-id="fab-prod-qty"]');
                var qty = parseInt(root.querySelector('[data-prod-qty]').value, 10) || 0;
                var res = fabSystem.orderProduction(fabAction.dataset.chipId, qty);
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.success('Produksi dimulai!'); Modal.close('fab-prod-qty', true); renderAll(); }
                return;
            }
        }

        var chipRow = e.target.closest('[data-chip-detail]');
        if (chipRow) {
            e.preventDefault();
            var chip = chipSystem.getChipById(chipRow.dataset.chipDetail);
            if (chip) _openChipDetail(chip);
            return;
        }

        if (handleNewsListClick(e)) return;

        var navBtn = e.target.closest('[data-nav]');
        if (navBtn) { e.preventDefault(); vibrate(8); navigate(navBtn.dataset.nav); return; }

        var timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault(); vibrate(12);
            var a = timeBtn.dataset.timeAction;
            if (a === 'toggle-pause') { timeSystem.togglePause(); bus.emit('tutorial:action', { id: 'action:toggle-pause' }); }
            else if (a === 'cycle-speed') { timeSystem.cycleSpeed(); bus.emit('tutorial:action', { id: 'action:cycle-speed' }); }
            return;
        }

        var teamSub = e.target.closest('[data-team-subtab]');
        if (teamSub) { e.preventDefault(); activeTeamSubtab = teamSub.dataset.teamSubtab; renderView(); return; }
        var teamAction = e.target.closest('[data-team-action]');
        if (teamAction) {
            e.preventDefault(); vibrate(8);
            var a = teamAction.dataset.teamAction;
            if (a === 'hire') { var res = teamSystem.hireCandidate(teamAction.dataset.candidateId); if (!res.ok) ToastService.error(res.reason); else renderAll(); return; }
            if (a === 'refresh-pool') { teamSystem.refreshCandidates(); ToastService.success('Pool diperbarui.'); renderAll(); return; }
            if (a === 'goto-recruit') { activeTeamSubtab = 'recruit'; renderView(); return; }
        }
        var staffCard = e.target.closest('[data-staff-detail]');
        if (staffCard && !e.target.closest('[data-staff-action]')) { e.preventDefault(); openStaffDetailModal({ staffId: staffCard.dataset.staffDetail }); return; }
        var staffAction = e.target.closest('[data-staff-action]');
        if (staffAction) {
            e.preventDefault();
            var a = staffAction.dataset.staffAction; var sid = staffAction.dataset.staffId;
            if (a === 'fire') { var res = teamSystem.fireStaff(sid); if (!res.ok) ToastService.error(res.reason); else { Modal.close('staff-detail', true); renderAll(); } return; }
            if (a === 'train') { var res = teamSystem.trainStaff(sid); if (!res.ok) ToastService.error(res.reason); else { Modal.close('staff-detail', true); openStaffDetailModal({ staffId: sid }); renderAll(); } return; }
        }

        var subBtn = e.target.closest('[data-subtab]');
        if (subBtn) { e.preventDefault(); activeSubtab = subBtn.dataset.subtab; renderView(); return; }
        var chipFilter = e.target.closest('[data-filter-cat]');
        if (chipFilter) { e.preventDefault(); setFilterCategory(chipFilter.dataset.filterCat); renderView(); return; }
        var timelineFilter = e.target.closest('[data-timeline-filter]');
        if (timelineFilter) { e.preventDefault(); setTimelineFilter(timelineFilter.dataset.timelineFilter); renderView(); return; }

        // Chip research
        var chipFilterCat = e.target.closest('[data-chip-filter-cat]');
        if (chipFilterCat) { e.preventDefault(); setChipResearchFilter(chipFilterCat.dataset.chipFilterCat); renderView(); return; }
        var chipNodeCard = e.target.closest('[data-chip-node-detail]');
        if (chipNodeCard) { e.preventDefault(); openChipNodeModal({ nodeId: chipNodeCard.dataset.chipNodeDetail, chipResearchSystem: chipResearch }); return; }
        var chipRAction = e.target.closest('[data-chip-research-action]');
        if (chipRAction) {
            e.preventDefault();
            var a = chipRAction.dataset.chipResearchAction; var nodeId = chipRAction.dataset.nodeId;
            if (a === 'start') { var res = chipResearch.startResearch(nodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.success('Riset chip dimulai!'); Modal.close('chip-node-detail', true); renderAll(); } }
            else if (a === 'cancel') { var res = chipResearch.cancelResearch(nodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.info('Dibatalkan.'); Modal.close('chip-node-detail', true); renderAll(); } }
            return;
        }

        var nodeCard = e.target.closest('[data-node-detail]');
        if (nodeCard) { e.preventDefault(); openNodeDetailModal({ nodeId: nodeCard.dataset.nodeDetail, researchSystem: research }); return; }
        var rAction = e.target.closest('[data-research-action]');
        if (rAction) {
            e.preventDefault();
            var a = rAction.dataset.researchAction; var nodeId = rAction.dataset.nodeId;
            if (a === 'start') { var res = research.startResearch(nodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.success('Riset dimulai!'); Modal.close('node-detail', true); renderAll(); } }
            else if (a === 'cancel') { var res = research.cancelResearch(nodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.info('Dibatalkan.'); Modal.close('node-detail', true); renderAll(); } }
            return;
        }

        var osAction = e.target.closest('[data-os-action]');
        if (osAction) {
            e.preventDefault();
            var a = osAction.dataset.osAction;
            if (a === 'create') { openCreateOsModal({ osSystem: os }); return; }
            if (a === 'wizard') { openOsWizardModal({ osSystem: os }); return; }
            if (a === 'cancel-deving') { var res = os.cancelVersion(); if (res.ok) { ToastService.info('Dibatalkan.'); renderAll(); } else ToastService.error(res.reason); return; }
            if (a === 'patch-bug') { var r = os.patchBug(osAction.dataset.bugId); if (r.ok) { ToastService.success('Patch dimulai.'); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'ignore-bug') { var r = os.ignoreBug(osAction.dataset.bugId); if (r.ok) { ToastService.warning('Diabaikan.'); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'start-app') { var r = os.startApp(osAction.dataset.appId); if (r.ok) { ToastService.success('App dirilis.'); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'invite-devs') { var r = os.inviteDevelopers(); if (r.ok) { ToastService.success('+' + r.bonus + ' dev.'); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'feature-detail') { openFeatureDetailModal({ osSystem: os, featureId: osAction.dataset.featureId }); return; }
        }

        var prodSub = e.target.closest('[data-prod-subtab]');
        if (prodSub) { e.preventDefault(); activeProdSubtab = prodSub.dataset.prodSubtab; renderView(); return; }
        var prodAction = e.target.closest('[data-prod-action]');
        if (prodAction) {
            e.preventDefault();
            var a = prodAction.dataset.prodAction; var pid = prodAction.dataset.prodId;
            if (a === 'open-wizard') { openDesignWizard({ researchSystem: research, osSystem: os, productSystem: products }); return; }
            if (a === 'cancel-dev') { var r = products.cancelDevelopment(); if (r.ok) { ToastService.info('Dibatalkan.'); renderAll(); } else ToastService.error(r.reason); return; }
            if (a === 'order-prod') { openOrderProductionModal({ productId: pid }); return; }
            if (a === 'campaign') { openCampaignModal({ productId: pid }); return; }
            if (a === 'discontinue') { var r = products.discontinueProduct(pid); if (r.ok) { ToastService.info('Produk dihentikan.'); Modal.close('product-detail', true); renderAll(); } else ToastService.error(r.reason); return; }
        }
        var prodCard = e.target.closest('[data-prod-detail]');
        if (prodCard && !e.target.closest('[data-prod-action]') && !e.target.closest('[data-auto-toggle]') && !e.target.closest('[data-auto-threshold]')) {
            e.preventDefault(); openProductDetailModal({ productId: prodCard.dataset.prodDetail, productSystem: products }); return;
        }
        var campPick = e.target.closest('[data-campaign-pick]');
        if (campPick) {
            e.preventDefault();
            var res = products.startCampaign(campPick.dataset.prodId, campPick.dataset.campaignPick);
            if (!res.ok) ToastService.error(res.reason);
            else { ToastService.success('Kampanye dimulai!'); Modal.close('campaign-pick', true); renderAll(); }
            return;
        }
        var orderConfirm = e.target.closest('[data-order-confirm]');
        if (orderConfirm) {
            e.preventDefault();
            var root = document.querySelector('[data-modal-id="order-prod"]');
            var qty = parseInt(root.querySelector('[data-order-qty]').value, 10) || 0;
            var res = products.orderProduction(orderConfirm.dataset.prodId, qty);
            if (!res.ok) ToastService.error(res.reason);
            else { ToastService.success('Order dibuat.'); Modal.close('order-prod', true); renderAll(); }
            return;
        }

        var mktSub = e.target.closest('[data-market-subtab]');
        if (mktSub) { e.preventDefault(); activeMarketSubtab = mktSub.dataset.marketSubtab; renderView(); return; }
        var compCard = e.target.closest('[data-competitor-detail]');
        if (compCard) {
            e.preventDefault();
            var mode = state.get().settings.competitorMode || 'real';
            var cdata = competitors.getCompetitorData(compCard.dataset.competitorDetail, mode);
            openCompetitorDetailModal({ competitorData: cdata });
            return;
        }
        var viralRespond = e.target.closest('[data-viral-respond]');
        if (viralRespond) { e.preventDefault(); openViralResponseModal({ viralId: viralRespond.dataset.viralId }); return; }
        var viralPick = e.target.closest('[data-viral-response-pick]');
        if (viralPick) {
            e.preventDefault();
            var res = opinion.respondToViral(viralPick.dataset.viralId, viralPick.dataset.viralResponsePick);
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

// ============ CHIP DETAIL ============
function _openChipDetail(chip) {
    if (!chip) return;
    var lifecycle = chipSystem.getChipLifecycle ? chipSystem.getChipLifecycle(chip) : null;
    var ageMonths = chipSystem.getChipAgeMonths ? chipSystem.getChipAgeMonths(chip) : 0;

    var mockupHtml = '';
    try { mockupHtml = renderChipMockup(chip.config, { size: 170 }); } catch (e) {}
    var radarHtml = '';
    try { radarHtml = renderChipRadarChart({ performance: chip.stats.performance, efficiency: chip.stats.efficiency, costPerUnit: chip.stats.costPerUnit, yieldRate: chip.yieldRate }, { size: 150 }); } catch (e) {}

    var html = '<div class="modal-title">' + chip.name + '</div>' +
        '<div class="modal-sub">Dirilis ' + chip.releaseDate.day + '/' + chip.releaseDate.month + '/' + chip.releaseDate.year + ' - ' + ageMonths + ' bulan</div>' +
        '<div class="chip-detail-layout">' +
        '<div class="chip-detail-left">' +
        '<div class="chip-detail-device">' + mockupHtml + '</div>' +
        '<div class="chip-detail-radar">' + radarHtml + '</div>' +
        '</div>' +
        '<div class="chip-detail-right">' +
        '<div class="sum-row"><span>Performance</span><b style="color:var(--success);">' + chip.stats.performance + '</b></div>' +
        '<div class="sum-row"><span>Efficiency</span><b style="color:var(--info);">' + chip.stats.efficiency + '</b></div>' +
        '<div class="sum-row"><span>Cost per unit</span><b>$' + chip.stats.costPerUnit + '</b></div>' +
        '<div class="sum-row"><span>Yield Rate</span><b>' + Math.round(chip.yieldRate * 100) + '%</b></div>' +
        '<div class="sum-row"><span>Cores</span><b>' + chip.stats.cores + 'x @ ' + chip.stats.clock + ' GHz</b></div>' +
        '<div class="sum-row"><span>Cache</span><b>' + chip.stats.cacheMB.toFixed(2) + ' MB</b></div>' +
        (lifecycle ? '<div class="sum-row"><span>Lifecycle</span><b style="color:' + lifecycle.color + ';">' + lifecycle.label + ' (x' + lifecycle.multiplier.toFixed(2) + ')</b></div>' : '') +
        '</div>' +
        '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">Tutup</button>';

    Modal.open('chip-detail', html);
}

// ============ PROGRESS ============
function bindProgressEvents() {
    bus.on('research:progress', function (data) {
        if (activeView !== 'research' || activeSubtab !== 'tech') return;
        var slotsEl = els.view.querySelector('[data-research-slots]');
        if (slotsEl) slotsEl.textContent = data.active.length + '/' + data.maxSlots;
        data.active.forEach(function (r) {
            var pct = Math.round(r.percent * 100);
            var bar = els.view.querySelector('[data-research-bar="' + r.nodeId + '"]'); if (bar) bar.style.width = pct + '%';
            var pctEl = els.view.querySelector('[data-research-pct="' + r.nodeId + '"]'); if (pctEl) pctEl.textContent = pct + '%';
            var etaEl = els.view.querySelector('[data-research-eta="' + r.nodeId + '"]'); if (etaEl) etaEl.textContent = 'Sisa ~' + Math.ceil(r.remainingDays) + ' hari';
        });
    });
    bus.on('os:progress', function (data) {
        if (activeView !== 'research' || activeSubtab !== 'os') return;
        var pct = Math.round(data.percent * 100);
        var bar = els.view.querySelector('[data-os-dev-bar]'); if (bar) bar.style.width = pct + '%';
        var pctEl = els.view.querySelector('[data-os-dev-pct]'); if (pctEl) pctEl.textContent = pct + '%';
        var eta = els.view.querySelector('[data-os-dev-eta]'); if (eta) eta.textContent = 'Sisa ~' + Math.ceil(data.remainingDays) + ' hari';
    });
    bus.on('product:development-progress', function (data) {
        if (activeView !== 'products' || activeProdSubtab !== 'design') return;
        var phaseMap = { design: 'Desain', prototype: 'Prototipe', production: 'Produksi', released: 'Rilis' };
        var phaseEl = els.view.querySelector('[data-prod-dev-phase]'); if (phaseEl) phaseEl.textContent = phaseMap[data.phase] || data.phase;
        var pctEl = els.view.querySelector('[data-prod-dev-pct]'); if (pctEl) pctEl.textContent = data.percentOverall + '%';
        var barEl = els.view.querySelector('[data-prod-dev-bar]'); if (barEl) barEl.style.width = data.percentOverall + '%';
        var etaEl = els.view.querySelector('[data-prod-dev-eta]'); if (etaEl) etaEl.textContent = 'Sisa ~' + data.remainingDays + ' hari';
    });

    // Chip research progress
    bus.on('chip-research:progress', function (data) {
        if (activeView !== 'research' || activeSubtab !== 'chip') return;
        var slotsEl = els.view.querySelector('[data-chip-research-slots]');
        if (slotsEl) slotsEl.textContent = data.active.length + '/' + data.maxSlots;
        data.active.forEach(function (r) {
            var pct = Math.round(r.percent * 100);
            var bar = els.view.querySelector('[data-chip-research-bar="' + r.nodeId + '"]'); if (bar) bar.style.width = pct + '%';
            var pctEl = els.view.querySelector('[data-chip-research-pct="' + r.nodeId + '"]'); if (pctEl) pctEl.textContent = pct + '%';
            var etaEl = els.view.querySelector('[data-chip-research-eta="' + r.nodeId + '"]'); if (etaEl) etaEl.textContent = 'Sisa ~' + Math.ceil(r.remainingDays) + ' hari';
        });
    });

    bus.on('research:started',   function () { if (activeView === 'research' && activeSubtab === 'tech') renderView({ soft: true }); });
    bus.on('research:completed', function () { if (activeView === 'research' && activeSubtab === 'tech') renderView({ soft: true }); });
    bus.on('research:cancelled', function () { if (activeView === 'research' && activeSubtab === 'tech') renderView({ soft: true }); });

    bus.on('chip-research:started',   function () { if (activeView === 'research' && activeSubtab === 'chip') renderView({ soft: true }); });
    bus.on('chip-research:completed', function () { if (activeView === 'research' && activeSubtab === 'chip') renderView({ soft: true }); });
    bus.on('chip-research:cancelled', function () { if (activeView === 'research' && activeSubtab === 'chip') renderView({ soft: true }); });

    bus.on('product:development-started',   function () { if (activeView === 'products') renderView({ soft: true }); });
    bus.on('product:released',              function () { if (activeView === 'products') renderView({ soft: true }); });
    bus.on('product:development-cancelled', function () { if (activeView === 'products') renderView({ soft: true }); });
}

// ============ TIME ============
function bindTimeEvents() {
    bus.on('time:tick', function () {
        var meta = els.header && els.header.querySelector('.header-meta');
        if (!meta) return;
        var t = getTime();
        var hh = String(Math.floor(t.currentHour)).padStart(2, '0');
        var mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
        var d = meta.querySelector('[data-time-date]'); if (d) d.textContent = 'Hari ' + t.currentDay + '/' + t.currentMonth + '/' + t.currentYear;
        var c = meta.querySelector('[data-time-clock]'); if (c) c.textContent = hh + ':' + mm;
        var s = meta.querySelector('[data-time-status]'); if (s) { s.textContent = t.isPaused ? 'Paused' : (t.gameSpeed + 'x'); s.classList.toggle('running', !t.isPaused); }
    });
    bus.on('time:day-changed', function () { if (activeView === 'dashboard') updateDashboardLive(); });
    bus.on('time:speed-changed', function () { renderHeaderOnly(); });
}

// ============ STATE ============
function bindStateEvents() {
    bus.on('state:cash-changed', function (data) { animateCash(data.prev, data.next); });
    bus.on('state:log-changed', function () { if (activeView === 'dashboard') renderView({ soft: true }); });
    bus.on('state:milestone-added', function () { if (activeView === 'dashboard') renderView({ soft: true }); });
    bus.on('quest:completed', function (data) { ToastService.success('Quest selesai: ' + data.title); vibrate(20); });
    bus.on('quest:activated', function () { if (activeView === 'dashboard') renderView({ soft: true }); });
    bus.on('economy:warn-burnrate', function (data) {
        _burnWarn = 'Sisa ' + data.monthsLeft + ' bln';
        renderHeaderOnly();
        ToastService.warning('Sisa uang ~' + data.monthsLeft + ' bulan biaya!');
        vibrate(30);
    });
    bus.on('settings:take-loan', function (data) {
        var res = economy.takeLoan(data.loanId);
        if (!res.ok) ToastService.error(res.error);
        else { ToastService.success('Pinjaman diterima.'); renderView(); }
    });
    bus.on('settings:changed', function () {});
    bus.on('tutorial:restart', function () { tutorial.restart(); });
    bus.on('era:changed', function () { renderAll(); });
    bus.on('team:changed', function () { if (activeView === 'dashboard' || activeView === 'team') renderView({ soft: true }); });
    bus.on('team:recruited', function () { if (activeView === 'team') renderView({ soft: true }); });
    bus.on('team:fired', function () { if (activeView === 'team') renderView({ soft: true }); });

    bus.on('news:published', function (data) {
        try {
            var article = data && data.article;
            if (!article) return;
            var shortMsg = article.source + ': ' + article.headline;
            if (shortMsg.length > 70) shortMsg = shortMsg.slice(0, 67) + '...';
            ToastService.show(shortMsg, 'news', 6500, {
                action: {
                    label: 'Baca',
                    onClick: function () { openNewsArticleModal(article); }
                }
            });
            if (activeView === 'dashboard') renderView({ soft: true });
            vibrate(15);
        } catch (err) {
            console.error('[main] news:published handler error:', err);
        }
    });
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
            var saved = SaveService.load();
            if (saved) { state.hydrate(saved); console.info('[boot] Save dimuat.'); }
        } else {
            var onb = await showOnboarding();
            state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
            var mod = await import('./data/balance.data.js');
            var starting = mod.BALANCE.startingCash[onb.difficulty] || mod.BALANCE.startingCash.normal;
            state.setCash(starting);
            state.addMilestone('founded', 'Perusahaan ' + onb.companyName + ' didirikan.');
            state.addLog('Perusahaan ' + onb.companyName + ' didirikan.', 'success');
            SaveService.save(state);
        }

        if (!state.get().settings.competitorMode) state.get().settings.competitorMode = 'real';

        eraSystem.start();
        economy.start();
        quests.start();
        tutorial.start();
        teamSystem.start();
        if (!state.get().candidates || state.get().candidates.length === 0) teamSystem.refreshCandidates();
        research.start();
        chipResearch.start();
        os.start();
        products.start();
        competitors.start();
        market.start();
        opinion.start();
        chipSystem.start();
        fabSystem.start();
        NewsSystem.start();

        window.__game = {
            state: state, bus: bus, timeSystem: timeSystem, economy: economy, quests: quests, tutorial: tutorial,
            research: research, chipResearch: chipResearch, os: os, products: products, market: market, competitors: competitors, opinion: opinion, eraSystem: eraSystem, teamSystem: teamSystem,
            chips: chipSystem, fab: fabSystem, news: NewsSystem, ThemeService: ThemeService,
            SaveService: SaveService, ToastService: ToastService, Modal: Modal, navigate: navigate, render: renderAll,
            modules: { marketing: marketingModule, feedbackData: feedbackModule },
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
                completeAllChipResearch: function () { return chipResearch.completeAllResearch(); },
                completeChipResearch: function (id) { return chipResearch.completeResearch(id); },
                startOsWith: function (ids) { return os.quickSetup(ids); },
                quickRelease: function (cfg) { return products.quickRelease(cfg); },
                setYear: function (y) { var cur = state.get().time.currentYear; return timeSystem.fastForwardDays((y - cur) * 365.25); },
                forceEra: function (eraId) { state.get().era = eraId; bus.emit('state:changed', state.get()); renderAll(); return { era: eraId }; },
                setTheme: function (id) { ThemeService.setTheme(id); renderAll(); return { theme: id }; },
                setAccent: function (id) { ThemeService.setAccent(id); renderAll(); return { accent: id }; },
                unlockChipDesign: function () { ['chip_design_tool','chip_arch_arm_a','node_180','node_130','node_90','chip_isp_basic','chip_dvfs','fab_construction'].forEach(function (id) { research.completeResearch(id); chipResearch.completeResearch(id); }); return { ok: true }; },
                quickDesignChip: function (cfg) { return chipSystem.quickDesignChip(cfg); },
                buildFab: function (lvl) { return fabSystem.quickBuildFab(lvl || 1); },
                produceChips: function (chipId, qty) { var id = chipId || (state.get().chips.catalog[0] && state.get().chips.catalog[0].id); return fabSystem.orderProduction(id, qty || 1000); },
                testNews: function () { var a = NewsSystem.generateTestArticle(); if (a) bus.emit('news:published', { article: a }); return a; }
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

        window.addEventListener('resize', function () {
            updateNavSlider(false);
        });
        window.addEventListener('orientationchange', function () {
            setTimeout(function () { updateNavSlider(false); }, 200);
        });

        var cash = state.get().cash;
        if (cash > 0) {
            document.querySelectorAll('[data-cash]').forEach(function (el) { el.textContent = '$0'; });
            animateCash(0, cash);
        }

        initNavSliderDrag({
            nav: els.nav,
            getActiveView: function () { return activeView; },
            navigate: navigate
        });

        initSwipe({
            getView: function () { return activeView; },
            getSubtab: function () {
                if (activeView === 'research') return activeSubtab;
                if (activeView === 'products') return activeProdSubtab;
                if (activeView === 'market')   return activeMarketSubtab;
                if (activeView === 'team')     return activeTeamSubtab;
                return null;
            },
            setSubtab: function (id, direction) {
                if (activeView === 'research') activeSubtab = id;
                else if (activeView === 'products') activeProdSubtab = id;
                else if (activeView === 'market')   activeMarketSubtab = id;
                else if (activeView === 'team')     activeTeamSubtab = id;
                renderView();
                showSwipeAnimation(direction);
            }
        });

        console.info('[' + APP_CONFIG.name + '] siap. Era: ' + state.get().era);
    } catch (err) {
        console.error('[boot] gagal:', err);
        hideLoading();
        if (els.error) { els.error.style.display = 'block'; els.error.textContent = 'Boot error: ' + err.message; }
    }
}

boot();
