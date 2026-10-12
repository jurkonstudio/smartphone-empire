// FILE: src/main.js — BAGIAN 1
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
import { ChipSystem } from './systems/ChipSystem.js';
import { FabSystem } from './systems/FabSystem.js';

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
const chipSystem  = new ChipSystem(state);
const fabSystem   = new FabSystem(state);

market.setCompetitorSystem(competitors);

// Force-hide loading screen
const _ls = document.getElementById('loading-screen');
if (_ls) _ls.style.display = 'none';

window.__game = {
    state, bus, timeSystem, economy, quests, tutorial,
    research, os, products, market, competitors, opinion, eraSystem, teamSystem,
    chips: chipSystem, fab: fabSystem, ThemeService,
    SaveService, ToastService, navigate: function(){}, render: function(){}
};

console.log('[main.js] Partial load OK — semua system instantiated');
