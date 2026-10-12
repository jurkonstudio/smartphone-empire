// FILE: src/main.js — DIAGNOSTIK BOOT SEQUENCE
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:11px monospace;padding:16px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.6;';
log.textContent = 'BOOT SEQUENCE TEST...\n\n';
document.body.appendChild(log);
const ls = document.getElementById('loading-screen');
if (ls) ls.style.display = 'none';

function ok(m)  { log.textContent += 'OK    ' + m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m) { log.textContent += 'X     ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', function (e) { err('Global: ' + (e.message || e.error)); });

(async function () {
    try {
        ok('1. Import core & services');
        const { ThemeService } = await import('./core/ThemeService.js');
        const { state } = await import('./core/GameState.js');
        const { TimeSystem } = await import('./core/TimeSystem.js');
        const { bus } = await import('./core/EventBus.js');

        ok('2. Import semua systems');
        const { EconomySystem }   = await import('./systems/EconomySystem.js');
        const { QuestSystem }     = await import('./systems/QuestSystem.js');
        const { TutorialSystem }  = await import('./systems/TutorialSystem.js');
        const { ResearchSystem }  = await import('./systems/ResearchSystem.js');
        const { OSSystem }        = await import('./systems/OSSystem.js');
        const { ProductSystem }   = await import('./systems/ProductSystem.js');
        const { MarketSystem }    = await import('./systems/MarketSystem.js');
        const { CompetitorSystem }= await import('./systems/CompetitorSystem.js');
        const { PublicOpinionSystem } = await import('./systems/PublicOpinionSystem.js');
        const { EraSystem }       = await import('./systems/EraSystem.js');
        const { TeamSystem }      = await import('./systems/TeamSystem.js');
        const { ChipSystem }      = await import('./systems/ChipSystem.js');
        const { FabSystem }       = await import('./systems/FabSystem.js');

        ok('3. Instantiate TimeSystem');
        const timeSystem = new TimeSystem(state);

        ok('4. Instantiate EconomySystem');
        const economy = new EconomySystem(state);

        ok('5. Instantiate QuestSystem');
        const quests = new QuestSystem(state);

        ok('6. Instantiate TutorialSystem');
        const tutorial = new TutorialSystem(state);

        ok('7. Instantiate ResearchSystem');
        const research = new ResearchSystem(state);

        ok('8. Instantiate OSSystem');
        const os = new OSSystem(state);

        ok('9. Instantiate ProductSystem');
        const products = new ProductSystem(state);

        ok('10. Instantiate MarketSystem');
        const market = new MarketSystem(state);

        ok('11. Instantiate CompetitorSystem');
        const competitors = new CompetitorSystem(state);

        ok('12. Instantiate PublicOpinionSystem');
        const opinion = new PublicOpinionSystem(state);

        ok('13. Instantiate EraSystem');
        const eraSystem = new EraSystem(state);

        ok('14. Instantiate TeamSystem');
        const teamSystem = new TeamSystem(state);

        ok('15. Instantiate ChipSystem');
        const chipSystem = new ChipSystem(state);

        ok('16. Instantiate FabSystem');
        const fabSystem = new FabSystem(state);

        ok('17. market.setCompetitorSystem');
        market.setCompetitorSystem(competitors);

        ok('18. eraSystem.start()');
        eraSystem.start();

        ok('19. economy.start()');
        economy.start();

        ok('20. quests.start()');
        quests.start();

        ok('21. tutorial.start()');
        tutorial.start();

        ok('22. teamSystem.start()');
        teamSystem.start();

        ok('23. Cek candidates');
        ok('    candidates.length = ' + (state.get().candidates || []).length);

        ok('24. research.start()');
        research.start();

        ok('25. os.start()');
        os.start();

        ok('26. products.start()');
        products.start();

        ok('27. competitors.start()');
        competitors.start();

        ok('28. market.start()');
        market.start();

        ok('29. opinion.start()');
        opinion.start();

        ok('30. chipSystem.start()');
        chipSystem.start();

        ok('31. fabSystem.start()');
        fabSystem.start();

        ok('32. renderHeader');
        const { renderHeader } = await import('./ui/layout/Header.js');
        const headerHtml = renderHeader({ state: state.get(), timeSnapshot: timeSystem.snapshot(), warning: null });
        ok('    header length: ' + headerHtml.length);

        ok('33. renderMobileNav');
        const { renderMobileNav } = await import('./ui/layout/MobileNav.js');
        const navHtml = renderMobileNav({ active: 'dashboard' });
        ok('    nav length: ' + navHtml.length);

        ok('34. renderDashboard');
        const { renderDashboard } = await import('./ui/panels/DashboardPanel.js');
        const dashHtml = renderDashboard(state.get(), timeSystem.snapshot(), research, teamSystem);
        ok('    dashboard length: ' + dashHtml.length);

        ok('35. renderProductPanel — tab design');
        const { renderProductPanel } = await import('./ui/panels/ProductPanel.js');
        const prodHtml = renderProductPanel({ subtab: 'design', productSystem: products, researchSystem: research, osSystem: os });
        ok('    product length: ' + prodHtml.length);

        ok('36. renderProductPanel — tab chip');
        try {
            const chipHtml = renderProductPanel({ subtab: 'chip', productSystem: products, researchSystem: research, osSystem: os });
            ok('    chip tab length: ' + chipHtml.length);
        } catch (chipErr) {
            err('    CHIP TAB CRASH: ' + chipErr.message);
        }

        ok('37. renderTeamPanel — tab active');
        const { renderTeamPanel } = await import('./ui/panels/TeamPanel.js');
        const teamHtml = renderTeamPanel({ subtab: 'active', teamSystem });
        ok('    team length: ' + teamHtml.length);

        ok('38. renderTeamPanel — tab recruit');
        try {
            const recHtml = renderTeamPanel({ subtab: 'recruit', teamSystem });
            ok('    recruit tab length: ' + recHtml.length);
        } catch (recErr) {
            err('    RECRUIT TAB CRASH: ' + recErr.message);
        }

        log.textContent += '\n✅✅✅ BOOT SEQUENCE LOLOS ✅✅✅\n';
        log.textContent += '\nSemua step berhasil. Kemungkinan issue di bindEvents / timeSystem.start / renderAll final.\n';

    } catch (e) {
        err('===========================================');
        err('GAGAL DI STEP DI ATAS');
        err('Error: ' + (e.message || 'unknown'));
        err('Stack:');
        if (e.stack) {
            e.stack.split('\n').slice(0, 6).forEach(line => err('  ' + line));
        }
        err('===========================================');
    }
})();
