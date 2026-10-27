// FILE: src/main.js
// v2028.55 — [UPDATE] Integrasi AdvisorNLP Chat & Optimasi Keyboard (Quick Reply)
import { APP_CONFIG } from './config/app.config.js';
import { VIEW_TITLES } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { TimeSystem } from './core/TimeSystem.js';
import { SaveService } from './core/SaveService.js';
import { DEV_BUILD } from './config/dev.config.js';
import { ToastService } from './core/ToastService.js';
import { setUserControlPolicy, setUserControlAlgo } from './systems/FutureEffects.js';
import { UserControlSystem, setDataMonetization } from './systems/UserControlSystem.js';
import { NotificationPrefs } from './core/NotificationPrefs.js';
import { ThemeService } from './core/ThemeService.js';
import { LanguageService } from './core/LanguageService.js';
import { ChipResearchSystem } from './core/ChipResearchSystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { EraEventSystem } from './systems/EraEventSystem.js';
import { AnnualReviewSystem } from './systems/AnnualReviewSystem.js';
import { ChannelSystem } from './systems/ChannelSystem.js';
import { AfterSalesSystem } from './systems/AfterSalesSystem.js';
import { EcosystemSystem } from './systems/EcosystemSystem.js';
import { AppStoreReviewSystem } from './systems/AppStoreReviewSystem.js';   // [Peninjauan App Store]
import { TutorialSystem } from './systems/TutorialSystem.js';
import { ResearchSystem } from './systems/ResearchSystem.js';
import { OSSystem } from './systems/OSSystem.js';
import { ProductSystem } from './systems/ProductSystem.js';
import { MarketSystem } from './systems/MarketSystem.js';
import { CompetitorSystem } from './systems/CompetitorSystem.js';
import { CompetitorActionSystem } from './systems/CompetitorActionSystem.js';
import { PublicOpinionSystem } from './systems/PublicOpinionSystem.js';
import { MarketNavSystem } from './systems/MarketNavSystem.js';
import { HypeCycleSystem } from './systems/HypeCycleSystem.js';
import { EraSystem } from './systems/EraSystem.js';
import { TeamSystem } from './systems/TeamSystem.js';
import { ChipSystem } from './systems/ChipSystem.js';
import { FabSystem } from './systems/FabSystem.js';
import { ComponentPlantSystem } from './systems/ComponentPlantSystem.js';
import { AssemblySystem } from './systems/AssemblySystem.js';
import { WholesaleContractSystem } from './systems/WholesaleContractSystem.js';
import { CompanyHistorySystem } from './systems/CompanyHistorySystem.js';
import { NewsSystem } from './systems/NewsSystem.js';
import { AdvisorSystem } from './systems/AdvisorSystem.js';
import { StockSystem } from './systems/StockSystem.js';
import { PromotionSystem } from './systems/PromotionSystem.js';
import { BankSystem } from './systems/BankSystem.js';
import { EconBrakeSystem } from './systems/EconBrakeSystem.js';
import { bindRegionalActions } from './ui/panels/RegionalBindings.js';
import { SiliconService } from './systems/SiliconService.js';
import { renderHeader, renderRunwayChip } from './ui/layout/Header.js';
import { escapeHtml } from './utils/html.js';
import { renderMobileNav } from './ui/layout/MobileNav.js';
import { renderSidebar } from './ui/layout/Sidebar.js';
import { renderEmptyState } from './ui/panels/EmptyState.js';
import { renderSettingsPanel, bindSettingsActions } from './ui/panels/SettingsPanel.js';
import { renderGuidePanel } from './ui/panels/GuidePanel.js';
import { renderCompanyProfilePanel, bindCompanyProfileActions } from './ui/panels/CompanyProfilePanel.js';
import { mountToastContainer } from './ui/panels/ToastContainer.js';
import { drawCashChart } from './ui/panels/CashChart.js';
import { initTutorialOverlay } from './ui/panels/TutorialOverlay.js';
import { showOnboarding } from './ui/panels/OnboardingModal.js';
import { initMonthlySummary } from './ui/panels/MonthlySummaryModal.js';
import { initGameOverScreen } from './ui/panels/GameOverScreen.js';
import { initSeasonEndScreen } from './ui/panels/SeasonEndScreen.js';
import { SeasonEndSystem } from './systems/SeasonEndSystem.js';
import { Modal } from './ui/modal.js';
import { mountAdvisorButton } from './ui/panels/AdvisorPanel.js';
import { handleUiToken as handleManufactureUi, setSection as setManufactureSection } from './ui/panels/ManufactureUiState.js';
import { renderResearchPanel, setFilterCategory, setTimelineFilter, getChipResearchFilter, setChipResearchFilter, openNodeDetailModal, openOsWizardModal, openCreateOsModal, openFeatureDetailModal, openChipNodeModal } from './ui/panels/ResearchPanel.js';
import { renderProductPanel, setCatalogView, openProductDetailModal, openCampaignModal, openOrderProductionModal, setDesignTrack } from './ui/panels/ProductPanel.js';
import { openDesignWizard } from './ui/panels/DesignWizard.js';
import { renderMarketPanel, drawShareChart } from './ui/panels/MarketPanel.js';
import { openCompetitorDetailModal } from './ui/panels/CompetitorDetailModal.js';
import { openAcquisitionProductsModal } from './ui/panels/AcquisitionProductsModal.js';
import { openViralResponseModal } from './ui/panels/PublicOpinionPanel.js';
import { drawSalesChart } from './ui/panels/SalesChart.js';
import { openCandidateDetailModal, setRecruitFilter, setTeamMode } from './ui/panels/TeamPanel.js';
import { renderHqPanel } from './ui/panels/HqPanel.js';
import { renderHomePanel, initHomeTabs, refreshHomeSlides } from './ui/panels/HomePanel.js';
import { mountCampusMap, unmountCampusMap } from './ui/campus/CampusMap.js';
import { unmountOfficeMap, focusOfficeStaff } from './ui/office/OfficeMap.js';
import { enterOffice } from './ui/campus/CampusOfficeBridge.js';
import { openStaffDetailModal } from './ui/panels/StaffDetailModal.js';
import { openChipDesigner } from './ui/panels/ChipDesignerPanel.js';
import { openFabPanel, openProductionQtyModal } from './ui/panels/FabPanel.js';
import { openWholesalePanel, refreshWholesalePanel, initWholesaleNotifications } from './ui/panels/WholesalePanel.js';
import { openNewsArticleModal } from './ui/panels/NewsArticleModal.js';
import { openEraEventModal } from './ui/panels/EraEventModal.js';
import { openAnnualReviewModal } from './ui/panels/AnnualReviewModal.js';
import { openSiliconModal } from './ui/panels/SiliconPanel.js';
import { openSiliconStoreModal } from './ui/panels/SiliconStorePanel.js';
import { PaymentService } from './systems/PaymentService.js';
import { t as tr } from './core/LanguageService.js';
import { runOsActionWithLoading } from './ui/panels/OSPanel.js';
import { handleNewsListClick } from './ui/panels/NewsListPanel.js';
import { renderChipMockup } from './ui/phone/ChipMockup.js';
import { renderChipRadarChart } from './ui/charts/ChipRadarChart.js';
import { setExchangeCategory, setExchangeStock, drawExchangeChart, openBuyModal, openSellModal } from './ui/panels/ExchangePanel.js';
import { buildReport, formatReportText } from './diagnostics/DiagnosticReport.js';
import { openDiagnosticModal } from './diagnostics/DiagnosticUI.js';
import { CloudService } from './services/CloudService.js';
import { InboxService } from './services/InboxService.js';
import { openInboxPanel } from './ui/panels/InboxPanel.js';
import { SupabaseAdapter } from './services/cloud/SupabaseAdapter.js';
import { CloudSync } from './services/cloud/CloudSync.js';
import { bindCloudUI } from './services/cloud/CloudUI.js';
import * as marketingModule from './data/marketing.data.js';
import * as feedbackModule from './data/feedback.data.js';
import { getActiveRendererIdPublic, toggleNotificationPanel, closeNotificationPanel } from './ui/notifications/NotificationRenderer.js';
import { initSwipe, showSwipeAnimation } from './core/SwipeService.js';
import { initNavSliderDrag } from './core/NavSliderDrag.js';
import { AudioService } from './core/AudioService.js';
import { registerServiceWorker } from './services/ServiceWorkerService.js';
import advisorNLP from './systems/Advisor/AdvisorNLP.js'; // <-- IMPORT ADVISOR NLP

// ============ INSTANCE ============
var timeSystem        = new TimeSystem(state);
var economy           = new EconomySystem(state);
var quests            = new QuestSystem(state);
var eraEvents         = new EraEventSystem(state);
var annualReview      = new AnnualReviewSystem(state);
var tutorial          = new TutorialSystem(state);
var research          = new ResearchSystem(state);
var chipResearch      = new ChipResearchSystem(state);
var os                = new OSSystem(state);
var products          = new ProductSystem(state);
var market            = new MarketSystem(state);
var competitors       = new CompetitorSystem(state);
var competitorActions = new CompetitorActionSystem(state);
var opinion           = new PublicOpinionSystem(state);
var marketNav         = new MarketNavSystem(state);
products.setMarketNav(marketNav);
var hypeCycle = new HypeCycleSystem(state);
products.setHypeCycle(hypeCycle);
products.setMarketSystem(market);
var eraSystem         = new EraSystem(state);
var seasonEnd         = new SeasonEndSystem(state);
var teamSystem        = new TeamSystem(state);
var chipSystem        = new ChipSystem(state);
hypeCycle.setSources({ os: os, chip: chipSystem });
var fabSystem         = new FabSystem(state);
var componentPlants   = new ComponentPlantSystem(state);
var assemblySystem    = new AssemblySystem(state);
var wholesaleSystem   = new WholesaleContractSystem(state);
wholesaleSystem.setCompetitorActions(competitorActions);
var companyHistory    = new CompanyHistorySystem(state);
var advisor           = new AdvisorSystem(state, { research: research });
var stockSystem       = new StockSystem(state);
var promotion         = new PromotionSystem(state);
var channels          = new ChannelSystem(state);
var afterSales        = new AfterSalesSystem(state);
var ecosystem = new EcosystemSystem(state);   // [ekosistem] aksesori & App Store
var appReview = new AppStoreReviewSystem(state);   // [Peninjauan App Store] developer mengirim aplikasi, pemain menyetujui/menolak
var bank              = new BankSystem(state);
var econBrakes        = new EconBrakeSystem(state);
var userControlSystem = new UserControlSystem(state);   // Kontrol Pengguna: monetisasi data, regulasi, survei

market.setCompetitorSystem(competitors);
products.setPromotionSystem(promotion);
products.setComponentPlantSystem(componentPlants);
products.setAssemblySystem(assemblySystem);
bank.setPromotionSystem(promotion);
economy.setBank(bank);
// [v2029.1] penahan ekonomi: biaya volume, plafon pasar, respons rival, sink dana.
products.setEconBrakes(econBrakes);
market.setEconBrakes(econBrakes);
economy.setEconBrakes(econBrakes);
economy.setPlants(componentPlants);
products.setChannels(channels);
economy.setChannels(channels);
// [Pasca-jual] garansi, pusat servis, dukungan OS, insiden cacat massal.
afterSales.setAssembly(assemblySystem);
products.setAfterSales(afterSales);
products.setEcosystem(ecosystem);
economy.setAfterSales(afterSales);
economy.setEcosystem(ecosystem);
ecosystem.setAppReview(appReview);
teamSystem.setEconomy(economy); // [v2030] simulasi runway saat rekrut

// ============ STATE UI ============
var activeView = 'dashboard';
var activeSubtab = 'tech';
var activeProdSubtab = 'design';
var activeMarketSubtab = 'share';
var activeHqSubtab = 'overview';
var NAV_SUBTABS = {
    research: ['tech', 'os', 'manufaktur', 'chip'],
    products: ['design', 'catalog', 'sales', 'chip'],
    market: ['share', 'competitors', 'trends', 'promo', 'channels', 'service', 'ecosystem', 'appstore', 'public'],
    team: ['overview', 'team', 'exchange', 'bank']
};
var _burnWarn = null;

var els = {
    header:  document.getElementById('app-header'),
    view:    document.getElementById('app-view'),
    nav:     document.getElementById('mobile-nav'),
    sidebar: document.getElementById('sidebar'),
    loading: document.getElementById('loading-screen'),
    error:   document.getElementById('error-message'),
    toast:   document.getElementById('toast-container')
};

function getTime() { return timeSystem.snapshot(); }
function hideLoading() {
    if (window.__splash) window.__splash.finish();
    else if (els.loading) els.loading.style.display = 'none';
}
function splash(pct) { if (window.__splash) window.__splash.set(pct); }

// [v2030] Runway untuk header dan pesan. Aman dipanggil kapan pun.
function _runwayNow() {
    try { return economy.getRunway(); } catch (e) { return null; }
}

function _runwayL(id, en) { return LanguageService.getLang() === 'en' ? en : id; }

// Perbarui chip runway saja (tanpa render ulang header) agar ketukan tidak terganggu.
function updateRunwayChip() {
    if (!els.header) return;
    var cur = els.header.querySelector('[data-runway]');
    if (!cur) { renderHeaderOnly(); return; }
    cur.outerHTML = renderRunwayChip(_runwayNow());
}

function renderHeaderOnly() {
    if (!els.header) return;
    els.header.innerHTML = renderHeader({ state: state.get(), timeSnapshot: getTime(), runway: _runwayNow() });
}

// Konfirmasi rekrut bila gaji baru menurunkan runway di bawah batas aman (tidak memblokir).
function _openRunwayConfirm(imp, candidateId) {
    var b = _runwayL('bln', 'mo');
    var fmt = function (m) { return m === Infinity ? '∞' : Math.max(0, Math.floor(m)) + ' ' + b; };
    var name = escapeHtml(imp.name || '');
    var msg = _runwayL(
        'Merekrut ' + name + ' menurunkan runway dari ~' + fmt(imp.runwayBefore) + ' ke ~' + fmt(imp.runwayAfter) + ', di bawah batas aman ' + imp.safeMonths + ' ' + b + '.',
        'Hiring ' + name + ' drops runway from ~' + fmt(imp.runwayBefore) + ' to ~' + fmt(imp.runwayAfter) + ', below the ' + imp.safeMonths + '-' + b + ' safety line.'
    );
    var html = '<div style="padding:16px;display:flex;flex-direction:column;gap:12px;">' +
        '<h3 style="margin:0;">' + _runwayL('Runway di bawah batas aman', 'Runway below safety line') + '</h3>' +
        '<p style="margin:0;">' + msg + '</p>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">' + _runwayL('Batal', 'Cancel') + '</button>' +
        '<button class="btn-primary" data-team-action="hire-confirm" data-candidate-id="' + escapeHtml(candidateId) + '" style="flex:2;">' + _runwayL('Tetap rekrut', 'Hire anyway') + '</button>' +
        '</div></div>';
    Modal.open('runway-confirm', html);
}

// ============================================================
// NAV RENDER
// ============================================================
var _sideLang = null;
function renderSidebarOnly() {
    if (!els.sidebar) return;
    var curLang = LanguageService.getLang();
    var hasRendered = !!els.sidebar.querySelector('.dk-nav-btn');
    if (!hasRendered || _sideLang !== curLang) {
        _sideLang = curLang;
        els.sidebar.innerHTML = renderSidebar({ active: activeView });
        return;
    }
    var sbtns = els.sidebar.querySelectorAll('.dk-nav-btn');
    for (var si = 0; si < sbtns.length; si++) {
        var sActive = sbtns[si].dataset.nav === activeView;
        sbtns[si].classList.toggle('active', sActive);
        sbtns[si].setAttribute('aria-current', sActive ? 'page' : 'false');
    }
}

var _navLang = null;
function renderNavOnly() {
    renderSidebarOnly();
    if (!els.nav) return;

    var curLang = LanguageService.getLang();
    var hasRendered = !!els.nav.querySelector('.nav-btn');
    var langChanged = hasRendered && _navLang !== curLang;

    if (!hasRendered || langChanged) {
        _navLang = curLang;
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
var _lastViewKey = null;
function _viewKey() {
    return [activeView, activeSubtab, activeProdSubtab, activeMarketSubtab, activeHqSubtab].join('|');
}

function renderView(opts) {
    if (!els.view) return;
    var soft = !!(opts && opts.soft);
    var prevScroll = els.view.scrollTop;
    var viewKey = _viewKey();
    var sameView = (viewKey === _lastViewKey);
    _lastViewKey = viewKey;
    var keepScroll = soft || sameView;
    if (soft) els.view.classList.add('soft-update');

    var html = '';
    try {
        if (activeView === 'dashboard') html = renderHomePanel();
        else if (activeView === 'profile') html = renderCompanyProfilePanel({ teamSystem: teamSystem, marketSystem: market, competitors: competitors, opinionSystem: opinion });
        else if (activeView === 'team') html = renderHqPanel({ subtab: activeHqSubtab, state: state.get(), timeSnapshot: getTime(), researchSystem: research, teamSystem: teamSystem, stockSystem: stockSystem });
        else if (activeView === 'research') html = renderResearchPanel({ subtab: activeSubtab, researchSystem: research, osSystem: os, chipResearchSystem: chipResearch, componentPlantSystem: componentPlants, assemblySystem: assemblySystem });
        else if (activeView === 'products') html = renderProductPanel({ subtab: activeProdSubtab, productSystem: products, researchSystem: research, osSystem: os, ecosystemSystem: ecosystem });
        else if (activeView === 'market') html = renderMarketPanel({ subtab: activeMarketSubtab, marketSystem: market, competitorSystem: competitors, opinionSystem: opinion, channelSystem: channels, afterSalesSystem: afterSales, ecosystemSystem: ecosystem, appReviewSystem: appReview });
        else if (activeView === 'settings') html = renderSettingsPanel();
        else if (activeView === 'guide') html = renderGuidePanel();
        else html = renderEmptyState({ icon: '?', title: tr('main.not_found') });
    } catch (err) {
        console.error('[renderView] Error:', err);
        html = '<div class="card" style="border-color:var(--danger);margin-top:20px;"><div class="card-title" style="color:var(--danger);">Error Render</div><div style="font-size:13px;line-height:1.6;word-break:break-word;"><b>View:</b> ' + activeView + '<br><b>Error:</b> ' + (err && err.message ? err.message : 'Unknown') + '</div></div>';
    }
    unmountCampusMap();
    unmountOfficeMap();
    els.view.classList.toggle('view-home', activeView === 'dashboard');
    document.body.classList.toggle('is-home', activeView === 'dashboard');
    els.view.innerHTML = html;

    if (!keepScroll) {
        els.view.classList.add('view-fresh');
        if (window.__viewFreshTimer) clearTimeout(window.__viewFreshTimer);
        window.__viewFreshTimer = setTimeout(function () {
            if (els.view) els.view.classList.remove('view-fresh');
        }, 600);
    }

    if (keepScroll) {
        els.view.scrollTop = prevScroll;
        requestAnimationFrame(function () { if (els.view) { els.view.scrollTop = prevScroll; els.view.classList.remove('soft-update'); } });
    } else {
        els.view.scrollTop = 0;
    }
    try {
        if (activeView === 'team' && activeHqSubtab === 'overview') {
            var chart = els.view.querySelector('.chart-wrap'); if (chart) drawCashChart(chart);
        }
        if (activeView === 'products' && activeProdSubtab === 'sales') { var sc = els.view.querySelector('.chart-wrap'); if (sc) drawSalesChart(sc); }
        if (activeView === 'market' && activeMarketSubtab === 'share') { var sc2 = els.view.querySelector('.chart-wrap'); if (sc2) drawShareChart(sc2); }
        if (activeView === 'settings') bindSettingsActions(els.view);
        if (activeView === 'profile') bindCompanyProfileActions(els.view);
        if (activeView === 'team' && activeHqSubtab === 'exchange') {
            var exChart = els.view.querySelector('[data-ex-chart]');
            if (exChart) drawExchangeChart(exChart);
        }
        if (activeView === 'dashboard') {
            var campusEl = els.view.querySelector('#campus-map');
            if (campusEl) mountCampusMap(campusEl, state.get());
            var wrapperEl = els.view.querySelector('.home-wrapper');
            if (wrapperEl) {
                initHomeTabs(wrapperEl);
                _bindCarouselPerf(wrapperEl);
            }
        }
    } catch (err) { console.error('[renderView] Post:', err); }
}

function _bindCarouselPerf(wrapperEl) {
    var map = wrapperEl && wrapperEl.querySelector('#campus-map');
    if (map) map.classList.remove('scrolling');
}

function renderAll() { renderHeaderOnly(); renderNavOnly(); renderView(); }
function renderSoft() { renderHeaderOnly(); renderView({ soft: true }); }

function updateDashboardLive() {
    var t = state.get().time;
    var d = document.querySelector('[data-kpi-day]'); if (d) d.textContent = t.currentDay;
    var m = document.querySelector('[data-kpi-month]'); if (m) m.textContent = t.currentMonth;
    var y = document.querySelector('[data-kpi-year]'); if (y) y.textContent = t.currentYear;
}

// ============ CASH ANIMATION ============
var _cashRaf = null;
function _showCashDelta(diff) {
    var el = document.querySelector('[data-cash-delta]');
    if (!el) return;
    if (!diff || Math.abs(diff) < 1) return;
    var isUp = diff > 0;
    var sign = isUp ? '+' : '−';
    var text = sign + '$' + Math.abs(Math.round(diff)).toLocaleString('en-US');
    el.textContent = text;
    el.classList.remove('up', 'down');
    el.classList.add(isUp ? 'up' : 'down');
    el.classList.add('show');
    if (window.__deltaTimer) clearTimeout(window.__deltaTimer);
    window.__deltaTimer = setTimeout(function () {
        el.classList.remove('show');
    }, 2500);
}

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
    _showCashDelta(to - from);
}

// ============ NAV ============
function navigate(id) {
    closeNotificationPanel();
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
    var navKey = 'nav.' + activeView;
    var label = tr(navKey);
    if (!label || label === navKey) label = meta ? meta.title : 'Dashboard';
    document.title = APP_CONFIG.name + ' - ' + label;
}

function notifVibrate(ms, type) {
    if (!NotificationPrefs.isTypeEnabled(type)) return;
    vibrate(ms);
}

function vibrate(ms) {
    var s = state.get();
    if (!s.settings.vibrate) return;
    if (navigator && typeof navigator.vibrate === 'function') { try { navigator.vibrate(ms); } catch (e) {} }
}

// ============ MODAL HELPERS (Exchange) ============
function _updateBuyTotal() {
    var root = document.querySelector('[data-modal-id="buy-modal"]');
    if (!root) return;
    var btn = root.querySelector('[data-buy-confirm]');
    if (!btn) return;
    var stockId = btn.dataset.buyConfirm;
    var qty = parseInt(root.querySelector('[data-qty-input]').value, 10) || 0;
    var el = root.querySelector('[data-buy-total]');
    if (!el) return;
    if (!window.__game || !window.__game.stocks) return;
    var priceUSD = window.__game.stocks.getPriceUSD(stockId);
    el.textContent = '$' + (priceUSD * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _updateSellTotal() {
    var root = document.querySelector('[data-modal-id="sell-modal"]');
    if (!root) return;
    var btn = root.querySelector('[data-sell-confirm]');
    if (!btn) return;
    var stockId = btn.dataset.sellConfirm;
    var qty = parseInt(root.querySelector('[data-qty-input]').value, 10) || 0;
    var el = root.querySelector('[data-sell-total]');
    if (!el) return;
    if (!window.__game || !window.__game.stocks) return;
    var priceUSD = window.__game.stocks.getPriceUSD(stockId);
    el.textContent = '$' + (priceUSD * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _refreshProductUi(productId) {
    var modalOpen = Modal.isOpen('product-detail');
    renderAll();
    if (modalOpen) {
        var body = document.querySelector('[data-modal-id="product-detail"] .modal-card');
        var scroll = body ? body.scrollTop : 0;
        openProductDetailModal({ productId: productId, productSystem: products });
        var nb = document.querySelector('[data-modal-id="product-detail"] .modal-card');
        if (nb) nb.scrollTop = scroll;
    }
}

// ============ ADVISOR CHAT INTEGRATION ============
function initAdvisorChat() {
    function sendChatMessage(text, inputElement, chatContainer) {
        if (!text) return;
        
        // PAKSA KEYBOARD TURUN: Lepas fokus dari input seketika itu juga
        if (inputElement) {
            inputElement.blur(); 
            setTimeout(function() { inputElement.blur(); }, 50); 
        } else if (document.activeElement) {
            document.activeElement.blur();
        }

        var s = state.get();
        var gs = {
            year: s.time.currentYear,
            funds: s.cash,
            sales: s.stats && s.stats.salesToday ? s.stats.salesToday : 0,
            researchLevel: s.research && s.research.completed ? s.research.completed.length : 0,
            activeProducts: s.products && s.products.catalog ? s.products.catalog.filter(function(p){return p.status === 'active';}).length : 0
        };

        var userDiv = document.createElement('div');
        userDiv.className = 'chat-bubble-user';
        userDiv.style.cssText = 'align-self:flex-end;background:#007AFF;color:white;padding:8px 12px;border-radius:12px;margin:5px 0;max-width:80%;margin-left:auto;font-size:14px;';
        userDiv.innerText = text;
        if (chatContainer) chatContainer.appendChild(userDiv);

        setTimeout(function() {
            var aiResponse = advisorNLP.chat(text, gs);
            var aiDiv = document.createElement('div');
            aiDiv.className = 'chat-bubble-ai';
            aiDiv.style.cssText = 'align-self:flex-start;background:#2C2C2E;color:white;padding:8px 12px;border-radius:12px;margin:5px 0;max-width:80%;font-size:14px;';
            aiDiv.innerText = aiResponse;
            if (chatContainer) {
                chatContainer.appendChild(aiDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            vibrate(10);
        }, 600);
    }

    // Handle "Enter" di keyboard
    document.body.addEventListener('keydown', function(e) {
        if (e.target.matches('input[placeholder*="Tanya apa saja"], input[placeholder*="Tanya"]')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var parent = e.target.parentElement;
                if (!parent) return;
                var sendBtn = parent.querySelector('button');
                if(sendBtn) sendBtn.click();
            }
        }
    });

    // Handle klik tombol Send (Panah biru)
    document.body.addEventListener('click', function(e) {
        var sendBtn = e.target.closest('button');
        if (sendBtn) {
            var parent = sendBtn.parentElement;
            // Tombol bisa sudah terlepas dari DOM (dirender ulang oleh handler lain)
            if (!parent) return;
            var input = parent.querySelector('input[placeholder*="Tanya apa saja"], input[placeholder*="Tanya"]');
            if (input) {
                e.preventDefault();
                e.stopPropagation();
                var text = input.value.trim();
                if (!text) return;
                input.value = '';
                var chatContainer = document.querySelector('.chat-messages') || parent.parentElement;
                sendChatMessage(text, input, chatContainer);
            }
        }
    });

    // Handle klik pada Chip Pertanyaan Cepat (Quick Reply)
    // Menggunakan 'true' di akhir (Capture Phase) agar mencegah keyboard muncul
    document.body.addEventListener('click', function(e) {
        var chip = e.target.closest('.chip, .chip-small, [data-quick-reply]');
        // Hanya chip quick reply yang sungguhan (opt-in lewat data-quick-reply, atau di dalam chat).
        // Chip filter lain (Rekrut, Bursa, Riset) harus dibiarkan ke handler masing-masing.
        if (chip && !chip.hasAttribute('data-quick-reply') && !chip.closest('[data-modal-id="advisor"], .chat-messages')) chip = null;
        if (chip) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); 
            
            var chipText = chip.innerText.trim();
            var input = document.querySelector('input[placeholder*="Tanya apa saja"]');
            var parent = chip.parentElement ? chip.parentElement.parentElement : null;
            var chatContainer = document.querySelector('.chat-messages') || parent;
            
            sendChatMessage(chipText, input, chatContainer);
        }
    }, true);
}

// ============ CLICKS ============
function bindGlobalClicks() {
    // Kontrol Pengguna: slider algoritma. 'input' memperbarui angka langsung, 'change' (saat dilepas) menyimpan + render ulang.
    document.body.addEventListener('change', function (e) {
        var sl = e.target && e.target.matches && e.target.matches('[data-uc-algo]') ? e.target : null;
        if (!sl) return;
        if (setUserControlAlgo(sl.dataset.ucAlgo, sl.value, state.get())) renderAll();
    });
    document.body.addEventListener('input', function (e) {
        if (e.target.matches && e.target.matches('[data-uc-algo]')) {
            var lbl = document.querySelector('[data-uc-algo-val="' + e.target.dataset.ucAlgo + '"]');
            if (lbl) lbl.textContent = e.target.value;
            return;
        }
        if (e.target.matches('[data-qty-input]')) {
            var root = e.target.closest('[data-modal-id]');
            if (!root) return;
            if (root.dataset.modalId === 'buy-modal') _updateBuyTotal();
            else if (root.dataset.modalId === 'sell-modal') _updateSellTotal();
        }
    });

    document.body.addEventListener('click', function (e) {
        try {
            var clickable = e.target.closest('button, [role="button"], .nav-btn, .chip, .chip-small, .subtab-btn, .wiz-option, .wiz-color, .staff-row, .cand-row');
            if (clickable && !clickable.disabled) {
                if (clickable.classList.contains('toggle-switch') || clickable.hasAttribute('data-toggle')) {
                    AudioService.play('toggle');
                } else if (clickable.classList.contains('chip') ||
                           clickable.classList.contains('chip-small') ||
                           clickable.classList.contains('subtab-btn') ||
                           clickable.classList.contains('wiz-option') ||
                           clickable.classList.contains('wiz-color')) {
                    AudioService.play('select');
                } else {
                    AudioService.play('tap');
                }
            }
        } catch (err) {}

        var autoToggle = e.target.closest('[data-auto-toggle]');
        if (autoToggle) {
            e.preventDefault(); vibrate(8);
            var p = state.get().products.catalog.find(function (x) { return x.id === autoToggle.dataset.prodId; });
            if (p) {
                products.toggleAutoRestock(p.id, !(p.autoRestock && p.autoRestock.enabled));
                _refreshProductUi(p.id);
            }
            return;
        }
        var autoThresh = e.target.closest('[data-auto-threshold]');
        if (autoThresh) { e.preventDefault(); vibrate(6); products.setAutoRestockThreshold(autoThresh.dataset.prodId, parseInt(autoThresh.dataset.autoThreshold, 10) || 20); _refreshProductUi(autoThresh.dataset.prodId); return; }
        var ucPol = e.target.closest('[data-uc-policy]');
        if (ucPol) {
            e.preventDefault(); vibrate(8);
            if (setUserControlPolicy(ucPol.dataset.ucPolicy, state.get())) {
                try { AudioService.play('select'); } catch (err) {}
                renderAll();
            }
            return;
        }
        var ucMon = e.target.closest('[data-uc-monetize]');
        if (ucMon) {
            e.preventDefault(); vibrate(8);
            if (setDataMonetization(ucMon.dataset.ucMonetize === '1', state.get())) {
                try { AudioService.play('select'); } catch (err) {}
                renderAll();
            }
            return;
        }
        var catFilter = e.target.closest('[data-catalog-filter]');
        if (catFilter) { e.preventDefault(); setCatalogView('filter', catFilter.dataset.catalogFilter); renderAll(); return; }
        var catSort = e.target.closest('[data-catalog-sort]');
        if (catSort) { e.preventDefault(); setCatalogView('sort', catSort.dataset.catalogSort); renderAll(); return; }
        var catCat = e.target.closest('[data-catalog-cat]');
        if (catCat) { e.preventDefault(); setCatalogView('cat', catCat.dataset.catalogCat); renderAll(); return; }

        var chipAction = e.target.closest('[data-chip-action]');
        if (chipAction) {
            e.preventDefault(); vibrate(8);
            var a = chipAction.dataset.chipAction;
            if (a === 'new') { openChipDesigner(); return; }
            if (a === 'fab') { openFabPanel(); return; }
            if (a === 'cancel-design') { var r = chipSystem.cancelDesign(); if (r.ok) { ToastService.info(tr('main.toast.cancelled')); renderAll(); } else ToastService.error(r.reason); return; }
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
                else { ToastService.success(tr('main.toast.prod_started')); Modal.close('fab-prod-qty', true); renderAll(); }
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

        var inboxBtn = e.target.closest('[data-inbox-open]');
        if (inboxBtn) { e.preventDefault(); vibrate(8); openInboxPanel(); return; }

        var notifBtn = e.target.closest('[data-notif-toggle]');
        if (notifBtn) { e.preventDefault(); vibrate(8); toggleNotificationPanel(); return; }

        var navBtn = e.target.closest('[data-nav]');
        if (navBtn) {
            e.preventDefault(); vibrate(8);
            var navSub = navBtn.dataset.navSub, navView = navBtn.dataset.nav;
            if (navSub && NAV_SUBTABS[navView] && NAV_SUBTABS[navView].indexOf(navSub) >= 0) {
                if (navView === 'research') activeSubtab = navSub;
                else if (navView === 'products') activeProdSubtab = navSub;
                else if (navView === 'market') activeMarketSubtab = navSub;
                else if (navView === 'team') activeHqSubtab = navSub;
                if (navView === activeView) { renderView(); return; }
            }
            navigate(navView);
            return;
        }

        var guideReport = e.target.closest('[data-guide-report]');
        if (guideReport) { e.preventDefault(); vibrate(8); openDiagnosticModal(); return; }

        var siliconBtn = e.target.closest('[data-silicon-open]');
        if (siliconBtn) { e.preventDefault(); vibrate(8); openSiliconModal(); return; }

        var silRes = e.target.closest('[data-sil-research]');
        if (silRes) {
            e.preventDefault(); vibrate(8);
            if (silRes.dataset.silShort) { ToastService.warning(tr('silicon.short')); openSiliconStoreModal(); return; }
            var silMode = silRes.dataset.silResearch;
            var silKind = silRes.dataset.kind;
            var silNode = silRes.dataset.nodeId;
            var silR = (silMode === 'unlock' || silMode === 'instant')
                ? SiliconService.unlockResearch(silKind, silNode, silMode === 'instant')
                : SiliconService.boostResearch(silKind, silNode, silMode);
            if (!silR.ok) {
                ToastService.error(silR.reason || tr('main.toast.failed'));
                if (silR.need) openSiliconStoreModal();
                return;
            }
            if (silMode === 'unlock') ToastService.success(tr('sil.research.msg.unlock', { n: silR.spent }));
            else if (silMode === 'instant') ToastService.success(tr('sil.research.msg.instant', { n: silR.spent }));
            else if (silR.completed) ToastService.success(tr('sil.research.msg.finish', { n: silR.spent }));
            else ToastService.success(tr('sil.research.msg.boost', { n: silR.spent }));
            Modal.close('node-detail', true);
            Modal.close('chip-node-detail', true);
            renderAll();
            return;
        }

        var timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault(); vibrate(12);
            var a = timeBtn.dataset.timeAction;
            if (a === 'toggle-pause') { timeSystem.togglePause(); bus.emit('tutorial:action', { id: 'action:toggle-pause' }); }
            else if (a === 'cycle-speed') { timeSystem.cycleSpeed(); bus.emit('tutorial:action', { id: 'action:cycle-speed' }); }
            return;
        }

        var hqSubBtn = e.target.closest('[data-hq-subtab]');
        if (hqSubBtn) { e.preventDefault(); activeHqSubtab = hqSubBtn.dataset.hqSubtab; renderView(); return; }

        var exCat = e.target.closest('[data-ex-cat]');
        if (exCat) { e.preventDefault(); vibrate(6); setExchangeCategory(exCat.dataset.exCat); renderView(); return; }

        var exSel = e.target.closest('[data-ex-select]');
        if (exSel) { e.preventDefault(); vibrate(6); setExchangeStock(exSel.dataset.exSelect); renderView(); return; }

        var exBuy = e.target.closest('[data-ex-buy]');
        if (exBuy) { e.preventDefault(); vibrate(8); openBuyModal(exBuy.dataset.exBuy); return; }

        var exSell = e.target.closest('[data-ex-sell]');
        if (exSell) { e.preventDefault(); vibrate(8); openSellModal(exSell.dataset.exSell); return; }

        var buyPreset = e.target.closest('[data-buy-preset]');
        if (buyPreset) {
            e.preventDefault();
            var bRoot = document.querySelector('[data-modal-id="buy-modal"]');
            if (!bRoot) return;
            var bInp = bRoot.querySelector('[data-qty-input]');
            var bv = buyPreset.dataset.buyPreset;
            if (bv === 'max') {
                var sid = buyPreset.dataset.buyStock;
                if (window.__game && window.__game.stocks) {
                    bInp.value = window.__game.stocks.getMaxAffordableShares(sid);
                }
            } else {
                bInp.value = bv;
            }
            _updateBuyTotal();
            return;
        }

        var sellPreset = e.target.closest('[data-sell-preset]');
        if (sellPreset) {
            e.preventDefault();
            var sRoot = document.querySelector('[data-modal-id="sell-modal"]');
            if (!sRoot) return;
            var sInp = sRoot.querySelector('[data-qty-input]');
            var sv = sellPreset.dataset.sellPreset;
            sInp.value = (sv === 'all') ? sInp.max : sv;
            _updateSellTotal();
            return;
        }

        var buyConfirm = e.target.closest('[data-buy-confirm]');
        if (buyConfirm) {
            e.preventDefault();
            var cRoot = document.querySelector('[data-modal-id="buy-modal"]');
            var cQty = parseInt(cRoot.querySelector('[data-qty-input]').value, 10) || 0;
            if (!window.__game || !window.__game.stocks) return;
            var cRes = window.__game.stocks.buyStock(buyConfirm.dataset.buyConfirm, cQty);
            if (!cRes.ok) { ToastService.error(cRes.reason); return; }
            ToastService.success(tr('main.toast.stock_buy', { n: cRes.shares.toLocaleString('en-US') }));
            vibrate(15);
            Modal.close('buy-modal', true);
            renderView();
            return;
        }

        var sellConfirm = e.target.closest('[data-sell-confirm]');
        if (sellConfirm) {
            e.preventDefault();
            var csRoot = document.querySelector('[data-modal-id="sell-modal"]');
            var csQty = parseInt(csRoot.querySelector('[data-qty-input]').value, 10) || 0;
            if (!window.__game || !window.__game.stocks) return;
            var csRes = window.__game.stocks.sellStock(sellConfirm.dataset.sellConfirm, csQty);
            if (!csRes.ok) { ToastService.error(csRes.reason); return; }
            ToastService.success(tr('main.toast.stock_sell', { n: csRes.shares.toLocaleString('en-US') }));
            vibrate(15);
            Modal.close('sell-modal', true);
            renderView();
            return;
        }

        var teamModeBtn = e.target.closest('[data-team-mode]');
        if (teamModeBtn) {
            e.preventDefault();
            vibrate(6);
            setTeamMode(teamModeBtn.dataset.teamMode);
            renderView();
            return;
        }

        var recruitFilterBtn = e.target.closest('[data-recruit-filter]');
        if (recruitFilterBtn) {
            e.preventDefault();
            setRecruitFilter(recruitFilterBtn.dataset.recruitFilter);
            renderView();
            return;
        }

        var teamAction = e.target.closest('[data-team-action]');
        if (teamAction) {
            e.preventDefault(); vibrate(8);
            var ta = teamAction.dataset.teamAction;
            if (ta === 'hire') {
                var himp = teamSystem.getHireImpactById(teamAction.dataset.candidateId);
                if (himp && himp.belowSafe) { _openRunwayConfirm(himp, teamAction.dataset.candidateId); return; }
                var res = teamSystem.hireCandidate(teamAction.dataset.candidateId);
                if (!res.ok) ToastService.error(res.reason);
                else { Modal.close('candidate-detail', true); renderAll(); }
                return;
            }
            if (ta === 'hire-confirm') {
                Modal.close('runway-confirm', true);
                var rcf = teamSystem.hireCandidate(teamAction.dataset.candidateId);
                if (!rcf.ok) ToastService.error(rcf.reason);
                else { Modal.close('candidate-detail', true); renderAll(); }
                return;
            }
            if (ta === 'negotiate') {
                var cidN = teamAction.dataset.candidateId;
                var nr = teamSystem.negotiateCandidate(cidN, teamAction.dataset.level);
                if (!nr.ok) { ToastService.error(nr.reason); return; }
                Modal.close('candidate-detail', true);
                if (nr.success) openCandidateDetailModal({ candidateId: cidN });
                renderAll();
                return;
            }
            if (ta === 'headhunt') {
                var hh = teamSystem.headhunt();
                if (!hh.ok) ToastService.error(hh.reason);
                else { renderAll(); }
                return;
            }
            if (ta === 'refresh-pool') { teamSystem.refreshCandidates(); ToastService.success(tr('main.toast.pool_refreshed')); renderAll(); return; }
            if (ta === 'goto-recruit') { setTeamMode('recruit'); renderView(); return; }
            if (ta === 'open-candidate') { openCandidateDetailModal({ candidateId: teamAction.dataset.candidateId }); return; }
        }

        var staffCard = e.target.closest('[data-staff-detail]');
        if (staffCard && !e.target.closest('[data-staff-action]')) { e.preventDefault(); openStaffDetailModal({ staffId: staffCard.dataset.staffDetail }); return; }
        var staffOffice = e.target.closest('[data-staff-office]');
        if (staffOffice) { e.preventDefault(); bus.emit('advisor:go', { nav: 'dashboard', officeStaffId: staffOffice.dataset.staffOffice }); return; }
        var staffAction = e.target.closest('[data-staff-action]');
        if (staffAction) {
            e.preventDefault();
            var sa = staffAction.dataset.staffAction; var sid2 = staffAction.dataset.staffId;
            if (sa === 'fire') { var res = teamSystem.fireStaff(sid2); if (!res.ok) ToastService.error(res.reason); else { Modal.close('staff-detail', true); renderAll(); } return; }
            if (sa === 'train') { var res = teamSystem.trainStaff(sid2); if (!res.ok) ToastService.error(res.reason); else { Modal.close('staff-detail', true); openStaffDetailModal({ staffId: sid2 }); renderAll(); } return; }
        }

        var subBtn = e.target.closest('[data-subtab]');
        if (subBtn) { e.preventDefault(); activeSubtab = subBtn.dataset.subtab; renderView(); return; }
        var chipFilter = e.target.closest('[data-filter-cat]');
        if (chipFilter) { e.preventDefault(); setFilterCategory(chipFilter.dataset.filterCat); renderView(); return; }
        var timelineFilter = e.target.closest('[data-timeline-filter]');
        if (timelineFilter) { e.preventDefault(); setTimelineFilter(timelineFilter.dataset.timelineFilter); renderView(); return; }

        var mfUi = e.target.closest('[data-mf-ui]');
        if (mfUi) {
            e.preventDefault(); vibrate(6);
            var mfTok = mfUi.dataset.mfUi;
            if (handleManufactureUi(mfTok)) {
                renderView();
                if (mfTok.indexOf('sec:') === 0 && els.view) els.view.scrollTop = 0;
            }
            return;
        }

        var whAction = e.target.closest('[data-wholesale-action]');
        if (whAction) {
            e.preventDefault(); vibrate(8);
            var whA = whAction.dataset.wholesaleAction;
            if (whA === 'open') { openWholesalePanel(wholesaleSystem); return; }
            var whR = whA === 'accept'
                ? wholesaleSystem.accept(whAction.dataset.wholesaleId)
                : wholesaleSystem.decline(whAction.dataset.wholesaleId);
            if (whR.ok) {
                if (whA === 'accept') ToastService.success('Kontrak grosir diterima. Pembayaran menyusul setelah pengiriman.');
                refreshWholesalePanel(wholesaleSystem);
                renderAll();
            } else ToastService.error(whR.reason);
            return;
        }

        var mfAction = e.target.closest('[data-mf-action]');
        if (mfAction) {
            e.preventDefault(); vibrate(8);
            var mfA = mfAction.dataset.mfAction, mfP = mfAction.dataset.mfPlant, mfR = null;
            if (mfA === 'build') mfR = componentPlants.buildPlant(mfP);
            else if (mfA === 'upgrade') mfR = componentPlants.upgradePlant(mfP);
            else if (mfA === 'cancel-upgrade') mfR = componentPlants.cancelUpgrade(mfP);
            else if (mfA === 'order') mfR = componentPlants.orderProduction(mfP, mfAction.dataset.mfComp, parseInt(mfAction.dataset.mfQty, 10) || 0);
            else if (mfA === 'cancel-prod') mfR = componentPlants.cancelProduction(mfP);
            else if (mfA === 'sell') mfR = componentPlants.sellExternal(mfP, mfAction.dataset.mfComp, parseInt(mfAction.dataset.mfQty, 10) || 0);
            if (mfR && !mfR.ok) ToastService.error(mfR.reason);
            else if (mfR) renderAll();
            return;
        }

        var asmAction = e.target.closest('[data-asm-action]');
        if (asmAction) {
            e.preventDefault(); vibrate(8);
            var aA = asmAction.dataset.asmAction, aN = asmAction.dataset.asmN === 'max' ? 'max' : (parseInt(asmAction.dataset.asmN, 10) || 0), aR = null;
            if (aA === 'build') aR = assemblySystem.build();
            else if (aA === 'upgrade') aR = assemblySystem.upgrade();
            else if (aA === 'cancel') aR = assemblySystem.cancelUpgrade();
            else if (aA === 'hire') aR = assemblySystem.hire(asmAction.dataset.asmRole, aN);
            else if (aA === 'fire') aR = assemblySystem.fire(asmAction.dataset.asmRole, aN);
            else if (aA === 'overtime') aR = assemblySystem.setOvertime(aN === 1);
            else if (aA === 'fill') aR = assemblySystem.hireFill();
            else if (aA === 'grade') aR = assemblySystem.setGrade(asmAction.dataset.asmGrade);
            if (aR && !aR.ok) ToastService.error(aR.reason);
            else if (aR) renderAll();
            return;
        }

        var fabBuy = e.target.closest('[data-chip-fab-buy]');
        if (fabBuy) {
            e.preventDefault();
            var fres = chipResearch.purchaseUnlock(fabBuy.dataset.chipFabBuy);
            if (!fres.ok) ToastService.error(fres.reason);
            else { ToastService.success(tr('main.toast.fab_unlocked')); renderAll(); }
            return;
        }
        var chipFilterCat = e.target.closest('[data-chip-filter-cat]');
        if (chipFilterCat) { e.preventDefault(); setChipResearchFilter(chipFilterCat.dataset.chipFilterCat); renderView(); return; }
        var chipNodeCard = e.target.closest('[data-chip-node-detail]');
        if (chipNodeCard) { e.preventDefault(); openChipNodeModal({ nodeId: chipNodeCard.dataset.chipNodeDetail, chipResearchSystem: chipResearch }); return; }
        var chipRAction = e.target.closest('[data-chip-research-action]');
        if (chipRAction) {
            e.preventDefault();
            var cra = chipRAction.dataset.chipResearchAction; var cnodeId = chipRAction.dataset.nodeId;
            if (cra === 'start') { var res = chipResearch.startResearch(cnodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.success(tr('main.toast.chip_research_started')); Modal.close('chip-node-detail', true); renderAll(); } }
            else if (cra === 'cancel') { var res = chipResearch.cancelResearch(cnodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.info(tr('main.toast.cancelled')); Modal.close('chip-node-detail', true); renderAll(); } }
            return;
        }

        var nodeCard = e.target.closest('[data-node-detail]');
        if (nodeCard) { e.preventDefault(); openNodeDetailModal({ nodeId: nodeCard.dataset.nodeDetail, researchSystem: research }); return; }
        var rAction = e.target.closest('[data-research-action]');
        if (rAction) {
            e.preventDefault();
            var ra = rAction.dataset.researchAction; var rnodeId = rAction.dataset.nodeId;
            if (ra === 'start') { var res = research.startResearch(rnodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.success(tr('main.toast.research_started')); Modal.close('node-detail', true); renderAll(); } }
            else if (ra === 'cancel') { var res = research.cancelResearch(rnodeId); if (!res.ok) ToastService.error(res.reason); else { ToastService.info(tr('main.toast.cancelled')); Modal.close('node-detail', true); renderAll(); } }
            return;
        }

        var osAction = e.target.closest('[data-os-action]');
        if (osAction) {
            e.preventDefault();
            var oa = osAction.dataset.osAction;
            if (oa === 'create') { openCreateOsModal({ osSystem: os }); return; }
            if (oa === 'wizard') { openOsWizardModal({ osSystem: os }); return; }
            if (oa === 'cancel-deving') { runOsActionWithLoading(osAction, tr('os.action.loading'), 350, function () { var res = os.cancelVersion(); if (res.ok) { ToastService.info(tr('main.toast.cancelled')); renderAll(); return true; } ToastService.error(res.reason); return false; }); return; }
            if (oa === 'patch-bug') { var pbId = osAction.dataset.bugId; runOsActionWithLoading(osAction, tr('os.action.loading'), 700, function () { var r = os.patchBug(pbId); if (r.ok) { ToastService.success(tr('main.toast.patch_started')); renderAll(); return true; } ToastService.error(r.reason); return false; }); return; }
            if (oa === 'ignore-bug') { var ibId = osAction.dataset.bugId; runOsActionWithLoading(osAction, tr('os.action.loading'), 350, function () { var r = os.ignoreBug(ibId); if (r.ok) { ToastService.warning(tr('main.toast.ignored')); renderAll(); return true; } ToastService.error(r.reason); return false; }); return; }
            if (oa === 'start-app') { var saId = osAction.dataset.appId; runOsActionWithLoading(osAction, tr('os.action.loading'), 600, function () { var r = os.startApp(saId); if (r.ok) { ToastService.success(tr('main.toast.app_released')); renderAll(); return true; } ToastService.error(r.reason); return false; }); return; }
            if (oa === 'invite-devs') { runOsActionWithLoading(osAction, tr('os.action.loading'), 600, function () { var r = os.inviteDevelopers(); if (r.ok) { ToastService.success(tr('main.toast.devs_invited', { n: r.bonus })); renderAll(); return true; } ToastService.error(r.reason); return false; }); return; }
            if (oa === 'feature-detail') { openFeatureDetailModal({ osSystem: os, featureId: osAction.dataset.featureId }); return; }
        }

        var prodSub = e.target.closest('[data-prod-subtab]');
        if (prodSub) { e.preventDefault(); activeProdSubtab = prodSub.dataset.prodSubtab; renderView(); return; }
        var designTrackBtn = e.target.closest('[data-design-track]');
        if (designTrackBtn) { e.preventDefault(); setDesignTrack(designTrackBtn.dataset.designTrack); activeProdSubtab = 'design'; renderView(); return; }
        var prodAction = e.target.closest('[data-prod-action]');
        if (prodAction) {
            e.preventDefault();
            var pa = prodAction.dataset.prodAction; var pid = prodAction.dataset.prodId;
            if (pa === 'open-wizard') { openDesignWizard({ researchSystem: research, osSystem: os, productSystem: products }); return; }
            if (pa === 'cancel-dev') { var r = products.cancelDevelopment(); if (r.ok) { ToastService.info(tr('main.toast.cancelled')); renderAll(); } else ToastService.error(r.reason); return; }
            if (pa === 'order-prod') { openOrderProductionModal({ productId: pid }); return; }
            if (pa === 'campaign') { openCampaignModal({ productId: pid }); return; }
            if (pa === 'discontinue') { var r = products.discontinueProduct(pid); if (r.ok) { ToastService.info(tr('main.toast.product_discontinued')); Modal.close('product-detail', true); renderAll(); } else ToastService.error(r.reason); return; }
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
            else { ToastService.success(tr('main.toast.campaign_started')); Modal.close('campaign-pick', true); renderAll(); }
            return;
        }
        // [v2029.1] Investasi pabrik & akuisisi (tab HQ > Investasi).
        var econEff = e.target.closest('[data-econ-eff]');
        if (econEff) {
            e.preventDefault(); vibrate(8);
            var er = econBrakes.buyEfficiency();
            if (!er.ok) ToastService.error(er.reason); else ToastService.success('Investasi pabrik level ' + er.level + ' selesai.');
            renderAll();
            return;
        }
        var econAcqProd = e.target.closest('[data-econ-acq-products]');
        if (econAcqProd) {
            e.preventDefault(); vibrate(6);
            openAcquisitionProductsModal({ competitorId: econAcqProd.dataset.econAcqProducts });
            return;
        }
        var econAcq = e.target.closest('[data-econ-acq]');
        if (econAcq) {
            e.preventDefault(); vibrate(8);
            var ar = econBrakes.acquire(econAcq.dataset.econAcq);
            if (!ar.ok) ToastService.error(ar.reason); else ToastService.success('Akuisisi ' + ar.target.name + ' selesai.');
            renderAll();
            return;
        }
        var orderConfirm = e.target.closest('[data-order-confirm]');
        if (orderConfirm) {
            e.preventDefault();
            var oRoot = document.querySelector('[data-modal-id="order-prod"]');
            var oQty = parseInt(oRoot.querySelector('[data-order-qty]').value, 10) || 0;
            var res = products.orderProduction(orderConfirm.dataset.prodId, oQty);
            if (!res.ok) ToastService.error(res.reason);
            else { ToastService.success(tr('main.toast.order_created')); Modal.close('order-prod', true); renderAll(); }
            return;
        }

        var chToggle = e.target.closest('[data-channel-toggle]');
        if (chToggle) {
            e.preventDefault(); vibrate(8);
            var chId = chToggle.dataset.channelToggle;
            var chRes = channels.isActive(chId) ? channels.deactivate(chId) : channels.activate(chId);
            if (!chRes.ok) {
                var chMsg = chRes.reason === 'funds' ? _runwayL('Dana tidak cukup untuk membuka kanal ini.', 'Not enough funds to open this channel.')
                    : chRes.reason === 'lock' ? _runwayL('Masih terikat komitmen ' + chRes.monthsLeft + ' bulan lagi.', 'Still under commitment for ' + chRes.monthsLeft + ' more month(s).')
                    : chRes.reason === 'locked' ? _runwayL('Terbuka tahun ' + chRes.year + '.', 'Unlocks in ' + chRes.year + '.')
                    : _runwayL('Tidak bisa diubah.', 'Cannot change this channel.');
                ToastService.error(chMsg);
            } else ToastService.success(channels.isActive(chId) ? _runwayL('Kanal dibuka.', 'Channel opened.') : _runwayL('Kanal ditutup.', 'Channel closed.'));
            renderAll();
            return;
        }
        // [Pasca-jual] level pusat servis, garansi, dukungan OS, keputusan insiden.
        var asLevel = e.target.closest('[data-as-level]');
        if (asLevel) {
            e.preventDefault(); vibrate(8);
            var asLr = afterSales.setLevel(asLevel.dataset.asLevel);
            if (!asLr.ok) {
                ToastService.error(asLr.reason === 'funds' ? _runwayL('Dana tidak cukup untuk jaringan servis ini.', 'Not enough funds for this service network.')
                    : asLr.reason === 'locked' ? _runwayL('Terbuka tahun ' + asLr.year + '.', 'Unlocks in ' + asLr.year + '.')
                    : _runwayL('Tidak bisa diubah.', 'Cannot change this.'));
            } else ToastService.success(_runwayL('Jaringan servis diperbarui.', 'Service network updated.'));
            renderAll();
            return;
        }
        var asWar = e.target.closest('[data-as-warranty]');
        if (asWar) {
            e.preventDefault(); vibrate(6);
            var asWr = afterSales.setWarranty(asWar.dataset.asWarranty, parseInt(asWar.dataset.asVal, 10));
            if (!asWr.ok && asWr.reason === 'lock') ToastService.error(_runwayL('Garansi bisa diubah lagi dalam ' + asWr.monthsLeft + ' bulan.', 'Warranty can change again in ' + asWr.monthsLeft + ' month(s).'));
            else if (asWr.ok) ToastService.success(_runwayL('Garansi diperbarui.', 'Warranty updated.'));
            renderAll();
            return;
        }
        var asOs = e.target.closest('[data-as-os]');
        if (asOs) {
            e.preventDefault(); vibrate(6);
            var asOr = afterSales.setOsYears(asOs.dataset.asOs, parseInt(asOs.dataset.asVal, 10));
            if (!asOr.ok && asOr.reason === 'promise') ToastService.error(_runwayL('Janji dukungan update OS tidak bisa diturunkan.', 'An OS update promise cannot be lowered.'));
            else if (asOr.ok) ToastService.success(_runwayL('Dukungan update OS dinaikkan.', 'OS update support extended.'));
            renderAll();
            return;
        }
        var asInc = e.target.closest('[data-as-incident]');
        if (asInc) {
            e.preventDefault(); vibrate(10);
            var asIr = afterSales.resolveIncident(parseInt(asInc.dataset.asIncident, 10), asInc.dataset.asVal);
            if (!asIr.ok) {
                ToastService.error(asIr.reason === 'funds' ? _runwayL('Dana tidak cukup untuk tindakan ini.', 'Not enough funds for this action.')
                    : _runwayL('Insiden ini sudah tidak aktif.', 'This incident is no longer active.'));
            } else {
                ToastService.success(asInc.dataset.asVal === 'recall' ? _runwayL('Recall dijalankan.', 'Recall started.')
                    : asInc.dataset.asVal === 'campaign' ? _runwayL('Kampanye servis gratis dimulai.', 'Free service campaign started.')
                    : _runwayL('Insiden diabaikan.', 'Incident ignored.'));
            }
            renderAll();
            return;
        }
        // [Ekosistem] lini aksesori (buka/tutup, tier, harga) dan komisi App Store.
        var ecoBtn = e.target.closest('[data-eco-open],[data-eco-close],[data-eco-tier],[data-eco-price],[data-eco-commission]');
        if (ecoBtn) {
            e.preventDefault(); vibrate(6);
            var ecoDs = ecoBtn.dataset, ecoRes;
            if (ecoDs.ecoOpen) ecoRes = ecosystem.openLine(ecoDs.ecoOpen);
            else if (ecoDs.ecoClose) ecoRes = ecosystem.closeLine(ecoDs.ecoClose);
            else if (ecoDs.ecoTier) ecoRes = ecosystem.setTier(ecoDs.ecoTier, ecoDs.ecoVal);
            else if (ecoDs.ecoPrice) ecoRes = ecosystem.setPriceStep(ecoDs.ecoPrice, parseInt(ecoDs.ecoVal, 10));
            else ecoRes = ecosystem.setCommissionStep(parseInt(ecoDs.ecoVal, 10));
            var ecoMsg = ecoRes.reason === 'funds' ? tr('eco.toast.funds')
                : ecoRes.reason === 'locked' ? tr('eco.toast.locked', { year: ecoRes.year })
                : ecoRes.reason === 'lock' ? tr('eco.toast.lock', { n: Math.ceil(ecoRes.monthsLeft) })
                : ecoRes.reason === 'commit' ? tr('eco.toast.commit', { n: Math.ceil(ecoRes.monthsLeft) })
                : ecoRes.reason === 'unavailable' ? tr('eco.toast.unavailable')
                : tr('eco.toast.fail');
            if (ecoRes.ok) ToastService.success(tr('eco.toast.ok'));
            else ToastService.error(ecoMsg);
            renderAll();
            return;
        }
        // [Ekosistem] layanan berlangganan (Cloud, Asisten AI): buka/tutup, tier, harga.
        var svcBtn = e.target.closest('[data-eco-svc-open],[data-eco-svc-close],[data-eco-svc-tier],[data-eco-svc-price]');
        if (svcBtn) {
            e.preventDefault(); vibrate(6);
            var svcDs = svcBtn.dataset, svcRes;
            if (svcDs.ecoSvcOpen) svcRes = ecosystem.openService(svcDs.ecoSvcOpen);
            else if (svcDs.ecoSvcClose) svcRes = ecosystem.closeService(svcDs.ecoSvcClose);
            else if (svcDs.ecoSvcTier) svcRes = ecosystem.setServiceTier(svcDs.ecoSvcTier, svcDs.ecoVal);
            else svcRes = ecosystem.setServicePriceStep(svcDs.ecoSvcPrice, parseInt(svcDs.ecoVal, 10));
            var svcMsg = svcRes.reason === 'funds' ? tr('eco.toast.funds')
                : svcRes.reason === 'locked' ? tr('eco.toast.locked', { year: svcRes.year })
                : svcRes.reason === 'lock' ? tr('eco.toast.lock', { n: Math.ceil(svcRes.monthsLeft) })
                : svcRes.reason === 'commit' ? tr('eco.toast.commit', { n: Math.ceil(svcRes.monthsLeft) })
                : svcRes.reason === 'free' ? tr('eco.svc.toast.free')
                : svcRes.reason === 'unavailable' ? tr('eco.svc.toast.unavailable')
                : tr('eco.toast.fail');
            if (svcRes.ok) ToastService.success(tr('eco.svc.toast.ok'));
            else ToastService.error(svcMsg);
            renderAll();
            return;
        }
        // [Peninjauan App Store] setujui/tolak pengiriman developer, tinjauan manual, insiden, blokir, kebijakan.
        var asrBtn = e.target.closest('[data-asr-approve],[data-asr-reject],[data-asr-inspect],[data-asr-takedown],[data-asr-ban],[data-asr-unban],[data-asr-scan],[data-asr-fee],[data-asr-auto]');
        if (asrBtn) {
            e.preventDefault(); vibrate(6);
            var asrDs = asrBtn.dataset, asrRes, asrOk = null;
            if (asrDs.asrApprove) {
                asrRes = appReview.approve(parseInt(asrDs.asrApprove, 10));
                asrOk = asrRes.ok ? (asrRes.outcome === 'missed' ? tr('asr.toast.approvedRisk') : tr('asr.toast.approved')) : null;
            } else if (asrDs.asrReject) {
                asrRes = appReview.reject(parseInt(asrDs.asrReject, 10), asrDs.asrVal);
                asrOk = asrRes.ok ? tr('asr.toast.rejected') : null;
            } else if (asrDs.asrInspect) {
                asrRes = appReview.inspect(parseInt(asrDs.asrInspect, 10));
                asrOk = asrRes.ok ? (asrRes.found > 0 ? tr('asr.toast.inspectFound', { n: asrRes.found }) : tr('asr.toast.inspectClean')) : null;
            } else if (asrDs.asrTakedown) {
                asrRes = appReview.takedown(parseInt(asrDs.asrTakedown, 10));
                asrOk = asrRes.ok ? tr('asr.toast.takedown') : null;
            } else if (asrDs.asrBan) {
                asrRes = appReview.banDeveloper(asrDs.asrBan);
                asrOk = asrRes.ok ? (asrRes.justified ? tr('asr.toast.banned') : tr('asr.toast.bannedClean')) : null;
            } else if (asrDs.asrUnban) {
                asrRes = appReview.unbanDeveloper(asrDs.asrUnban);
                asrOk = asrRes.ok ? tr('asr.toast.unbanned') : null;
            } else if (asrDs.asrScan) {
                asrRes = appReview.setScan(asrDs.asrScan);
                asrOk = asrRes.ok ? tr('asr.toast.scan') : null;
            } else if (asrDs.asrFee) {
                asrRes = appReview.setFeeStep(parseInt(asrDs.asrVal, 10));
                asrOk = asrRes.ok ? tr('asr.toast.policy') : null;
            } else {
                asrRes = appReview.toggleAutoTrusted();
                asrOk = tr('asr.toast.policy');
            }
            if (asrOk) ToastService.success(asrOk);
            else if (asrRes && asrRes.reason !== 'same') {
                ToastService.error(asrRes.reason === 'funds' ? tr('asr.toast.funds')
                    : asrRes.reason === 'unavailable' ? tr('asr.toast.unavailable')
                    : tr('asr.toast.fail'));
            }
            renderAll();
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
            else { ToastService.success(tr('main.toast.response_sent')); Modal.close('viral-response', true); renderAll(); }
            return;
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); timeSystem.togglePause(); }
        if (e.key === 'f' || e.key === 'F') timeSystem.cycleSpeed();
    });
}

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

function _refreshFinishCost(kind, nodeId) {
    var btn = els.view.querySelector('[data-sil-research="finish"][data-kind="' + kind + '"][data-node-id="' + nodeId + '"]');
    if (!btn) return;
    var list = kind === 'chip' ? state.get().chipResearch.active : state.get().research.active;
    var entry = list.find(function (e) { return e.nodeId === nodeId; });
    if (!entry) return;
    var cost = SiliconService.researchFinishCost(entry);
    var b = btn.querySelector('b'); if (b) b.textContent = cost;
    if (SiliconService.canAfford(cost)) btn.removeAttribute('data-sil-short'); else btn.setAttribute('data-sil-short', '1');
}

function bindProgressEvents() {
    bus.on('research:progress', function (data) {
        if (activeView !== 'research' || activeSubtab !== 'tech') return;
        var slotsEl = els.view.querySelector('[data-research-slots]');
        if (slotsEl) slotsEl.textContent = data.active.length + '/' + data.maxSlots;
        data.active.forEach(function (r) {
            var pct = Math.round(r.percent * 100);
            var bar = els.view.querySelector('[data-research-bar="' + r.nodeId + '"]'); if (bar) bar.style.width = pct + '%';
            var pctEl = els.view.querySelector('[data-research-pct="' + r.nodeId + '"]'); if (pctEl) pctEl.textContent = pct + '%';
            var etaEl = els.view.querySelector('[data-research-eta="' + r.nodeId + '"]'); if (etaEl) etaEl.textContent = tr('main.eta_left', { n: Math.ceil(r.remainingDays) });
            _refreshFinishCost('tech', r.nodeId);
        });
    });
    bus.on('os:progress', function (data) {
        if (activeView !== 'research' || activeSubtab !== 'os') return;
        var pct = Math.round(data.percent * 100);
        var bar = els.view.querySelector('[data-os-dev-bar]'); if (bar) bar.style.width = pct + '%';
        var pctEl = els.view.querySelector('[data-os-dev-pct]'); if (pctEl) pctEl.textContent = pct + '%';
        var eta = els.view.querySelector('[data-os-dev-eta]'); if (eta) eta.textContent = tr('main.eta_left', { n: Math.ceil(data.remainingDays) });
    });
    bus.on('product:development-progress', function (data) {
        if (activeView !== 'products' || activeProdSubtab !== 'design') return;
        var phaseMap = { design: 'Desain', prototype: 'Prototipe', production: 'Produksi', released: 'Rilis' };
        var phaseEl = els.view.querySelector('[data-prod-dev-phase]'); if (phaseEl) phaseEl.textContent = phaseMap[data.phase] || data.phase;
        var pctEl = els.view.querySelector('[data-prod-dev-pct]'); if (pctEl) pctEl.textContent = data.percentOverall + '%';
        var barEl = els.view.querySelector('[data-prod-dev-bar]'); if (barEl) barEl.style.width = data.percentOverall + '%';
        var etaEl = els.view.querySelector('[data-prod-dev-eta]'); if (etaEl) etaEl.textContent = tr('main.eta_left', { n: data.remainingDays });
    });

    bus.on('chip-research:progress', function (data) {
        if (activeView !== 'research' || activeSubtab !== 'chip') return;
        var slotsEl = els.view.querySelector('[data-chip-research-slots]');
        if (slotsEl) slotsEl.textContent = data.active.length + '/' + data.maxSlots;
        data.active.forEach(function (r) {
            var pct = Math.round(r.percent * 100);
            var bar = els.view.querySelector('[data-chip-research-bar="' + r.nodeId + '"]'); if (bar) bar.style.width = pct + '%';
            var pctEl = els.view.querySelector('[data-chip-research-pct="' + r.nodeId + '"]'); if (pctEl) pctEl.textContent = pct + '%';
            var etaEl = els.view.querySelector('[data-chip-research-eta="' + r.nodeId + '"]'); if (etaEl) etaEl.textContent = tr('main.eta_left', { n: Math.ceil(r.remainingDays) });
            _refreshFinishCost('chip', r.nodeId);
        });
    });

    bus.on('research:started',   function () { if (activeView === 'research' && activeSubtab === 'tech') renderView({ soft: true }); });
    bus.on('research:completed', function () { if (activeView === 'research' && activeSubtab === 'tech') renderView({ soft: true }); });
    bus.on('research:cancelled', function () { if (activeView === 'research' && activeSubtab === 'tech') renderView({ soft: true }); });

    ['assembly:built', 'assembly:upgraded', 'assembly:hired', 'assembly:progress'].forEach(function (ev) {
        bus.on(ev, function () { if (activeView === 'research' && activeSubtab === 'manufaktur') renderView({ soft: true }); });
    });

    bus.on('chip-research:started',   function () { if (activeView === 'research' && activeSubtab === 'chip') renderView({ soft: true }); });
    bus.on('chip-research:completed', function () { if (activeView === 'research' && activeSubtab === 'chip') renderView({ soft: true }); });
    bus.on('chip-research:cancelled', function () { if (activeView === 'research' && activeSubtab === 'chip') renderView({ soft: true }); });

    // Pesanan produksi ponsel dibuat / tiba: segarkan Katalog (badge "dalam produksi", stok)
    // dan antrean Pabrik Perakitan. Tanpa ini tampilan tetap menampilkan produksi yang sudah selesai.
    ['product:production-ordered', 'product:production-arrived'].forEach(function (ev) {
        bus.on(ev, function () {
            if (activeView === 'products' || (activeView === 'research' && activeSubtab === 'manufaktur')) renderView({ soft: true });
        });
    });
    // Antrean perakitan: ETA & bar progres ikut berjalan tiap hari selama ada pesanan.
    bus.on('time:day-changed', function () {
        if (activeView !== 'research' || activeSubtab !== 'manufaktur') return;
        try { if (assemblySystem.getPendingOrders().length) renderView({ soft: true }); } catch (e) {}
    });

    bus.on('product:development-started',   function () { if (activeView === 'products') renderView({ soft: true }); });
    bus.on('product:released',              function () { if (activeView === 'products') renderView({ soft: true }); });
    bus.on('product:development-cancelled', function () { if (activeView === 'products') renderView({ soft: true }); });
}

function bindTimeEvents() {
    bus.on('time:tick', function () {
        var meta = els.header && els.header.querySelector('.header-meta');
        if (!meta) return;
        var snap = getTime();
        var hh = String(Math.floor(snap.currentHour)).padStart(2, '0');
        var mm = String(Math.floor(snap.currentMinute)).padStart(2, '0');
        var mKey = 'date.month.' + (snap.currentMonth || 1);
        var mShort = LanguageService.t(mKey);
        if (mShort === mKey) mShort = String(snap.currentMonth || 1);
        var d = meta.querySelector('[data-time-date]');
        if (d) d.textContent = LanguageService.t('header.day_prefix') + ' ' + snap.currentDay + ' ' + mShort + ' ' + snap.currentYear;
        var c = meta.querySelector('[data-time-clock]'); if (c) c.textContent = hh + ':' + mm;
        var s = meta.querySelector('[data-time-status]'); if (s) { s.textContent = snap.isPaused ? 'Paused' : (snap.gameSpeed + 'x'); s.classList.toggle('running', !snap.isPaused); }
    });
    bus.on('time:day-changed', function () { if (activeView === 'team' && activeHqSubtab === 'overview') updateDashboardLive(); });
    bus.on('time:speed-changed', function () { renderHeaderOnly(); });
}

function bindStateEvents() {
    bus.on('state:cash-changed', function (data) { animateCash(data.prev, data.next); });
    bus.on('state:log-changed', function () { if (activeView === 'team' && activeHqSubtab === 'overview') renderView({ soft: true }); });
    bus.on('state:milestone-added', function () { if (activeView === 'team' && activeHqSubtab === 'overview') renderView({ soft: true }); });
    bus.on('quest:completed', function (data) { ToastService.success(tr('main.toast.quest_done', { title: data.title })); notifVibrate(20, 'success'); });
    bus.on('quest:activated', function () { if (activeView === 'team' && activeHqSubtab === 'overview') renderView({ soft: true }); });
    bus.on('economy:warn-burnrate', function (data) {
        _burnWarn = data.monthsLeft;
        renderHeaderOnly();
        ToastService.warning(tr('main.toast.burn_warn', { n: data.monthsLeft }));
        notifVibrate(30, 'warning');
    });
    // [v2030] Peringatan runway: hanya saat level naik peringkat (dikirim dari EconomySystem).
    bus.on('economy:runway-low', function (data) {
        updateRunwayChip();
        var b = _runwayL('bln', 'mo');
        var n = Math.max(0, Math.floor(data.months));
        var msg = _runwayL(
            (data.level === 'danger' ? 'Runway kritis: kas cukup ~' : 'Runway menipis: kas cukup ~') + n + ' ' + b,
            (data.level === 'danger' ? 'Critical runway: cash lasts ~' : 'Runway low: cash lasts ~') + n + ' ' + b
        );
        if (data.level === 'danger') ToastService.error(msg); else ToastService.warning(msg);
        notifVibrate(30, 'warning');
    });
    bus.on('time:day-changed', updateRunwayChip);
    bus.on('state:cash-changed', updateRunwayChip);
    bus.on('economy:month-processed', updateRunwayChip);
    bus.on('team:changed', updateRunwayChip);
    bus.on('settings:take-loan', function (data) {
        var res = economy.takeLoan(data.loanId);
        if (!res.ok) ToastService.error(res.error);
        else { ToastService.success(tr('main.toast.loan_received')); renderView(); }
    });
    bus.on('settings:changed', function (settings) {
        if (settings && typeof settings.sound === 'boolean') {
            AudioService.setEnabled(settings.sound);
        }
    });
    bus.on('tutorial:restart', function () { tutorial.restart(); });
    bus.on('era:changed', function () { renderAll(); });
    bus.on('team:changed', function () { if (activeView === 'team') renderView({ soft: true }); });
    bus.on('team:recruited', function () { if (activeView === 'team') renderView({ soft: true }); });
    bus.on('team:fired', function () { if (activeView === 'team') renderView({ soft: true }); });

    function refreshRegionalView() {
        if ((activeView === 'market' && activeMarketSubtab === 'promo') ||
            (activeView === 'team' && activeHqSubtab === 'bank') ||
            activeView === 'settings') {
            renderView({ soft: true });
        }
    }
    bus.on('regional:ui', refreshRegionalView);
    bus.on('promo:changed', refreshRegionalView);
    bus.on('bank:changed', refreshRegionalView);
    bus.on('economy:month-processed', refreshRegionalView);
    bus.on('time:day-changed', function () {
        if (activeView === 'market' && activeMarketSubtab === 'promo') renderView({ soft: true });
    });

    bus.on('appreview:changed', function () {
        if (activeView === 'market' && activeMarketSubtab === 'appstore') renderView({ soft: true });
    });
    bus.on('lang:changed', function () { renderAll(); updateTitle(); });
    
    var _headerDebounce = null;
    function _debouncedRenderHeader() {
        if (_headerDebounce) return;
        _headerDebounce = requestAnimationFrame(function() {
            _headerDebounce = null;
            renderHeaderOnly();
        });
    }
    bus.on('silicon:changed', _debouncedRenderHeader);
    bus.on('silicon:display', _debouncedRenderHeader);

    (function () {
        function _cash(n) { return Number(n).toLocaleString('en-US'); }
        bus.on('wallet:paid-with-sil', function (p) {
            if (!p || !p.sil) return;
            ToastService.info(p.cash
                ? tr('main.wallet.paid_sil_cash', { sil: p.sil, cash: _cash(p.cash) })
                : tr('main.wallet.paid_sil', { sil: p.sil }));
        });
        bus.on('wallet:paid-with-cash', function (p) {
            if (!p || !p.cash) return;
            ToastService.info(tr('main.wallet.paid_cash', { cash: _cash(p.cash) }));
        });
        bus.on('wallet:rescue', function (p) {
            if (!p) return;
            ToastService.warning(tr('main.wallet.rescue', { sil: p.sil }));
        });
    })();

    bus.on('advisor:go', function (p) {
        if (!p || !p.nav) return;
        Modal.closeAll();
        if (p.subtab) {
            if (p.nav === 'research') activeSubtab = p.subtab;
            else if (p.nav === 'products') activeProdSubtab = p.subtab;
            else if (p.nav === 'market') activeMarketSubtab = p.subtab;
            else if (p.nav === 'team') activeHqSubtab = p.subtab;
        }
        if (p.nav === 'research' && p.subtab === 'manufaktur' && p.section) setManufactureSection(p.section);
        if (p.nav === 'team' && p.mode === 'recruit') setTeamMode('recruit');
        if (p.nav === activeView) renderView(); else navigate(p.nav);
        // Integrasi peta kantor <-> panel Team
        if (p.nav === 'team' && p.staffId) {
            if (p.subtab === 'team') openStaffDetailModal({ staffId: p.staffId });
        }
        // Peta kantor kini ada di Home (sakelar Kampus | Kantor), bukan di tab HQ.
        if (p.nav === 'dashboard' && p.officeStaffId) {
            focusOfficeStaff(p.officeStaffId);
            setTimeout(function () {
                var box = document.getElementById('campus-map');
                if (box) enterOffice(box);
            }, 0);
        }
    });

    // [era-event] Event pilihan 2000–2002: jeda game, tampilkan keputusan, kembalikan kecepatan setelah selesai.
    var _eraPausedByEvent = false;
    bus.on('eraevent:pending', function (data) {
        try {
            var def = data && data.event;
            if (!def) return;
            if (Modal.hasOpen()) { eraEvents.retryLater(); return; }   // jangan menimpa modal lain; dicoba lagi tiap hari game
            var wasRunning = !state.data.isPaused;
            var shown = openEraEventModal(def, {
                eraEvents: eraEvents,
                resumeIfRunning: function () {
                    if (Modal.isOpen('era-event')) return;      // ada event antrean berikutnya: tetap jeda
                    if (_eraPausedByEvent) { _eraPausedByEvent = false; if (state.data.isPaused) timeSystem.togglePause(); }
                }
            });
            if (shown && wasRunning) { _eraPausedByEvent = true; timeSystem.togglePause(); }
        } catch (err) {
            console.error('[main] eraevent:pending handler error:', err);
        }
    });
    // Coba lagi saat modal sebelumnya tertutup (event yang tertahan karena modal lain terbuka).
    bus.on('ui:modal-close', function () {
        try { if (eraEvents.getPending() && !Modal.hasOpen()) setTimeout(function () { if (!Modal.hasOpen()) eraEvents.reannounce(); }, 300); } catch (e) {}
    });

    // [annual-review] Rapor Tahunan + Target Dewan: jeda game, tampilkan rapor & pilihan fokus, kembalikan kecepatan setelah selesai.
    var _annualPausedByReview = false;
    bus.on('annual:pending', function (data) {
        try {
            var report = data && data.report;
            if (!report) return;
            if (Modal.hasOpen()) { annualReview.retryLater(); return; }   // jangan menimpa modal lain; dicoba lagi tiap hari game
            var wasRunning = !state.data.isPaused;
            var shown = openAnnualReviewModal(report, {
                annual: annualReview,
                resumeIfRunning: function () {
                    if (Modal.isOpen('annual-report') || Modal.isOpen('annual-focus')) return;
                    if (_annualPausedByReview) { _annualPausedByReview = false; if (state.data.isPaused) timeSystem.togglePause(); }
                }
            });
            if (shown && wasRunning) { _annualPausedByReview = true; timeSystem.togglePause(); }
        } catch (err) {
            console.error('[main] annual:pending handler error:', err);
        }
    });
    bus.on('ui:modal-close', function () {
        try { if (annualReview.getPending() && !Modal.hasOpen()) setTimeout(function () { if (!Modal.hasOpen()) annualReview.reannounce(); }, 300); } catch (e) {}
    });

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
            if (activeView === 'team' && activeHqSubtab === 'overview') renderView({ soft: true });
            if (activeView === 'dashboard') refreshHomeSlides();
            notifVibrate(15, 'news');
        } catch (err) {
            console.error('[main] news:published handler error:', err);
        }
    });

    function _refreshHomeIfActive() {
        if (activeView === 'dashboard') {
            try { refreshHomeSlides(); } catch (e) { console.error('[home] refresh error:', e); }
        }
    }

    bus.on('state:log-changed',      function () { _refreshHomeIfActive(); });
    bus.on('state:milestone-added',  function () { _refreshHomeIfActive(); });
    bus.on('quest:activated',        function () { _refreshHomeIfActive(); });
    bus.on('quest:completed',        function () { _refreshHomeIfActive(); });
    bus.on('research:started',       function () { _refreshHomeIfActive(); });
    bus.on('research:completed',     function () { _refreshHomeIfActive(); });
    bus.on('research:cancelled',     function () { _refreshHomeIfActive(); });
    bus.on('chip-research:started',   function () { _refreshHomeIfActive(); });
    bus.on('chip-research:completed', function () { _refreshHomeIfActive(); });
    bus.on('chip-research:cancelled', function () { _refreshHomeIfActive(); });
    bus.on('product:development-started',   function () { _refreshHomeIfActive(); });
    bus.on('product:released',              function () { _refreshHomeIfActive(); });
    bus.on('product:development-cancelled', function () { _refreshHomeIfActive(); });
}

async function boot() {
    try {
        splash(72);
        if (!els.header || !els.view || !els.nav) throw new Error('Elemen HTML utama tidak ditemukan.');
        ThemeService.init();
        LanguageService.init();
        AudioService.init();
        AudioService.setEnabled(!!state.get().settings.sound);
        mountToastContainer(els.toast);
        initTutorialOverlay();
        initMonthlySummary();
        initGameOverScreen();
        initSeasonEndScreen();
        splash(80);

        if (SaveService.hasSave()) {
            var saved = SaveService.load();
            if (saved) { state.hydrate(saved); console.info('[boot] Save dimuat.'); }
        } else {
            hideLoading();
            var onb = await showOnboarding();
            if (onb.cloudData && state.hydrate(onb.cloudData)) {
                SaveService.save(state);
                console.info('[boot] Progres dimuat dari cloud:', onb.companyName);
            } else {
                state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
                var mod = await import('./data/balance.data.js');
                var starting = mod.BALANCE.startingCash[onb.difficulty] || mod.BALANCE.startingCash.normal;
                state.setCash(starting);
                state.addMilestone('founded', 'Perusahaan ' + onb.companyName + ' didirikan.');
                state.addLog('Perusahaan ' + onb.companyName + ' didirikan.', 'success');
                SaveService.save(state);
            }
        }

        splash(88);

        if (!state.get().settings.competitorMode) state.get().settings.competitorMode = 'real';

        try {
            var dl = SiliconService.claimDailyLogin();
            if (dl && dl.ok) {
                ToastService.success(tr('main.toast.daily_login', { amount: dl.amount, streak: dl.streak }));
                console.info('[Silicon] Daily login +' + dl.amount + ' SIL, streak ' + dl.streak);
            } else if (dl && dl.reason === 'already_claimed') {
                console.info('[Silicon] Daily login sudah diklaim hari ini.');
            }
        } catch (e) {
            console.warn('[Silicon] Daily login gagal:', e);
        }

        eraSystem.start();
        seasonEnd.start();
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
        competitorActions.start();
        market.start();
        opinion.start();
        marketNav.start();
        chipSystem.start();
        fabSystem.start();
        componentPlants.start();
        assemblySystem.start();
        wholesaleSystem.start();
        initWholesaleNotifications(function () { return wholesaleSystem; });
        companyHistory.start();
        NewsSystem.start();
        eraEvents.start();
        annualReview.start();
        advisor.start();
        stockSystem.start();
        promotion.start();
        channels.start();
        afterSales.start();
ecosystem.start();
        appReview.start();
        bank.start();
        econBrakes.start();
        bindRegionalActions();
        mountAdvisorButton(advisor);
        splash(96);

        try {
            CloudService.registerAdapter(SupabaseAdapter);
            CloudSync.init(state);
            InboxService.init();
            bindCloudUI();
            
            setTimeout(function() { 
                if (CloudSync && typeof CloudSync.syncSilicon === 'function') {
                    CloudSync.syncSilicon(); 
                }
            }, 1000);

            if (CloudService.getStatus() === 'connected') {
                console.info('[Cloud] Sudah masuk dari layar awal:', CloudService.getEmail());
            } else if (typeof SupabaseAdapter.hasStoredSession === 'function' && SupabaseAdapter.hasStoredSession()) {
                CloudService.restoreSession().then(function (r) {
                    if (r && r.ok) {
                        console.info('[Cloud] Sesi dipulihkan:', r.email || r.userId);
                        if (CloudSync && typeof CloudSync.syncSilicon === 'function') {
                            CloudSync.syncSilicon();
                        }
                    } else {
                        console.info('[Cloud] Tidak ada sesi tersimpan.');
                    }
                });
            } else {
                console.info('[Cloud] Adapter terdaftar (belum login).');
            }
        } catch (e) {
            console.warn('[Cloud] Init gagal:', e);
        }

        window.__game = {
            ecosystem: ecosystem,
            appReview: appReview,
            report: function (opts) { return buildReport(state.get(), window.__game, opts || {}); },
            reportText: function (opts) { return formatReportText(buildReport(state.get(), window.__game, opts || {})); },
            reportShow: function () { openDiagnosticModal(); },
            cloud: CloudService,
            cloudSync: CloudSync,
            forcePull: function() { return CloudSync.forcePull(); },
            state: state, bus: bus, timeSystem: timeSystem, economy: economy, quests: quests, eraEvents: eraEvents, annual: annualReview, tutorial: tutorial,
            research: research, chipResearch: chipResearch, os: os, products: products, market: market, competitors: competitors, opinion: opinion, marketNav: marketNav, eraSystem: eraSystem, teamSystem: teamSystem,
            chips: chipSystem, fab: fabSystem, plants: componentPlants, assembly: assemblySystem, news: NewsSystem, advisor: advisor, stocks: stockSystem, ThemeService: ThemeService,
            silicon: SiliconService, promotion: promotion, channels: channels, afterSales: afterSales, bank: bank, econ: econBrakes, payment: PaymentService,
            openSiliconStore: openSiliconStoreModal, LanguageService: LanguageService,
            SaveService: SaveService, ToastService: ToastService, Modal: Modal, navigate: navigate, render: renderAll, renderSoft: renderSoft,
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
                setLang: function (id) { LanguageService.setLang(id); renderAll(); return { lang: id }; },
                setHqSubtab: function (id) { activeHqSubtab = id; renderAll(); return { subtab: id }; },
                setTeamMode: function (id) { setTeamMode(id); renderAll(); return { mode: id }; },
                unlockChipDesign: function () { ['chip_design_tool','chip_arch_arm_a','node_180','node_130','node_90','chip_isp_basic','chip_dvfs','fab_construction'].forEach(function (id) { research.completeResearch(id); chipResearch.completeResearch(id); }); return { ok: true }; },
                quickDesignChip: function (cfg) { return chipSystem.quickDesignChip(cfg); },
                buildFab: function (lvl) { return fabSystem.quickBuildFab(lvl || 1); },
                produceChips: function (chipId, qty) { var id = chipId || (state.get().chips.catalog[0] && state.get().chips.catalog[0].id); return fabSystem.orderProduction(id, qty || 1000); },
                testNews: function () { var a = NewsSystem.generateTestArticle(); if (a) bus.emit('news:published', { article: a }); return a; },
                addSilicon: function (n) { return SiliconService.add(n, 'cheat'); },
                claimDaily: function () { return SiliconService.claimDailyLogin(); }
            }
        };

        if (!DEV_BUILD) { delete window.__game.cheat; }

        window.render = renderAll;
        window.navigate = navigate;
        window.renderAll = renderAll;

        renderAll();
        bindGlobalClicks();
        bindTimeEvents();
        bindStateEvents();
        bindProgressEvents();
        initAdvisorChat(); // <-- INISIALISASI CHAT ADVISOR
        updateTitle();

        timeSystem.start();
        SaveService.startAutoSave(function () { return state; });

        window.addEventListener('resize', function () { updateNavSlider(false); });
        window.addEventListener('orientationchange', function () { setTimeout(function () { updateNavSlider(false); }, 200); });

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
                if (activeView === 'team')     return activeHqSubtab;
                return null;
            },
            setSubtab: function (id, direction) {
                if (activeView === 'research') activeSubtab = id;
                else if (activeView === 'products') activeProdSubtab = id;
                else if (activeView === 'market')   activeMarketSubtab = id;
                else if (activeView === 'team')     activeHqSubtab = id;
                renderView();
                showSwipeAnimation(direction);
            }
        });

        if (window.history && window.history.pushState) {
            history.pushState({ game: true }, document.title);
        }
        
        window.addEventListener('popstate', function(e) {
            var openModal = document.querySelector('[data-modal-id]');
            if (openModal) {
                Modal.closeAll();
                history.pushState({ game: true }, document.title);
                return;
            }
            if (window.confirm("Yakin ingin keluar dari Smartphone Empire? Progres permainan akan disimpan.")) {
                if (window.__game && window.__game.SaveService) {
                    window.__game.SaveService.save(window.__game.state);
                }
                window.history.back();
            } else {
                history.pushState({ game: true }, document.title);
            }
        });

        hideLoading();
        registerServiceWorker(); // Tahap 3A: setelah boot selesai, tidak menunda render pertama
        console.info('[' + APP_CONFIG.name + '] siap. Era: ' + state.get().era + ', Lang: ' + LanguageService.getLang() + ', SIL: ' + SiliconService.getBalance());
    } catch (err) {
        console.error('[boot] gagal:', err);
        hideLoading();
        if (els.error) { els.error.style.display = 'block'; els.error.textContent = 'Boot error: ' + err.message; }
    }
}

boot();
