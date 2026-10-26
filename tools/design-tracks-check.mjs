// Uji render kategori desain (Produk → Desain). Pakai: node tools/design-tracks-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { renderDesignTracks, setDesignTrack } = await load(root, 'ui/panels/DesignTracksPanel.js');
const { DESIGN_TRACKS, trackStage } = await load(root, 'data/design-tracks.data.js');
let fails = 0; const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
state.reset('normal');
for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);
  for (const year of [2000, 2012, 2018, 2024]) {
    for (const tr of DESIGN_TRACKS) {
      setDesignTrack(tr.id);
      const html = renderDesignTracks({ year, phoneHtml: '<div>PHONE</div>' });
      chk(html.includes('data-design-track') && html.length > 200, `${lang} ${year} ${tr.id} render`);
      chk(!/dt\.[a-z._]+/.test(html), `${lang} ${year} ${tr.id} no raw keys`);
      if (tr.id === 'phone') chk(html.includes('PHONE'), `${lang} ${year} phone card included`);
    }
  }
}
setDesignTrack('tablet');
chk(renderDesignTracks({ year: 2030, phoneHtml: '' }).includes('disabled'), 'tablet has disabled button');
console.log(fails ? `${fails} GAGAL` : 'SEMUA RENDER LULUS');
process.exit(fails ? 1 : 0);
