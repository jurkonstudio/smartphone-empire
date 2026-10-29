// Uji geometri: apron di daratan, dermaga & kapal di laut, petak pabrik di daratan, jembatan (th=0) tidak bergeser.
import fs from 'node:fs';
function coastOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const block = src.slice(src.indexOf('var ISLAND ='), src.indexOf('var ZC ='));
  return new Function(block + '; return { coastR, onIsland };')();
}
const { coastR, onIsland } = coastOf('src/ui/manufacture/ManufactureScene.js');
const orig = coastOf('../proj-orig/src/ui/manufacture/ManufactureScene.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const land = (x, z) => onIsland(x, z, 0);
ok([[12.2,9.6],[17.6,9.6],[17.6,11.4],[12.2,11.4]].every(([x,z]) => land(x,z)), 'apron seluruhnya di daratan');
ok(land(14.7, 11.2) && land(14.0, 11.4), 'pangkal dermaga di darat (dekat apron)');
ok(!land(14.0, 19.5) && !land(15.4, 19.5), 'ujung dermaga di laut');
const ship = [[16.0,15.1],[17.2,15.1],[17.2,18.9],[16.0,18.9]];
ok(ship.every(([x,z]) => !land(x,z)), 'kapal seluruhnya di laut');
ok(ship.every(([x]) => x > 15.4), 'kapal tidak menabrak dermaga');
const plots = { fab:[0,-5.2,14,6.4], soc:[-12,-5.2,7,6], ram:[12,-5.2,7,6], display:[-4,5.2,7,6], camera:[4,5.2,7,6], battery:[-12,5.2,7,6], hub:[12,5.2,7,6], assembly:[-4.5,14,22,9] };
for (const [k,[cx,cz,w,d]] of Object.entries(plots)) {
  ok([[cx-w/2,cz-d/2],[cx+w/2,cz-d/2],[cx+w/2,cz+d/2],[cx-w/2,cz+d/2]].every(([x,z]) => land(x,z)), 'petak ' + k + ' di daratan');
}
ok(land(-16.6,-4.0) && land(-16.6,0) && land(-17.3,8.95) && land(12.2,8.95), 'ujung-ujung jalan di daratan');
// jembatan memakai garis pantai di th = 0 (mfCoastR di IslandLink): harus sama dengan versi lama
const same = [0, 0.3, -0.4, Math.PI, -Math.PI/2 + 0.01].every(th => Math.abs(coastR(th) - orig.coastR(th)) < 1e-12 || Math.sin(th) > 0);
ok(Math.abs(coastR(0) - orig.coastR(0)) < 1e-12, 'garis pantai th=0 identik dengan versi lama (jembatan tidak bergeser)');
ok([-0.4, Math.PI, -1.2, -2.5].every(th => Math.abs(coastR(th) - orig.coastR(th)) < 1e-12), 'sisi utara & barat tidak berubah');
ok(coastR(0.8) > orig.coastR(0.8), 'lobe tenggara memperlebar daratan (' + orig.coastR(0.8).toFixed(2) + ' -> ' + coastR(0.8).toFixed(2) + ')');
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
