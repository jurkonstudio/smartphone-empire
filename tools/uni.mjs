import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(7);
const { state } = await load(root, 'core/GameState.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
state.reset('normal');
const nav = new MarketNavSystem(state); nav._ensure();
let n=0, sum=0, mn=9, mx=0, bad=0; const byS={};
for (let y=2000;y<=2028;y++) for (const m of [1,6,11]) {
  state.data.time.currentYear=y; state.data.time.currentMonth=m; state.data.time.currentDay=15; nav._ctxKey=null;
  const ctx = nav._context();
  for (const s of [30,45,60,75,90]) for (const pm of [0.4,0.7,1,1.5,2.5]) {
    const st={}; for (const k of ['display','camera','battery','performance','connectivity','design','usability','quality','qualityScore']) st[k]=s;
    const f = nav.estimateFactor(st, ctx.priceRef*pm, null);
    if(!isFinite(f)) bad++; n++; sum+=f; mn=Math.min(mn,f); mx=Math.max(mx,f);
    (byS[s]=byS[s]||[]).push(f);
  }
}
console.log('n',n,'bad',bad,'mean',(sum/n).toFixed(3),'min',mn.toFixed(3),'max',mx.toFixed(3));
for (const s in byS){const a=byS[s]; console.log('stat',s,'mean',(a.reduce((x,y)=>x+y,0)/a.length).toFixed(3),'min',Math.min(...a).toFixed(3),'max',Math.max(...a).toFixed(3));}
