import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(8);
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { PublicOpinionSystem } = await load(root, 'systems/PublicOpinionSystem.js');
const fd = await load(root, 'data/feedback.data.js');
const panel = await load(root, 'ui/panels/PublicOpinionPanel.js');
state.reset('normal');
const op = new PublicOpinionSystem(state); op._onHydrated(); op.recomputeNow();
op.forceViral('negative'); op.forceViral('positive');
window.__game = { opinion: op, state, LanguageService, modules: { feedbackData: fd } };
let bad = 0;
for (const lang of ['id','en']) {
  LanguageService.setLang(lang);
  let html = '';
  try { html = panel.renderPublicOpinionPanel({ opinionSystem: op, state: state.data, onOpenViral(){}, ...{} }); } catch (e) { console.log(lang,'RENDER ERROR',e.message); bad++; continue; }
  const raw = (html.match(/\b(opinion|market|promo|region|season)\.[a-z_.0-9]+/g) || []);
  const issues = [];
  if (/undefined|NaN|\[object/.test(html)) issues.push('undefined/NaN/[object]');
  if (raw.length) issues.push('kunci mentah: ' + [...new Set(raw)].slice(0,6).join(','));
  for (const w of ['Layar','Display','Konektivitas','Connectivity','Kemudahan Pakai','Usability']) if (html.includes(w)) issues.push('+'+w);
  console.log(lang, 'panel len', html.length, issues.join(' | ') || 'bersih');
  if (issues.some(i=>!i.startsWith('+'))) bad++;
}
// modal respons (EN & ID)
for (const lang of ['id','en']) {
  LanguageService.setLang(lang);
  let captured='';
  const origOpen = (await load(root,'ui/modal.js')).Modal;
  try { origOpen.open = (a,h)=>{ captured=(h||a); }; window.__game.Modal = origOpen; } catch(e){}
  try { panel.openViralResponseModal({ viralId:'x' }); } catch(e){ console.log(lang,'modal error',e.message); }
  console.log(lang,'MODAL>',String(captured).replace(/<[^>]+>/g,' / ').replace(/(\s*\/\s*)+/g,' / ').slice(0,500)); console.log(lang,'modal',captured? ((/Open Q&A|Sesi Tanya/.test(captured)?'respons baru tampil':'tanpa respons baru')+(lang==='en'&&/Permintaan Maaf/.test(captured)?' | MASIH ID':'')) : '(tak tertangkap)');
}
console.log('bad',bad);
