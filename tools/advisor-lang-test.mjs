// Tes pemahaman input Asisten di 12 bahasa. Jalankan dari akar repo: node tools/advisor-lang-test.mjs
import { stubBrowser, load } from './boot.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
stubBrowser();
const { AdvisorBrain } = await load(ROOT, 'src/systems/AdvisorBrain.js');

// Kasus: [intent yang diharapkan, {bahasa: kalimat}]
const CASES = [
  ['cash', { id: 'berapa uang saya sekarang', en: 'how much money do I have', de: 'wie viel Geld habe ich', es: '¿cuánto dinero tengo?', fr: "combien d'argent j'ai ?", it: 'quanti soldi ho?', pl: 'ile mam pieniędzy?', ru: 'сколько у меня денег?', hi: 'मेरे पास कितने पैसे हैं', ja: 'お金はいくらありますか', ko: '돈이 얼마나 있어요?', zh: '我现在有多少钱' }],
  ['loan', { id: 'cek pinjaman saya', en: 'check my loans', de: 'wie stehen meine Kredite', es: 'revisa mis préstamos', fr: 'vérifie mes prêts', it: 'controlla i miei prestiti', pl: 'sprawdź moje pożyczki', ru: 'проверь мои кредиты', hi: 'मेरा लोन चेक करो', ja: 'ローンを確認して', ko: '대출 확인해줘', zh: '检查我的贷款' }],
  ['forecast', { id: 'kapan uang saya habis', en: 'when will my cash run out', de: 'wann ist mein Geld aufgebraucht', es: '¿cuándo se me acaba el dinero?', fr: "quand est-ce que l'argent va s'épuiser", it: 'quando finiscono i soldi', pl: 'kiedy skończą mi się pieniądze', ru: 'когда закончатся деньги', hi: 'मेरे पैसे कब खत्म होंगे', ja: 'お金はいつなくなりますか', ko: '돈이 언제 떨어져요', zh: '我的钱什么时候用完' }],
  ['price', { id: 'cek harga dan margin', en: 'check price and margin', de: 'prüfe Preis und Marge', es: 'revisa precio y margen', fr: 'vérifie le prix et la marge', it: 'controlla prezzo e margine', pl: 'sprawdź cenę i marżę', ru: 'проверь цену и маржу', hi: 'कीमत और मार्जिन देखो', ja: '価格とマージンを確認', ko: '가격과 마진 확인', zh: '检查价格和利润率' }],
  ['team', { id: 'bagaimana kondisi tim saya', en: 'how is my team doing', de: 'wie geht es meinem Team', es: 'cómo está mi equipo', fr: 'comment va mon équipe', it: 'come sta il mio team', pl: 'jak się ma mój zespół', ru: 'как моя команда', hi: 'मेरी टीम कैसी है', ja: 'チームの状況は', ko: '팀 상태는 어때요', zh: '我的团队怎么样' }],
  ['competitor', { id: 'siapa pesaing saya', en: 'who are my competitors', de: 'wer sind meine Konkurrenten', es: 'quiénes son mis competidores', fr: 'qui sont mes concurrents', it: 'chi sono i miei concorrenti', pl: 'kim są moi konkurenci', ru: 'кто мои конкуренты', hi: 'मेरे प्रतियोगी कौन हैं', ja: '競合はどこですか', ko: '경쟁사가 누구예요', zh: '我的竞争对手是谁' }],
  ['research', { id: 'riset saya', en: 'my research', de: 'meine Forschung', es: 'mi investigación', fr: 'ma recherche', it: 'la mia ricerca', pl: 'moje badania', ru: 'мои исследования', hi: 'मेरी रिसर्च', ja: '研究の状況', ko: '연구 상태', zh: '我的研究' }],
  ['health', { id: 'berapa skor kesehatan bisnis saya', en: 'what is my health score', de: 'wie ist mein Gesundheitswert', es: 'cuál es mi puntuación de salud', fr: 'quel est mon score de santé', it: 'qual è il mio punteggio di salute', pl: 'jaki jest mój wynik zdrowia', ru: 'какая у меня оценка здоровья', hi: 'मेरा हेल्थ स्कोर क्या है', ja: 'ヘルススコアはいくつ', ko: '건강 점수가 몇 점이에요', zh: '我的健康评分是多少' }],
  ['whatif', { id: 'kalau rekrut 2 engineer?', en: 'what if I hire 2 engineers', de: 'was wäre wenn ich 2 Ingenieure einstelle', es: 'qué pasaría si contrato 2 ingenieros', fr: "et si j'embauche 2 ingénieurs", it: 'e se assumo 2 ingegneri', pl: 'co jeśli zatrudnię 2 inżynierów', ru: 'что если я найму 2 инженеров', hi: 'अगर मैं 2 इंजीनियर भर्ती करूं तो', ja: 'もしエンジニアを2人雇ったら', ko: '엔지니어 2명 고용하면 어떻게 돼요', zh: '如果招2个工程师会怎样' }],
  ['patch', { id: 'ada update baru?', en: 'is there a new update', de: 'gibt es ein neues Update', es: 'hay una actualización nueva', fr: 'y a-t-il une mise à jour', it: "c'è un nuovo aggiornamento", pl: 'czy jest nowa aktualizacja', ru: 'есть ли новое обновление', hi: 'क्या कोई नया अपडेट है', ja: '新しいアップデートはありますか', ko: '새 업데이트 있어요', zh: '有新的更新吗' }],
  ['bug', { id: 'game saya error', en: 'my game has an error', de: 'mein Spiel hat einen Fehler', es: 'mi juego tiene un error', fr: 'mon jeu a une erreur', it: 'il mio gioco ha un errore', pl: 'moja gra ma błąd', ru: 'в моей игре ошибка', hi: 'मेरे गेम में एरर है', ja: 'ゲームにエラーが出ます', ko: '게임에 오류가 있어요', zh: '我的游戏出错了' }],
  ['stock', { id: 'cek stok produk', en: 'check product stock', de: 'prüfe den Lagerbestand', es: 'revisa el inventario', fr: "vérifie l'inventaire", it: 'controlla il magazzino', pl: 'sprawdź magazyn', ru: 'проверь склад', hi: 'स्टॉक चेक करो', ja: '在庫を確認して', ko: '재고 확인해줘', zh: '检查库存' }],
  ['clear', { id: 'bersihkan chat', en: 'clear chat', de: 'Chat löschen', es: 'borrar chat', fr: 'effacer le chat', it: 'cancella chat', pl: 'wyczyść czat', ru: 'очисти чат', hi: 'चैट साफ करो', ja: 'チャットを消して', ko: '채팅 지워줘', zh: '清除聊天' }],
  ['nav', { id: 'buka riset', en: 'open research', de: 'öffne Forschung', es: 'abre investigación', fr: 'ouvre recherche', it: 'apri ricerca', pl: 'otwórz badania', ru: 'открой исследования', hi: 'रिसर्च खोलो', ja: '研究を開いて', ko: '연구 열어줘', zh: '打开研究' }],
  ['status', { id: 'bagaimana kondisi bisnis saya', en: 'how is my business', de: 'wie steht mein Unternehmen', es: 'cómo está mi empresa', fr: 'comment va mon entreprise', it: 'come sta la mia azienda', pl: 'jak się ma moja firma', ru: 'как дела в моей компании', hi: 'मेरी कंपनी की स्थिति कैसी है', ja: '会社の状況は', ko: '회사 상태는 어때요', zh: '我的公司情况怎么样' }],
  ['next', { id: 'apa prioritas saya', en: 'what is my top priority', de: 'was ist meine Priorität', es: 'cuál es mi prioridad', fr: 'quelle est ma priorité', it: 'qual è la mia priorità', pl: 'jaki jest mój priorytet', ru: 'какой у меня приоритет', hi: 'मेरी प्राथमिकता क्या है', ja: '優先事項は何ですか', ko: '우선순위가 뭐예요', zh: '我的优先事项是什么' }],
  ['greet', { id: 'halo', en: 'hello', de: 'Hallo', es: 'hola', fr: 'bonjour', it: 'ciao', pl: 'cześć', ru: 'привет', hi: 'नमस्ते', ja: 'こんにちは', ko: '안녕하세요', zh: '你好' }]
];

const { AdvisorSystem } = await load(ROOT, 'src/systems/AdvisorSystem.js');
function makeState() {
  return { data: { cash: 500000, difficulty: 'normal', staff: [], team: { engineers: 1, designers: 1, marketers: 1 },
    products: { catalog: [{ id: 'p1', name: 'Nova X', status: 'selling', stock: 40, baseCapacity: 100, price: 500, unitCost: 300, totalSold: 10, releaseGameMinute: 0 }], designing: null, development: null },
    time: { elapsedGameMinutes: 1440 * 5, currentYear: 2026, currentMonth: 1, currentDay: 1 }, tutorial: { completed: true }, advisor: {} } };
}
function fakeSys(lang) {
  const sys = new AdvisorSystem(makeState(), {});
  sys._lang = () => (lang === 'id' ? 'id' : 'en');
  sys._gameLang = () => lang;
  return sys;
}

const LANGS = ['id', 'en', 'de', 'es', 'fr', 'it', 'pl', 'ru', 'hi', 'ja', 'ko', 'zh'];
let fails = 0, total = 0;
const failures = [];
for (const [want, byLang] of CASES) {
  for (const lang of LANGS) {
    const brain = fakeSys(lang).brain;
    let res;
    try { res = brain.reply(byLang[lang]); } catch (e) { res = { intent: 'ERR:' + e.message }; }
    let got = res.intent || (res.clearChat ? 'clear' : (res.actions && res.actions[0] && res.actions[0].nav ? 'nav' : '?'));
    if (res.clearChat) got = 'clear';
    if (res.intent === 'navigate') got = 'nav';
    total++;
    if (got !== want) { fails++; failures.push(`${want} [${lang}] "${byLang[lang]}" -> ${got}`); }
  }
}
failures.forEach(f => console.log('GAGAL ' + f));
console.log(`\n${total - fails}/${total} lulus`);
process.exit(fails ? 1 : 0);
