// FILE: src/systems/AdvisorLexicon.js
// v2029.1 — Pemahaman input Asisten untuk 12 bahasa game.
// Cara kerja: teks pemain dinormalisasi (aman untuk semua aksara), bahasanya dideteksi,
// lalu kata/frasa bahasa itu diterjemahkan ke bentuk "kanonis" (kata Inggris/Indonesia yang
// sudah dipahami AdvisorBrain). Seluruh logika intent yang ada dipakai ulang tanpa diubah.
// Catatan: kamus ditulis tanpa penutur asli; mohon dicek, terutama ja/ko/zh/hi.

// ------------------------------------------------------------
// Normalisasi teks aman semua aksara
// ------------------------------------------------------------
var LATIN_FIX = { 'ł': 'l', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'đ': 'd', 'ı': 'i' };

export function normText(s) {
    var t = String(s || '').normalize('NFKC').toLowerCase();
    t = t.replace(/[\u00C0-\u024F\u1E00-\u1EFF]/g, function (ch) {
        if (LATIN_FIX[ch]) return LATIN_FIX[ch];
        return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    });
    t = t.replace(/ё/g, 'е');
    t = t.replace(/[^\p{L}\p{N}\p{M}\s$%]/gu, ' ');
    return t.replace(/\s+/g, ' ').trim();
}

var RE_KANA = /[\u3040-\u30ff]/;
var RE_HANGUL = /[\uac00-\ud7af\u1100-\u11ff]/;
var RE_HAN = /[\u4e00-\u9fff]/;
var RE_DEVA = /[\u0900-\u097f]/;
var RE_CYR = /[\u0400-\u04ff]/;

export function isUnspaced(lang) { return lang === 'ja' || lang === 'zh' || lang === 'ko'; }

// ------------------------------------------------------------
// Deteksi bahasa yang diketik
// ------------------------------------------------------------
var STOP = {
    id: 'yang dan di ke dari untuk dengan saya aku kamu ini itu apa berapa kenapa bagaimana gimana bisa tidak nggak gak ada sudah akan mau lagi dong sih',
    en: 'the and is are what how why when can i my me you of to in for with do does it this that have has should will would',
    de: 'der die das und ist wie viel was warum wann kann ich mein meine du sie ein eine nicht mit fur von zu habe hat soll wird',
    es: 'el la los las y es que como cuanto cuanta por cual cuando puedo mi mis tu un una no con para de del tengo tiene debo',
    fr: 'le la les et est que quoi comment combien pourquoi quand puis je mon ma mes tu un une pas avec pour de du ai a dois',
    it: 'il lo la gli le e che come quanto quanti perche quando posso io mio mia miei un una non con per di del ho ha devo',
    pl: 'i w z na do jest to jak ile dlaczego kiedy moge mam moj moja nie czy sie co przez dla od ma powinienem'
};
var STOPSET = {};
Object.keys(STOP).forEach(function (k) { STOPSET[k] = {}; STOP[k].split(' ').forEach(function (w) { STOPSET[k][w] = 1; }); });

export function detectLang(text, gameLang) {
    var raw = String(text || '');
    if (RE_KANA.test(raw)) return 'ja';
    if (RE_HANGUL.test(raw)) return 'ko';
    if (RE_HAN.test(raw)) return gameLang === 'ja' ? 'ja' : 'zh';
    if (RE_DEVA.test(raw)) return 'hi';
    if (RE_CYR.test(raw)) return 'ru';
    var toks = normText(raw).split(' ');
    var best = null, bestS = 0, tie = false;
    Object.keys(STOPSET).forEach(function (k) {
        var s = 0;
        toks.forEach(function (t) { if (STOPSET[k][t]) s++; });
        if (k === gameLang) s += 0.5;
        if (s > bestS) { bestS = s; best = k; tie = false; } else if (s === bestS && s > 0) tie = true;
    });
    return bestS >= 1 ? best : null;
}

// ------------------------------------------------------------
// Bentuk kanonis tiap konsep (kata yang sudah dipahami AdvisorBrain)
// ------------------------------------------------------------
var CANON = {
    greet: 'hello', thanks: 'thanks', help: 'help', status: 'status', health: 'health score',
    priority: 'priority', plan: 'plan', cash: 'cash', loan: 'loan', forecast: 'forecast',
    trend: 'trend', research: 'research', team: 'team', hire: 'hire', fire: 'fire',
    engineer: 'engineer', designer: 'designer', marketer: 'marketer', product: 'product',
    price: 'price', stock: 'stok', campaign: 'campaign', os: 'os', chip: 'chip',
    morale: 'morale', reputation: 'reputation', competitor: 'competitor', market: 'market',
    whatif: 'what if', silicon: 'silicon', whatis: 'what is', why: 'why', bug: 'bug',
    update: 'update', version: 'version', game: 'game', app: 'app', open: 'open', show: 'show',
    clear: 'clear', chat: 'chat', newer: 'new', howmuch: 'how much', when: 'when', can: 'can',
    runout: 'habis', profit: 'profit', loss: 'rugi', income: 'income', cost: 'cost',
    salary: 'gaji', bankrupt: 'bankrupt', raise: 'raise', lower: 'lower', produce: 'produce',
    start: 'start', changed: 'what changed', sales: 'sales', sell: 'sell', more: 'more', yes: 'yes',
    unit: 'unit', margin: 'margin', discount: 'discount', now: 'now', first: 'first',
    second: 'second', third: 'third', fourth: 'fourth', number: 'number', audit: 'audit',
    risk: 'risk', scenario: 'scenario', and: 'and', all: 'all', must: 'should', error: 'error',
    broken: 'broken', not: 'not', works: 'work', employee: 'staff', fab: 'fab', rival: 'rival',
    boost: 'boost', increase: 'increase', decrease: 'decrease', report: 'report',
    snooze: 'snooze', explain: 'explain', k: 'k', m: 'm', percent: '%', raiseprice: 'raise price', lowerprice: 'lower price', set: 'set', exists: 'is there', business: 'business'
};

// ------------------------------------------------------------
// Kamus per bahasa. Spasi memisah sinonim. "_" = spasi dalam frasa.
// Akhiran "*" = cocok awalan (menangani infleksi). Aksara tanpa spasi (ja/zh/ko)
// dicocokkan sebagai substring dengan segmentasi terpanjang-dulu.
// ------------------------------------------------------------
var LEX = {
    de: {
        greet: 'hallo hi hey guten_morgen guten_tag guten_abend moin servus',
        thanks: 'danke* dank super klasse',
        help: 'hilfe hilf* funktionen was_kannst_du',
        status: 'zustand lage lagebericht ubersicht zusammenfassung bericht situation',
        health: 'gesundheit* gesundheitswert bewertung punktzahl schwachste* schwachstelle*',
        priority: 'prioritat* empfehlung* ratschlag tipp* naechste* nachste* dringend',
        plan: 'plan strategie* fahrplan anleitung',
        cash: 'geld* kasse bargeld kapital guthaben kontostand budget liquiditat',
        loan: 'kredit* darlehen* schulden schuld* zinsen zins rate* tilgung',
        forecast: 'prognose* vorhersage* voraussage hochrechnung',
        trend: 'trend* entwicklung verlauf wachstum rucklauf sinkt steigt',
        research: 'forschung* recherche technologie* entwicklung_von',
        team: 'team mitarbeiter* personal belegschaft',
        hire: 'einstellen anstellen rekrutier* anwerben',
        fire: 'entlassen kundigen feuern',
        engineer: 'ingenieur* entwickler*', designer: 'designer* gestalter*', marketer: 'marketer* vermarkter*',
        product: 'produkt* handy* smartphone* telefon*', price: 'preis* preise',
        stock: 'lager* bestand lagerbestand vorrat*', campaign: 'kampagne* werbung* werbe* marketing promotion',
        os: 'betriebssystem* os', chip: 'chip* prozessor* halbleiter',
        morale: 'moral stimmung motivation', reputation: 'ruf ruf reputation bewertung* rezension*',
        competitor: 'konkurrent* wettbewerb* rivale* marktanteil*', market: 'markt',
        whatif: 'was_ware_wenn wenn falls angenommen', silicon: 'silizium silicon',
        whatis: 'was_ist was_bedeutet was_heisst bedeutung', why: 'warum wieso weshalb',
        bug: 'fehler absturz pannen', update: 'aktualisierung* update* patch* neuerung*',
        game: 'spiel', app: 'app anwendung', open: 'offne* offnen gehe geh_zu zeige* zeig',
        clear: 'loschen* lösch* leeren leere zurucksetzen', chat: 'chat verlauf unterhaltung',
        newer: 'neu*', howmuch: 'wie_viel* wieviel*', when: 'wann', can: 'kann* kannst konnen',
        runout: 'aufgebraucht ausgehen leer pleite_gehen ausgegangen', profit: 'gewinn profit',
        loss: 'verlust', income: 'einnahmen* einkommen umsatz', cost: 'kosten ausgaben',
        salary: 'gehalt* gehalter lohn lohne', bankrupt: 'bankrott insolvenz pleite',
        raise: 'erhohe* erhoh* anheben', lower: 'senke* senk* reduziere* verringere*',
        produce: 'produziere* produzier* herstellen', start: 'starte* start beginn* anfangen',
        changed: 'was_ist_neu was_hat_sich_geandert neuigkeiten', sales: 'verkauf* verkaufe absatz',
        sell: 'verkaufen', more: 'mehr weiter details genauer', yes: 'ja jep klar okay',
        unit: 'stuck einheiten', margin: 'marge* spanne', discount: 'rabatt* nachlass',
        now: 'jetzt', first: 'erste* erster', second: 'zweite* zweiter', third: 'dritte* dritter',
        audit: 'prufung audit', risk: 'risiko* gefahr', scenario: 'szenario*', and: 'und sowie',
        must: 'soll* sollte* muss* mussen', error: 'fehler', broken: 'kaputt defekt', not: 'nicht kein*',
        works: 'funktioniert geht', employee: 'angestellte* arbeiter', fab: 'fabrik* fertigung',
        rival: 'rivale*', boost: 'beschleunige* booste*', increase: 'steigern steigen erhohen', decrease: 'sinken fallen',
        snooze: 'verschieben spater', explain: 'erklare* erklaer*', report: 'bericht',
        k: 'tausend', m: 'million*',
        set: 'setze* stelle* andere* anpassen', exists: 'gibt_es gibt_es_ein', business: 'unternehmen firma geschaft*'
    },
    es: {
        greet: 'hola buenas buenos_dias buenas_tardes buenas_noches ey',
        thanks: 'gracias* genial excelente',
        help: 'ayuda* ayudame funciones que_puedes',
        status: 'estado situacion resumen informe panorama',
        health: 'salud puntuacion puntaje calificacion debilidad* punto_debil mas_debil',
        priority: 'prioridad* recomendacion* recomiendas consejo* sugerencia* siguiente urgente',
        plan: 'plan estrategia* hoja_de_ruta guia',
        cash: 'dinero efectivo caja saldo capital fondos liquidez plata',
        loan: 'prestamo* credito* deuda* deudas interes* cuota* hipoteca',
        forecast: 'prediccion* pronostico* proyeccion* prever',
        trend: 'tendencia* evolucion crecimiento bajando subiendo',
        research: 'investigacion* investigar tecnologia*',
        team: 'equipo personal plantilla', hire: 'contratar contrato* reclutar fichar',
        fire: 'despedir despido echar',
        engineer: 'ingeniero* desarrollador*', designer: 'disenador* disenadora*', marketer: 'mercadologo* vendedor*',
        product: 'producto* telefono* movil* celular* smartphone*', price: 'precio* precios',
        stock: 'inventario existencias stock almacen', campaign: 'campana* publicidad anuncio* marketing promocion',
        os: 'sistema_operativo os', chip: 'chip* procesador* semiconductor*',
        morale: 'moral animo motivacion', reputation: 'reputacion resena* opinion* valoracion*',
        competitor: 'competidor* competencia rival* cuota_de_mercado', market: 'mercado',
        whatif: 'que_pasaria_si que_pasa_si si_contrato si_pido supongamos', silicon: 'silicio silicon',
        whatis: 'que_es que_significa significado definicion', why: 'por_que porque',
        bug: 'error fallo falla cuelga', update: 'actualizacion* parche* novedades version_nueva',
        game: 'juego', app: 'app aplicacion', open: 'abre* abrir ve_a muestra* muestrame ir_a',
        clear: 'borrar* borra limpiar limpia vaciar vacia reiniciar', chat: 'chat historial conversacion',
        newer: 'nuevo nueva nuevos', howmuch: 'cuanto* cuanta* cuantos', when: 'cuando', can: 'puedo puedes podemos',
        runout: 'agotado agotarse acabarse se_acaba se_me_acaba acaba* quedarme_sin', profit: 'ganancia* beneficio* utilidad',
        loss: 'perdida* perdidas', income: 'ingreso* ingresos facturacion', cost: 'costo* costos gasto* gastos',
        salary: 'salario* sueldo*', bankrupt: 'quiebra bancarrota', raise: 'sube* subir aumenta* aumentar',
        lower: 'baja* bajar reduce* reducir', produce: 'produce* producir fabricar', start: 'inicia* iniciar empezar comienza*',
        changed: 'que_hay_de_nuevo que_ha_cambiado novedades', sales: 'venta* ventas', sell: 'vender',
        more: 'mas detalles detalle sigue continua', yes: 'si vale claro dale', unit: 'unidades unidad',
        margin: 'margen*', discount: 'descuento*', now: 'ahora', first: 'primero primera', second: 'segundo segunda',
        third: 'tercero tercera', audit: 'auditoria audit', risk: 'riesgo*', scenario: 'escenario*', and: 'y e',
        must: 'debo deberia debemos', error: 'error', broken: 'roto danado', not: 'no', works: 'funciona',
        employee: 'empleado* trabajador*', fab: 'fabrica* fabricacion', rival: 'rival*',
        boost: 'acelera* acelerar impulsa*', increase: 'subir aumentar', decrease: 'bajar caer',
        snooze: 'posponer aplazar', explain: 'explica* explicame', report: 'informe', k: 'mil', m: 'millon*',
        set: 'pon* poner cambia* cambiar fija* fijar', exists: 'hay existe*', business: 'empresa negocio compania'
    },
    fr: {
        greet: 'bonjour salut coucou bonsoir hello',
        thanks: 'merci* super genial',
        help: 'aide* aider fonctions que_peux_tu',
        status: 'etat situation resume bilan apercu rapport',
        health: 'sante score note faiblesse* point_faible plus_faible',
        priority: 'priorite* recommandation* conseil* suggestion* prochain* urgent',
        plan: 'plan strategie* feuille_de_route guide',
        cash: 'argent tresorerie liquide* solde capital fonds budget ttune',
        loan: 'pret* emprunt* credit* dette* dettes interet* mensualite*',
        forecast: 'prevision* prediction* projection* prevoir',
        trend: 'tendance* evolution croissance monte',
        research: 'recherche* technologie*', team: 'equipe personnel effectif',
        hire: 'embaucher recruter engager', fire: 'licencier renvoyer virer',
        engineer: 'ingenieur* developpeur*', designer: 'designer* concepteur*', marketer: 'marketeur* commercial*',
        product: 'produit* telephone* portable* smartphone*', price: 'prix tarif*',
        stock: 'stock* inventaire reserve*', campaign: 'campagne* publicite* pub marketing promotion',
        os: 'systeme_d_exploitation os', chip: 'puce* processeur* semi_conducteur*',
        morale: 'moral ambiance motivation', reputation: 'reputation avis critique* evaluation* image',
        competitor: 'concurrent* concurrence rival* part_de_marche', market: 'marche',
        whatif: 'et_si que_se_passe_t_il_si si_j supposons', silicon: 'silicium silicon',
        whatis: 'qu_est_ce_que c_est_quoi que_veut_dire signification definition', why: 'pourquoi',
        bug: 'bogue plantage panne erreur', update: 'mise_a_jour* correctif* nouveautes',
        game: 'jeu', app: 'app application', open: 'ouvre* ouvrir va_a montre* montrer aller_a',
        clear: 'effacer efface* nettoyer nettoie vider vide reinitialiser', chat: 'chat historique conversation discussion',
        newer: 'nouveau nouvelle nouveaux', howmuch: 'combien', when: 'quand', can: 'peux peut puis pouvons',
        runout: 'epuise epuiser manquer a_court plus_de', profit: 'benefice* profit* gain*',
        loss: 'perte* pertes deficit', income: 'revenu* revenus recettes chiffre_d_affaires', cost: 'cout* couts depense* depenses frais',
        salary: 'salaire* paie', bankrupt: 'faillite banqueroute', raise: 'augmente* augmenter monter hausse',
        lower: 'baisse* baisser reduis* reduire diminue*', produce: 'produis* produire fabriquer', start: 'lance* lancer commence* demarre*',
        changed: 'quoi_de_neuf qu_est_ce_qui_a_change nouveautes', sales: 'vente* ventes', sell: 'vendre',
        more: 'plus details detail continue suite', yes: 'oui ouais ok d_accord', unit: 'unites unite',
        margin: 'marge*', discount: 'remise* reduction* rabais', now: 'maintenant', first: 'premier premiere',
        second: 'deuxieme second seconde', third: 'troisieme', audit: 'audit', risk: 'risque*', scenario: 'scenario*',
        and: 'et', must: 'dois devrais devons', error: 'erreur', broken: 'casse en_panne', not: 'pas ne',
        works: 'fonctionne', employee: 'employe* salarie*', fab: 'usine* fabrication fonderie', rival: 'rival*',
        boost: 'accelere* accelerer booste*', increase: 'augmenter monter', decrease: 'baisser chuter',
        snooze: 'reporter repousser', explain: 'explique* expliquer', report: 'rapport', k: 'mille', m: 'million*',
        set: 'mets* mettre change* changer fixe* fixer', exists: 'y_a_t_il il_y_a', business: 'entreprise societe affaires'
    },
    it: {
        greet: 'ciao salve buongiorno buonasera buonanotte ehi',
        thanks: 'grazie* ottimo perfetto',
        help: 'aiuto* aiutami funzioni cosa_puoi',
        status: 'stato situazione riepilogo resoconto panoramica rapporto',
        health: 'salute punteggio voto debolezza* punto_debole piu_debole',
        priority: 'priorita* raccomandazione* consiglio* suggerimento* prossimo urgente',
        plan: 'piano strategia* tabella_di_marcia guida',
        cash: 'soldi denaro contanti cassa saldo capitale fondi liquidita',
        loan: 'prestito* mutuo* credito* debito* debiti interesse* interessi rata* rate',
        forecast: 'previsione* pronostico proiezione* prevedere',
        trend: 'andamento tendenza* evoluzione crescita sale scende calo',
        research: 'ricerca* tecnologia*', team: 'team squadra personale organico',
        hire: 'assumere assumo assunzione reclutare', fire: 'licenziare licenzio',
        engineer: 'ingegnere* ingegneri sviluppatore*', designer: 'designer* progettista*', marketer: 'marketer* addetto_marketing',
        product: 'prodotto* prodotti telefono* cellulare* smartphone*', price: 'prezzo* prezzi',
        stock: 'scorta* scorte magazzino inventario stock', campaign: 'campagna* pubblicita* marketing promozione*',
        os: 'sistema_operativo os', chip: 'chip* processore* semiconduttore*',
        morale: 'morale umore motivazione', reputation: 'reputazione recensione* recensioni valutazione* immagine',
        competitor: 'concorrente* concorrenti concorrenza rivale* quota_di_mercato', market: 'mercato',
        whatif: 'e_se cosa_succede_se se_assumo se_prendo supponiamo', silicon: 'silicio silicon',
        whatis: 'cos_e che_cos_e cosa_significa significato definizione', why: 'perche',
        bug: 'errore crash guasto blocco', update: 'aggiornamento* patch novita',
        game: 'gioco', app: 'app applicazione', open: 'apri aprire vai_a mostra* mostrami andare_a',
        clear: 'cancella* cancellare pulisci* svuota* azzera*', chat: 'chat cronologia conversazione',
        newer: 'nuovo nuova nuovi', howmuch: 'quanto* quanta* quanti*', when: 'quando', can: 'posso puoi possiamo',
        runout: 'finisc* finiti finire esaurito esaurire esaurisce a_secco', profit: 'profitto* utile guadagno*',
        loss: 'perdita* perdite', income: 'entrate incassi ricavi reddito', cost: 'costo* costi spesa* spese',
        salary: 'stipendio* stipendi salario*', bankrupt: 'fallimento bancarotta', raise: 'alza* alzare aumenta* aumentare',
        lower: 'abbassa* abbassare riduci* ridurre', produce: 'produci* produrre', start: 'avvia* avviare inizia* iniziare lancia*',
        changed: 'cosa_c_e_di_nuovo cosa_e_cambiato novita', sales: 'vendita* vendite', sell: 'vendere',
        more: 'altro piu dettagli dettaglio continua', yes: 'si ok va_bene certo', unit: 'unita pezzi',
        margin: 'margine*', discount: 'sconto* ribasso', now: 'adesso ora', first: 'primo prima',
        second: 'secondo seconda', third: 'terzo terza', audit: 'audit verifica', risk: 'rischio* rischi', scenario: 'scenario*',
        and: 'e ed', must: 'devo dovrei dobbiamo', error: 'errore', broken: 'rotto guasto', not: 'non',
        works: 'funziona', employee: 'dipendente* dipendenti', fab: 'fabbrica* fonderia produzione', rival: 'rivale*',
        boost: 'accelera* accelerare potenzia*', increase: 'aumentare salire', decrease: 'calare scendere',
        snooze: 'rimanda* posticipa*', explain: 'spiega* spiegami', report: 'rapporto', k: 'mila', m: 'million*',
        set: 'metti* imposta* cambia* cambiare', exists: 'c_e ci_sono', business: 'azienda impresa societa attivita'
    },
    pl: {
        greet: 'czesc witaj* siema dzien_dobry dobry_wieczor hej',
        thanks: 'dzieki dziekuje* super swietnie',
        help: 'pomoc* pomoz funkcje co_potrafisz',
        status: 'stan sytuacja podsumowanie raport przeglad',
        health: 'zdrowie* kondycja wynik ocena slabosc* slaby slabsze najslabsze',
        priority: 'priorytet* rekomendacj* porada porady sugesti* nastepny pilne',
        plan: 'plan strategi* mapa_drogowa poradnik',
        cash: 'pieniadze pieniedzy gotowka kasa saldo kapital srodki plynnosc fundusze',
        loan: 'pozyczk* kredyt* dlug* dlugi odsetk* rata raty splata',
        forecast: 'prognoz* przewidywani* przewidziec projekcja',
        trend: 'trend* rozwoj wzrost spadek rosnie spada',
        research: 'badani* technologi* badac', team: 'zespol* ekipa personel pracownicy',
        hire: 'zatrudnic zatrudnij* zatrudnil* rekrutowac', fire: 'zwolnic zwolnij*',
        engineer: 'inzynier* programist*', designer: 'projektant* designer*', marketer: 'marketer* marketingowiec',
        product: 'produkt* telefon* smartfon* komorka', price: 'cena ceny cen* cene',
        stock: 'zapas* magazyn* stan_magazynowy zapasy', campaign: 'kampani* reklam* marketing promocj*',
        os: 'system_operacyjny os', chip: 'chip* procesor* polprzewodnik*',
        morale: 'morale nastroj motywacja', reputation: 'reputacj* opini* recenzj* ocen*',
        competitor: 'konkurent* konkurencj* rywal* udzial_w_rynku', market: 'rynek rynku',
        whatif: 'co_jesli co_by_bylo_gdyby a_gdyby zalozmy', silicon: 'krzem silicon',
        whatis: 'co_to_jest co_to co_znaczy znaczenie definicja', why: 'dlaczego czemu',
        bug: 'blad bledy awaria zawiesza', update: 'aktualizacj* poprawk* nowosci',
        game: 'gra gre', app: 'aplikacj* app', open: 'otworz* pokaz* przejdz idz_do',
        clear: 'wyczysc* usun* skasuj* resetuj*', chat: 'czat historia rozmow*',
        newer: 'nowy nowa nowe nowych', howmuch: 'ile', when: 'kiedy', can: 'moge mozesz mozemy',
        runout: 'skonczy* wyczerpa* zabraknie zabraknac bez_pieniedzy', profit: 'zysk* profit',
        loss: 'strat* deficyt', income: 'przychod* dochod* wplyw*', cost: 'koszt* wydatk*',
        salary: 'pensj* wynagrodzeni* pensje placa', bankrupt: 'bankructw* upadlosc', raise: 'podnies* podwyz* zwieksz*',
        lower: 'obniz* zmniejsz* zredukuj*', produce: 'wyprodukuj* produkowac produkuj*', start: 'zacznij* zaczac uruchom* rozpocznij*',
        changed: 'co_nowego co_sie_zmienilo nowosci', sales: 'sprzedaz* sprzedaj*', sell: 'sprzedawac',
        more: 'wiecej szczegoly szczegol dalej kontynuuj', yes: 'tak okej ok dobrze jasne', unit: 'sztuk* jednostk* szt',
        margin: 'marz*', discount: 'rabat* znizk*', now: 'teraz', first: 'pierwsz*', second: 'drugi druga drugie',
        third: 'trzeci trzecia', audit: 'audyt', risk: 'ryzyk*', scenario: 'scenariusz*', and: 'i oraz',
        must: 'powinienem powinnam musze trzeba', error: 'blad', broken: 'zepsuty zepsuta', not: 'nie',
        works: 'dziala', employee: 'pracownik* pracownic*', fab: 'fabryk* odlewnia produkcja', rival: 'rywal*',
        boost: 'przyspiesz* zwiekszyc', increase: 'zwiekszyc rosnac', decrease: 'zmniejszyc spadac',
        snooze: 'odloz* przeloz*', explain: 'wyjasn* objasn*', report: 'raport', k: 'tys tysiecy tysiac', m: 'mln milion*',
        set: 'ustaw* zmien*', exists: 'czy_jest czy_sa', business: 'firma firm* przedsiebiorstw* biznes'
    },
    ru: {
        greet: 'привет здравствуй* добрый_день доброе_утро добрый_вечер хай',
        thanks: 'спасибо благодар* круто отлично',
        help: 'помощь помоги* функции что_ты_умеешь',
        status: 'состояние ситуация сводка обзор отчет положение дела',
        health: 'здоровье оценка балл рейтинг слабость слабое слабая слабейш* слабый',
        priority: 'приоритет* рекоменд* совет* предложени* следующ* срочно',
        plan: 'план стратеги* дорожная_карта гайд руководство',
        cash: 'деньг* денег деньгах деньгами наличные касса баланс капитал средства ликвидность бюджет',
        loan: 'кредит* займ* заём долг* долги проценты процент* ипотека выплат*',
        forecast: 'прогноз* предсказ* проекци* спрогнозир*',
        trend: 'тренд* динамика рост* падени* растет растёт падает снижени*',
        research: 'исследовани* технологи* изучен* наука', team: 'команда команд* персонал штат сотрудники',
        hire: 'нанять нанимать наем найм* принять_на_работу', fire: 'уволить уволь* увольнени*',
        engineer: 'инженер* разработчик*', designer: 'дизайнер* конструктор*', marketer: 'маркетолог*',
        product: 'продукт* телефон* смартфон* устройств*', price: 'цена цены цен* цену',
        stock: 'склад* запас* остатки наличие', campaign: 'кампани* реклам* маркетинг промо акци*',
        os: 'операционная_система ос os', chip: 'чип* процессор* полупроводник*',
        morale: 'мораль настроение мотивация', reputation: 'репутаци* отзыв* рейтинг оценк* имидж',
        competitor: 'конкурент* соперник* доля_рынка', market: 'рынок рынка рынке',
        whatif: 'что_если что_будет_если а_если допустим', silicon: 'кремний силикон silicon',
        whatis: 'что_такое что_значит что_это значение определение', why: 'почему зачем отчего',
        bug: 'баг* ошибк* сбой вылет* зависа* глюк*', update: 'обновлени* патч* новинки',
        game: 'игр*', app: 'приложени* апп', open: 'открой* открыть перейди* покажи* показать',
        clear: 'очисти* очистить удали* сбрось* стереть', chat: 'чат история разговор* переписк*',
        newer: 'новый новая новое новые', howmuch: 'сколько', when: 'когда', can: 'могу можешь можем можно',
        runout: 'закончится закончились закончил* кончится кончаются исчерп* хватит', profit: 'прибыль* доход* выгод*',
        loss: 'убыток убытки потери потеря', income: 'выручка поступлени* доходы', cost: 'расход* затрат* издержки стоимость',
        salary: 'зарплат* оклад* жалованье', bankrupt: 'банкрот*', raise: 'повысь* повысить подними* поднять увеличь*',
        lower: 'снизь* снизить уменьши* уменьшить', produce: 'произведи* производить произвести', start: 'запусти* запустить начни* начать',
        changed: 'что_нового что_изменилось новости', sales: 'продаж* сбыт', sell: 'продавать продать',
        more: 'еще ещё подробнее подробности продолжай дальше', yes: 'да ага ок хорошо ладно', unit: 'штук* единиц*',
        margin: 'маржа маржи маржу', discount: 'скидк*', now: 'сейчас', first: 'первый первая первое',
        second: 'второй вторая второе', third: 'третий третья третье', audit: 'аудит', risk: 'риск*', scenario: 'сценари*',
        and: 'и', must: 'должен должна надо нужно стоит', error: 'ошибка', broken: 'сломан* сломалось', not: 'не нет',
        works: 'работает', employee: 'сотрудник* работник*', fab: 'фабрик* завод* производство', rival: 'соперник*',
        boost: 'ускори* ускорить', increase: 'увеличить расти', decrease: 'уменьшить падать',
        snooze: 'отложи* отложить', explain: 'объясни* объяснить', report: 'отчет', k: 'тыс тысяч* тысяча', m: 'млн миллион*',
        set: 'установи* поставь* измени* изменить', exists: 'есть_ли', business: 'компани* бизнес фирм*'
    },
    hi: {
        greet: 'नमस्ते नमस्कार हेलो हाय सुप्रभात शुभ_संध्या',
        thanks: 'धन्यवाद शुक्रिया थैंक्स बढ़िया',
        help: 'मदद सहायता फीचर क्या_कर_सकते',
        status: 'स्थिति हाल हालत सारांश रिपोर्ट अवलोकन',
        health: 'सेहत स्वास्थ्य स्कोर रेटिंग कमजोरी कमज़ोरी सबसे_कमजोर',
        priority: 'प्राथमिकता सलाह सुझाव अगला जरूरी ज़रूरी तुरंत',
        plan: 'योजना प्लान रणनीति रोडमैप गाइड',
        cash: 'पैसे पैसा पैसों धन नकद कैश बैलेंस पूंजी फंड बजट',
        loan: 'कर्ज कर्ज़ लोन ऋण उधार ब्याज किस्त ईएमआई',
        forecast: 'पूर्वानुमान अनुमान भविष्यवाणी प्रोजेक्शन',
        trend: 'ट्रेंड रुझान प्रवृत्ति विकास बढ़ोतरी गिरावट बढ़ रहा गिर रहा',
        research: 'रिसर्च शोध अनुसंधान तकनीक टेक्नोलॉजी', team: 'टीम स्टाफ कर्मचारी दल',
        hire: 'भर्ती नियुक्त काम_पर_रखना हायर', fire: 'निकालना निकालो नौकरी_से_हटाना',
        engineer: 'इंजीनियर इंजीनियरों', designer: 'डिज़ाइनर डिजाइनर', marketer: 'मार्केटर',
        product: 'प्रोडक्ट उत्पाद फोन स्मार्टफोन मोबाइल', price: 'कीमत दाम मूल्य प्राइस',
        stock: 'स्टॉक भंडार इन्वेंटरी माल', campaign: 'अभियान विज्ञापन कैंपेन मार्केटिंग प्रचार प्रमोशन',
        os: 'ओएस ऑपरेटिंग_सिस्टम', chip: 'चिप प्रोसेसर सेमीकंडक्टर',
        morale: 'मनोबल मूड प्रेरणा', reputation: 'प्रतिष्ठा साख रिव्यू समीक्षा रेटिंग छवि',
        competitor: 'प्रतियोगी प्रतिद्वंद्वी प्रतिस्पर्धी कॉम्पिटिटर बाजार_हिस्सेदारी', market: 'बाजार बाज़ार मार्केट',
        whatif: 'अगर क्या_होगा_अगर मान_लो मान_लीजिए', silicon: 'सिलिकॉन',
        whatis: 'क्या_है क्या_होता_है मतलब अर्थ परिभाषा', why: 'क्यों क्यूँ',
        bug: 'बग खराबी गड़बड़ी क्रैश हैंग', update: 'अपडेट पैच नया_संस्करण',
        game: 'गेम खेल', app: 'ऐप एप', open: 'खोलो खोलें दिखाओ दिखाइए जाओ',
        clear: 'साफ मिटाओ हटाओ डिलीट रीसेट', chat: 'चैट बातचीत इतिहास',
        newer: 'नया नई नए', howmuch: 'कितना कितने कितनी', when: 'कब', can: 'सकता सकती सकते',
        runout: 'खत्म ख़त्म खतम चुक', profit: 'मुनाफा मुनाफ़ा लाभ फायदा', loss: 'नुकसान घाटा',
        income: 'आमदनी आय कमाई राजस्व', cost: 'खर्च खर्चा लागत', salary: 'वेतन तनख्वाह सैलरी',
        bankrupt: 'दिवालिया', raise: 'बढ़ाओ बढ़ाएं बढ़ाना', lower: 'घटाओ घटाएं घटाना कम_करो',
        produce: 'बनाओ उत्पादन', start: 'शुरू', changed: 'क्या_नया_है क्या_बदला नया_क्या',
        sales: 'बिक्री सेल्स', sell: 'बेचना', more: 'विस्तार आगे जारी',
        yes: 'हाँ हां जी ठीक', unit: 'यूनिट', margin: 'मार्जिन', discount: 'छूट डिस्काउंट',
        now: 'अभी अब', first: 'पहला पहली', second: 'दूसरा दूसरी', third: 'तीसरा तीसरी',
        audit: 'ऑडिट जांच', risk: 'जोखिम रिस्क', scenario: 'परिदृश्य', and: 'और',
        must: 'चाहिए', error: 'एरर त्रुटि', broken: 'टूटा खराब', not: 'नहीं', works: 'चल',
        employee: 'कर्मचारी', fab: 'फैक्ट्री फैब', rival: 'प्रतिद्वंद्वी', boost: 'तेज़ तेज',
        increase: 'बढ़ना', decrease: 'घटना', snooze: 'टालो टालें', explain: 'समझाओ समझाइए',
        report: 'रिपोर्ट', k: 'हज़ार हजार', m: 'मिलियन',
        exists: 'क्या_कोई', business: 'कंपनी कारोबार बिज़नेस व्यवसाय'
    },
    ja: {
        greet: 'こんにちは こんばんは おはよう やあ',
        thanks: 'ありがとう 感謝 助かる',
        help: 'ヘルプ 助けて 手伝って 機能 何ができる',
        status: '状況 状態 概要 まとめ 報告 レポート 現状',
        health: '健全性 ヘルス スコア 評価 弱点 一番弱い',
        priority: '優先 おすすめ 提案 アドバイス 次 緊急 急ぎ',
        plan: '計画 プラン 戦略 ロードマップ ガイド',
        cash: 'お金 現金 資金 キャッシュ 残高 所持金 予算 資本 運転資金',
        loan: 'ローン 借入 借金 融資 返済 利息 金利 負債',
        forecast: '予測 予想 見通し 将来 シミュレーション',
        trend: 'トレンド 傾向 推移 成長 下落 上昇 伸び',
        research: '研究 リサーチ 技術 テクノロジー', team: 'チーム スタッフ 社員 人員',
        hire: '雇う 採用 雇用 雇って 雇い', fire: '解雇 クビ 首にする',
        engineer: 'エンジニア 技術者', designer: 'デザイナー', marketer: 'マーケター',
        product: '製品 プロダクト スマホ スマートフォン 携帯 端末', price: '価格 値段 値付け 料金',
        stock: '在庫 ストック 備蓄', campaign: 'キャンペーン 広告 宣伝 マーケティング プロモーション',
        os: 'オーエス ＯＳ 基本ソフト', chip: 'チップ プロセッサ 半導体',
        morale: '士気 モラル やる気 モチベーション', reputation: '評判 レビュー 口コミ 評価 ブランドイメージ',
        competitor: '競合 ライバル 競争相手 ライバル会社 シェア', market: '市場 マーケット',
        whatif: 'もし もしも 仮に だったら なら どうなる', silicon: 'シリコン',
        whatis: 'とは 何ですか って何 意味 定義', why: 'なぜ どうして 理由',
        bug: 'バグ 不具合 エラー クラッシュ フリーズ 固まる', update: 'アップデート 更新 パッチ 新バージョン',
        game: 'ゲーム', app: 'アプリ', open: '開いて 開く 開け 見せて 表示 移動',
        clear: '消して 消去 クリア リセット 削除', chat: 'チャット 会話 履歴',
        newer: '新しい 新規 新', howmuch: 'いくら どれくらい どのくらい 何円 いくつ', when: 'いつ', can: 'できる できます 可能',
        runout: '尽きる なくな 底をつく 枯渇 足りなく', profit: '利益 黒字 儲け', loss: '赤字 損失 損',
        income: '収入 売上 収益', cost: '費用 コスト 支出 経費', salary: '給料 給与 人件費',
        bankrupt: '倒産 破産', raise: '上げる 上げて 引き上げ', lower: '下げる 下げて 引き下げ', raiseprice: '値上げ', lowerprice: '値下げ',
        produce: '生産 製造 作る', start: '開始 始める 始めて スタート', changed: '何が変わった 変更点 最新情報 新着',
        sales: '売上 販売 売れ行き', sell: '売る 売れる', more: 'もっと 詳細 詳しく 続き 続けて',
        yes: 'はい うん そうです お願い', unit: '台 個 ユニット', margin: 'マージン 利益率', discount: '割引 値引き',
        now: '今 現在 今すぐ', first: '一つ目 最初 一番目 1つ目', second: '二つ目 二番目 2つ目', third: '三つ目 三番目 3つ目',
        audit: '監査 診断 点検', risk: 'リスク 危険', scenario: 'シナリオ', and: '及び そして',
        must: 'べき すべき 必要', error: 'エラー', broken: '壊れ 動かない', not: 'ない ません',
        works: '動く 動作', employee: '従業員 社員', fab: '工場 ファブ ファウンドリ', rival: 'ライバル',
        boost: '加速 ブースト 早める', increase: '増やす 増える', decrease: '減らす 減る',
        snooze: '延期 後で スヌーズ', explain: '説明 教えて', report: '報告', k: '千', m: '百万',
        set: 'にして に変更 に設定 にする', exists: 'ありますか あります', business: '会社 ビジネス 事業 企業'
    },
    ko: {
        greet: '안녕 안녕하세요 반가워 하이',
        thanks: '감사합니다 감사해요 고마워 고맙습니다 땡큐',
        help: '도움 도와줘 도와주세요 기능 뭘할수',
        status: '상태 상황 현황 요약 개요 보고서 리포트',
        health: '건강 점수 평가 약점 가장약한 건전성',
        priority: '우선순위 추천 제안 조언 다음 시급 긴급',
        plan: '계획 플랜 전략 로드맵 가이드',
        cash: '돈 현금 자금 캐시 잔액 잔고 예산 자본 운영자금',
        loan: '대출 빚 부채 융자 상환 이자 금리 할부',
        forecast: '예측 전망 예상 시뮬레이션 미래',
        trend: '추세 트렌드 추이 성장 하락 상승',
        research: '연구 리서치 기술 테크', team: '팀 직원 스태프 인원',
        hire: '고용 채용 뽑 영입', fire: '해고 자르 짤',
        engineer: '엔지니어 기술자', designer: '디자이너', marketer: '마케터',
        product: '제품 상품 프로덕트 폰 스마트폰 휴대폰 핸드폰', price: '가격 값 요금 책정',
        stock: '재고 스톡 비축', campaign: '캠페인 광고 홍보 마케팅 프로모션',
        os: '운영체제 오에스', chip: '칩 프로세서 반도체',
        morale: '사기 모랄 의욕 동기', reputation: '평판 리뷰 후기 평가 이미지 브랜드',
        competitor: '경쟁사 경쟁자 라이벌 경쟁 점유율', market: '시장 마켓',
        whatif: '만약 만일 가정 하면 어떻게 되', silicon: '실리콘',
        whatis: '뭐야 무엇 뭔가요 이란 란 의미 뜻 정의', why: '왜 이유',
        bug: '버그 오류 에러 충돌 멈춤 먹통 렉', update: '업데이트 패치 갱신 신버전',
        game: '게임', app: '앱 어플', open: '열어 열기 열어줘 보여줘 보여 이동 가자',
        clear: '지워 삭제 초기화 클리어 비워', chat: '채팅 대화 기록',
        newer: '새로운 새 신규', howmuch: '얼마 얼마나 몇', when: '언제', can: '할수 가능 수있',
        runout: '바닥 떨어지 소진 부족 고갈 다떨어', profit: '이익 수익 흑자 이득', loss: '손실 적자 손해',
        income: '수입 매출 소득', cost: '비용 지출 원가 경비', salary: '월급 급여 인건비',
        bankrupt: '파산 부도', raise: '올려 올리 높여', lower: '내려 내리 낮춰', raiseprice: '가격인상 인상', lowerprice: '가격인하 인하',
        produce: '생산 제작 만들', start: '시작 개시 스타트', changed: '뭐가바뀌 변경 최신소식 달라진',
        sales: '판매 매출 팔림', sell: '팔 판매하', more: '자세히 상세 계속 이어', yes: '네 응 예 좋아 그래',
        unit: '대 개 유닛', margin: '마진 이익률', discount: '할인 세일',
        now: '지금 현재 당장', first: '첫번째 첫째 일번', second: '두번째 둘째', third: '세번째 셋째',
        audit: '진단 점검 감사보고', risk: '리스크 위험', scenario: '시나리오', and: '그리고',
        must: '해야 해야할', error: '에러 오류', broken: '고장 망가', not: '아니',
        works: '작동 동작', employee: '직원 사원', fab: '공장 팹 파운드리', rival: '라이벌',
        boost: '가속 부스트 빠르게', increase: '늘리 증가', decrease: '줄이 감소',
        snooze: '미루 나중에 스누즈', explain: '설명 알려줘', report: '보고', k: '천', m: '백만',
        set: '바꿔 변경해 설정', exists: '있어요 있나요', business: '회사 사업 비즈니스 기업'
    },
    zh: {
        greet: '你好 您好 嗨 早上好 晚上好 哈喽',
        thanks: '谢谢 感谢 多谢 太好了',
        help: '帮助 帮我 帮忙 功能 你能做什么',
        status: '状况 状态 概况 总结 报告 现状 情况',
        health: '健康 评分 得分 分数 弱点 最弱 健康度',
        priority: '优先 优先事项 建议 推荐 下一步 紧急 先做什么 该做什么',
        plan: '计划 规划 战略 策略 路线图 攻略',
        cash: '钱 现金 资金 余额 预算 资本 存款 现金流 流动资金',
        loan: '贷款 借款 欠债 债务 还款 利息 利率 分期 负债',
        forecast: '预测 预计 预估 前景 模拟 未来',
        trend: '趋势 走势 增长 下降 上升 下滑 变化',
        research: '研究 研发 技术 科技', team: '团队 员工 人员 职员',
        hire: '招聘 雇佣 雇 招人 招', fire: '解雇 开除 裁员 炒',
        engineer: '工程师', designer: '设计师', marketer: '营销人员 市场专员',
        product: '产品 手机 智能手机 机型', price: '价格 定价 售价 价钱',
        stock: '库存 存货 备货', campaign: '活动 广告 宣传 营销 推广 促销',
        os: '操作系统 系统', chip: '芯片 处理器 半导体',
        morale: '士气 心情 积极性 动力', reputation: '口碑 声誉 评价 评论 评分 品牌形象',
        competitor: '竞争对手 对手 竞品 竞争者 市场份额 份额', market: '市场',
        whatif: '如果 假如 假设 要是 会怎样', silicon: '硅 硅元',
        whatis: '是什么 什么是 什么意思 含义 定义 啥意思', why: '为什么 为何 原因 怎么会',
        bug: '漏洞 故障 错误 出错 报错 崩溃 卡死 闪退 卡顿', update: '更新 补丁 升级 新版本',
        game: '游戏', app: '应用 软件', open: '打开 开启 显示 查看 前往 去',
        clear: '清除 清空 删除 重置 清理', chat: '聊天 对话 记录',
        newer: '新的 新', howmuch: '多少 几多', when: '什么时候 何时 几时', can: '能 可以 能否 可否',
        runout: '用完 花光 耗尽 见底 不够 撑不住', profit: '利润 盈利 赚钱 收益', loss: '亏损 亏钱 赤字',
        income: '收入 营收 进账', cost: '成本 费用 开支 支出', salary: '工资 薪水 薪资 人力成本',
        bankrupt: '破产 倒闭', raise: '提高 调高 增加', lower: '降低 调低 减少', raiseprice: '涨价 提价', lowerprice: '降价',
        produce: '生产 制造 量产', start: '开始 启动 开展', changed: '有什么变化 有什么新 最新消息 变动',
        sales: '销量 销售 卖得', sell: '卖 出售', more: '更多 详细 详情 继续 再说', yes: '是 好 好的 对 嗯',
        unit: '台 部 件 个 单位', margin: '利润率 毛利', discount: '折扣 打折 优惠',
        now: '现在 目前 马上', first: '第一 第1', second: '第二 第2', third: '第三 第3',
        audit: '审计 体检 诊断', risk: '风险', scenario: '情景 场景', and: '和 以及 还有',
        must: '应该 必须 需要', error: '错误 出错 报错', broken: '坏了 坏掉', not: '不 没 无',
        works: '运行 工作 正常', employee: '员工 雇员', fab: '工厂 晶圆厂 代工', rival: '对手',
        boost: '加速 提速', increase: '增加 提升', decrease: '减少 下降',
        snooze: '推迟 稍后 延后', explain: '解释 说明', report: '报告', k: '千', m: '百万',
        set: '改为 改成 设置为 设为 调整为', exists: '有没有 有吗', business: '公司 业务 生意 企业'
    }
};

// Tambahan khusus Indonesia/Inggris: kata yang perlu dinetralkan supaya tidak menang tanpa alasan.
// (id/en dipahami langsung oleh AdvisorBrain; modul ini tidak menerjemahkannya.)

// ------------------------------------------------------------
// Bangun indeks per bahasa
// ------------------------------------------------------------
var FILLER = {
    de: 'der die das den dem des ein eine einen einem einer mir mich mein meine meinen meiner meinem meines dir dich bitte mal doch denn es ist sind wird habe hab hat bin du ich wir sie er zu fur von im am an auf mit',
    es: 'el la los las un una unos unas mi mis me te se lo le por favor es esta estan estoy soy son tengo tiene tienes que de del al en con para tu tus',
    fr: 'le la les l un une des du de d mon ma mes me moi toi tu je j il elle on s est sont a ai as ont y en au aux svp vous plait ce cette',
    it: 'il lo la i gli le un uno una mio mia miei mie mi ti si per favore sono ho ha hanno di del della dei al alla in con ci',
    pl: 'mi mnie moj moja moje moich mojej mojego mam jest sa to sie na w z do dla od przez prosze czy ten ta',
    ru: 'у меня мой моя моё мои мне я ты мы вы это эти этот есть быть в на с по для от ли же бы пожалуйста мою моих моей',
    hi: 'मेरे मेरा मेरी मुझे मैं हैं है हूँ हूं था थी को का की के में से पर पास करो कर करें दो दीजिए कृपया क्या कोई तो भी'
};
var FILLSET = {};
Object.keys(FILLER).forEach(function (k) { FILLSET[k] = {}; FILLER[k].split(' ').forEach(function (w) { FILLSET[k][normText(w)] = 1; }); });

var INDEX = {};

function buildIndex(lang) {
    var entries = [];
    var table = LEX[lang];
    Object.keys(table).forEach(function (concept) {
        var canon = CANON[concept];
        if (canon === undefined) return;
        table[concept].split(/\s+/).forEach(function (raw) {
            if (!raw) return;
            var prefix = false, w = raw;
            if (w.charAt(w.length - 1) === '*') { prefix = true; w = w.slice(0, -1); }
            var phrase = normText(w.replace(/_/g, ' '));
            if (!phrase) return;
            entries.push({ w: phrase, prefix: prefix, canon: canon, concept: concept, words: phrase.split(' ').length,
                          whole: (concept === 'yes' || concept === 'more') && isUnspaced(lang) });
        });
    });
    // frasa panjang dulu
    entries.sort(function (a, b) { return (b.w.length - a.w.length); });
    var exact = {};
    entries.forEach(function (e) { if (!exact[e.w]) exact[e.w] = e; });
    return { list: entries, exact: exact };
}

function idx(lang) {
    if (!INDEX[lang]) INDEX[lang] = buildIndex(lang);
    return INDEX[lang];
}

export function supportedLexLangs() { return Object.keys(LEX); }

function lev1(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, d = 0;
    while (i < la && j < lb) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++d > 1) return false;
        if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return d + (la - i) + (lb - j) <= 1;
}

function lookupWord(index, tok) {
    var hit = index.exact[tok];
    if (hit) return hit;
    var best = null, bestLen = 0, i, e;
    for (i = 0; i < index.list.length; i++) {
        e = index.list[i];
        if (e.words > 1) continue;
        if (e.prefix && tok.length >= e.w.length && tok.indexOf(e.w) === 0 && e.w.length > bestLen) { best = e; bestLen = e.w.length; }
    }
    if (best) return best;
    if (tok.length >= 6) {
        for (i = 0; i < index.list.length; i++) {
            e = index.list[i];
            if (e.words > 1 || e.w.length < 6) continue;
            if (lev1(tok, e.w)) return e;
        }
    }
    return null;
}

// ------------------------------------------------------------
// Angka dengan satuan lokal -> angka polos ("5万" -> "50000")
// ------------------------------------------------------------
function expandNumbers(s, lang) {
    var t = s;
    if (lang === 'zh' || lang === 'ja') {
        t = t.replace(/(\d+(?:\.\d+)?)\s*(百万|万|千)/g, function (_, n, u) {
            var f = u === '百万' ? 1000000 : u === '万' ? 10000 : 1000;
            return ' ' + Math.round(parseFloat(n) * f) + ' ';
        });
    } else if (lang === 'ko') {
        t = t.replace(/(\d+(?:\.\d+)?)\s*(백만|만|천)/g, function (_, n, u) {
            var f = u === '백만' ? 1000000 : u === '만' ? 10000 : 1000;
            return ' ' + Math.round(parseFloat(n) * f) + ' ';
        });
    } else if (lang === 'hi') {
        t = t.replace(/(\d+(?:\.\d+)?)\s*(करोड़|करोड|लाख|हज़ार|हजार)/g, function (_, n, u) {
            var f = (u.indexOf('करोड') === 0) ? 10000000 : u === 'लाख' ? 100000 : 1000;
            return ' ' + Math.round(parseFloat(n) * f) + ' ';
        });
    } else {
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*(tausend|mil|mille|mila|tys|тыс|mln|млн)\b/g, function (_, n, u) {
            var f = /mln|млн/.test(u) ? 1000000 : 1000;
            return ' ' + Math.round(parseFloat(n.replace(',', '.')) * f) + ' ';
        });
    }
    return t;
}

// ------------------------------------------------------------
// Penerjemah ke bentuk kanonis
// ------------------------------------------------------------
function translateSpaced(text, lang) {
    var index = idx(lang);
    var toks = text.split(' ');
    var out = [], i = 0;
    while (i < toks.length) {
        var done = false, span;
        for (span = Math.min(5, toks.length - i); span >= 2 && !done; span--) {
            var ph = toks.slice(i, i + span).join(' ');
            var h = index.exact[ph];
            if (h) { out.push(h.canon); i += span; done = true; }
        }
        if (done) continue;
        var tk = toks[i];
        var e = /^\d/.test(tk) ? null : lookupWord(index, tk);
        if (e) out.push(e.canon);
        else if (!(FILLSET[lang] && FILLSET[lang][tk])) out.push(tk);
        i++;
    }
    return out.join(' ');
}

function translateUnspaced(text, lang) {
    var index = idx(lang);
    var compact = text.replace(/\s+/g, ' ');
    var out = [], i = 0, n = compact.length;
    var maxLen = 0;
    index.list.forEach(function (e) { if (e.w.length > maxLen) maxLen = e.w.length; });
    while (i < n) {
        var ch = compact.charAt(i);
        if (ch === ' ') { i++; continue; }
        if (/[a-z0-9$%]/.test(ch)) {
            var j = i;
            while (j < n && /[a-z0-9$%.,]/.test(compact.charAt(j))) j++;
            out.push(compact.slice(i, j));
            i = j;
            continue;
        }
        var matched = false, len;
        for (len = Math.min(maxLen, n - i); len >= 1 && !matched; len--) {
            var piece = compact.substr(i, len);
            var e = index.exact[piece];
            if (e && (!e.whole || (i === 0 && len === n))) { out.push(e.canon); i += len; matched = true; }
        }
        if (!matched) i++; // partikel / karakter tak dikenal dibuang
    }
    return out.join(' ');
}

function fixWordOrder(s) {
    // "engineer 2" -> "2 engineer" (urutan bahasa Asia: peran lalu jumlah)
    return s.replace(/\b(engineer|designer|marketer)\s+(\d+)\b(?!\s*(engineer|designer|marketer))/g, '$2 $1');
}

// Hasil: { lang, canon, changed }. langs: daftar bahasa yang dicoba berurutan.
export function canonicalize(text, gameLang) {
    var raw = String(text || '');
    var lang = detectLang(raw, gameLang);
    var native = (lang === 'id' || lang === 'en' || lang === null);
    if (native && !(gameLang && LEX[gameLang] && lang === null)) {
        return { lang: lang || gameLang || 'en', canon: raw, changed: false };
    }
    var use = LEX[lang] ? lang : (LEX[gameLang] ? gameLang : null);
    if (!use) return { lang: lang, canon: raw, changed: false };
    var norm = expandNumbers(normText(raw), use);
    var spaced = !isUnspaced(use);
    var out = spaced ? translateSpaced(norm, use) : translateUnspaced(norm, use);
    out = fixWordOrder(out).replace(/\s+/g, ' ').trim();
    if (use === 'ko' || use === 'ja' || use === 'zh') {
        // Korea tetap memakai spasi antar kata: terjemahkan juga hasil segmentasi per kata bila belum ada hasil
        if (!out) out = '';
    }
    return { lang: use, canon: out || raw, changed: true };
}
