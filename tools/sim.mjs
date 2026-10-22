import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(5);
const { state } = await load(root, 'core/GameState.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const { getMacro } = await load(root, 'core/MacroModel.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
state.reset('normal');
const ps = new ProductSystem(state);
const nav = new MarketNavSystem(state); nav._ensure();
const mk = (id, s, price, spread) => ({ id, status:'selling', config:{formFactorId:'ff_bar'}, price,
  stats: { display:s+(spread?10:0), camera:s+(spread?15:0), battery:s-(spread?10:0), performance:s+(spread?5:0), connectivity:s, design:s-(spread?5:0), usability:s, quality:s, qualityScore:s },
  releaseGameMinute: state.data.time.elapsedGameMinutes||0, noiseState:0, competitorPressure:0 });
function demand(p){ p.noiseState=0; seedRandom(99); return ps._computeDailyDemand(p); }
let worst=0, nan=0, rows=[];
const ratios=[];
for (let y=2000;y<=2026;y+=2) {
  const t=state.data.time; t.currentYear=y; t.currentMonth=6; t.currentDay=15; nav._ctxKey=null;
  const macro=getMacro(t,BALANCE.macro);
  for (const s of [40,60,80]) for (const spread of [false,true]) {
    const p=mk('p'+y+s+spread,s,macro.priceRef*Math.pow(s/50,1.3),spread);
    ps._nav=null; const a=demand(p);
    ps._nav=nav; const b=demand(p);
    if(!isFinite(b)||!isFinite(a)) nan++;
    const r=a>0?b/a:1; ratios.push(r); worst=Math.max(worst,Math.abs(r-1));
  }
  rows.push([y, ratios.slice(-6).map(r=>r.toFixed(2)).join(' ')]);
}
console.log('NaN/Inf:',nan,' worst |ratio-1|:',worst.toFixed(3));
console.log('mean ratio',(ratios.reduce((x,y)=>x+y,0)/ratios.length).toFixed(3),'min',Math.min(...ratios).toFixed(2),'max',Math.max(...ratios).toFixed(2));
rows.forEach(r=>console.log(r[0],r[1]));
// perilaku viral
const t=state.data.time; t.currentYear=2015; nav._ctxKey=null;
const macro=getMacro(t,BALANCE.macro);
const p=mk('pv',60,macro.priceRef*Math.pow(60/50,1.3),false);
ps._nav=nav; const base=demand(p);
state.data.feedback = state.data.feedback||{}; state.data.feedback.activeViral=[{id:'v1',productId:'pv',effects:{dailyDemandBoost:0.25,durationDays:5}}];
const up=demand(p);
state.data.feedback.activeViral=[{id:'v2',productId:'pv',effects:{dailyDemandBoost:-0.25,durationDays:5}}];
const down=demand(p);
state.data.feedback.activeViral=[{id:'v3',productId:'other',effects:{dailyDemandBoost:0.9}}];
const other=demand(p);
state.data.feedback.activeViral=[{id:'v4',productId:'pv',effects:{dailyDemandBoost:5}}]; const huge=demand(p);
state.data.feedback.activeViral=[{id:'v5',productId:'pv',effects:{dailyDemandBoost:-5}}]; const tiny=demand(p);
console.log('viral base',base,'+25%',up,'-25%',down,'produk lain',other,'ekstrem+',huge,'ekstrem-',tiny);
