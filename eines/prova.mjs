/**
 * JEFE — proves del nucli
 *
 *   npm run prova     (i també des de `npm run puja`)
 *
 * Executa el codi de debò dels fitxers del nucli fora d'Apps Script, amb
 * dobles a sota en lloc de Google Sheets. No toca cap dada teva.
 *
 * Aquí hi va el que es pot comprovar sense el full: decisions de codi amb
 * regles clares. El que depèn de dades reals es comprova a l'app.
 */
import fs from 'fs';
import vm from 'vm';
import zlib from 'zlib';

let falles = 0;
function cal(nom, cond, extra) {
  console.log((cond ? '  ok   ' : '  FALLA') + '  ' + nom + (cond ? '' : '  → ' + extra));
  if (!cond) falles++;
}

/* EL PANY. El de debò el posa Apps Script; aquí n'hi ha prou amb un que digui
   que sí i porti el compte de quantes vegades l'han demanat, que és el que
   les proves d'escriptura volen mirar: que cap escriptura no hi passi per
   sobre. `panys.demanats` es posa a zero quan una prova vol comptar. */
const panys = { demanats: 0, alliberats: 0 };
function panyFals() {
  return {
    getScriptLock: () => ({
      tryLock: () => { panys.demanats++; return true; },
      releaseLock: () => { panys.alliberats++; }
    })
  };
}


/**
 * Carrega TOT el servidor en un sol espai global, com fa Apps Script.
 *
 * Els blocs d aquest fitxer solen carregar un fitxer sol, i n hi ha prou. Per
 * a les coses que travessen el nucli i un modul —els avisos programats, per
 * exemple— no: alla el que es comprova es precisament que es trobin.
 */
function carregaTotElServidor() {
  const ctx = {
    console, Date, JSON, Math, RegExp, Number, String, Object, Array,
    isFinite, isNaN, parseFloat, parseInt, encodeURIComponent, decodeURIComponent,
    Utilities: {}, DriveApp: {}, SpreadsheetApp: {}, UrlFetchApp: {}, CacheService: {},
    LockService: panyFals(), Session: {}, HtmlService: {}, CalendarApp: {}, MailApp: {},
    ContentService: {}, Logger: { log() {} }, ScriptApp: {},
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).sort()
    .forEach((f) => vm.runInContext(fs.readFileSync('apps-script/' + f, 'utf8'), ctx, { filename: f }));
  return ctx;
}

// ---------------------------------------------------------------- encaminador
console.log('\nEncaminador: escriure i tornar la pantalla en una sola crida');
{
  const CLAU = 'la-clau-bona-de-quaranta-vuit-caracters-exactes';
  const ctx = {
    Date, Log: { error() {}, avis() {} },
    Utils: { avui: () => '2026-08-01', ara: () => 'ara' },
    Moduls: null, Config: null, IA: null, Esquema: null, ScriptApp: null,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => CLAU }) },
    ContentService: null, HtmlService: null,
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    /* El resum de debò el fa Apps Script. Aquí n'hi ha prou amb un que
       torni bytes diferents per a textos diferents i sempre la mateixa
       llargada, que és el que la comparació dona per fet. */
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_alg, text) => {
        const b = new Array(32).fill(0);
        for (let i = 0; i < String(text).length; i++) {
          b[i % 32] = (b[i % 32] + String(text).charCodeAt(i) * (i + 7)) % 251;
        }
        return b;
      }
    },
    VERSIO_JEFE: 'prova', PROP_CLAU_ACCES: 'CLAU_ACCES'
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/30_Encaminador.gs', 'utf8'), ctx);

  let vistos = null;
  ctx.Moduls = {
    perId: () => ({
      accions: {
        captura: (p) => { vistos = JSON.parse(JSON.stringify(p)); return { id: 'tsk_1' }; },
        pantalla: (p) => ({ soc: 'la pantalla', params: p })
      }
    })
  };

  const r = ctx.api(CLAU, 'tasques', 'captura', { text: 'comprar pa', _pantalla: {} });
  cal('respon ok', r.ok === true, JSON.stringify(r));
  cal('torna el resultat de l\'escriptura', r.dades._resultat.id === 'tsk_1', JSON.stringify(r.dades));
  cal('torna la pantalla refeta', r.dades._pantalla.soc === 'la pantalla', JSON.stringify(r.dades));
  cal('l\'acció NO veu `_pantalla`', vistos && vistos._pantalla === undefined, JSON.stringify(vistos));
  cal('l\'acció sí que veu els seus paràmetres', vistos.text === 'comprar pa', JSON.stringify(vistos));

  // Sense demanar-la, tot ha de quedar exactament com abans.
  const r2 = ctx.api(CLAU, 'tasques', 'captura', { text: 'x' });
  cal('sense `_pantalla`, resposta de tota la vida', r2.dades.id === 'tsk_1', JSON.stringify(r2.dades));

  // `pantalla` demanant-se a si mateixa no s'ha de duplicar.
  const r3 = ctx.api(CLAU, 'tasques', 'pantalla', { _pantalla: {} });
  cal('`pantalla` no es crida a si mateixa', r3.dades.soc === 'la pantalla', JSON.stringify(r3.dades));

  // Un mòdul sense `pantalla` no ha de petar.
  ctx.Moduls.perId = () => ({ accions: { fes: () => 'fet' } });
  const r4 = ctx.api(CLAU, 'qualsevol', 'fes', { _pantalla: {} });
  cal('mòdul sense pantalla: no peta', r4.ok === true && r4.dades === 'fet', JSON.stringify(r4));
}

/* ---------------------------------------------------------------- la porta
   El desplegament és anònim: qualsevol que tingui l'adreça rep la pàgina i
   pot cridar el servidor des de la consola. La clau era només a `doPost`,
   o sigui que aquell camí entrava sense ensenyar-la. Això ho vigila. */
console.log('\nLa porta: cap crida sense clau, vingui d\'on vingui');
{
  const CLAU = 'la-clau-bona-de-quaranta-vuit-caracters-exactes';
  const apuntat = [];
  const ctx = {
    Date, Log: { error() {}, avis: (q, t, d) => apuntat.push(q) },
    Utils: { avui: () => '2026-08-01', ara: () => 'ara' },
    Moduls: { perId: () => ({ accions: { llegeix: () => 'les teves dades' } }) },
    Config: { idFull: () => 'FULL-123' },
    IA: null, Esquema: null, ScriptApp: null,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => CLAU }) },
    ContentService: null, HtmlService: null,
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_alg, text) => {
        const b = new Array(32).fill(0);
        for (let i = 0; i < String(text).length; i++) {
          b[i % 32] = (b[i % 32] + String(text).charCodeAt(i) * (i + 7)) % 251;
        }
        return b;
      }
    },
    VERSIO_JEFE: 'prova', PROP_CLAU_ACCES: 'CLAU_ACCES'
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/30_Encaminador.gs', 'utf8'), ctx);

  const bona = ctx.api(CLAU, 'finances', 'llegeix', {});
  cal('amb la clau bona, entra', bona.ok === true && bona.dades === 'les teves dades', JSON.stringify(bona));

  const dolenta = ctx.api('una-clau-inventada-qualsevol-de-48-caracters', 'finances', 'llegeix', {});
  cal('amb una clau dolenta, no entra', dolenta.ok === false, JSON.stringify(dolenta));
  cal('i no diu res del que hi havia a dins',
      !/les teves dades/.test(JSON.stringify(dolenta)), JSON.stringify(dolenta));
  cal('i ho deixa apuntat', apuntat.indexOf('api.rebutjat') !== -1, JSON.stringify(apuntat));

  cal('sense clau, no entra', ctx.api(undefined, 'finances', 'llegeix', {}).ok === false);
  cal('amb la clau buida, tampoc', ctx.api('', 'finances', 'llegeix', {}).ok === false);

  /* LA CRIDA D'ABANS TENIA TRES ARGUMENTS i el primer era el mòdul. Si algun
     client vell sobreviu en una pestanya oberta, ha de fallar i no colar-se
     pel forat: cap nom de mòdul no és mai la clau. */
  cal('una crida de les d\'abans no s\'hi cola',
      ctx.api('finances', 'llegeix', {}).ok === false);

  /* La llargada de la clau bona tampoc s'ha de poder endevinar provant. */
  cal('una clau d\'una lletra es rebutja igual', ctx.api('x', 'finances', 'llegeix', {}).ok === false);

  // El servidor sense clau posada ho ha de dir, no callar.
  ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: () => null }) };
  const sense = ctx.api(CLAU, 'finances', 'llegeix', {});
  cal('servidor sense clau configurada: ho diu', sense.ok === false && /generaClauAcces/.test(sense.error), JSON.stringify(sense));

  /* EL QUE S'INJECTA A LA PÀGINA QUE SE SERVEIX SENSE CLAU.
     Hi anava `estatSistema()` sencer, amb l'identificador i l'URL del full. */
  ctx.Moduls.perAlClient = () => [{ id: 'finances', nom: 'Finances' }];
  const pub = ctx.estatPublic_();
  cal('la pàgina pública porta els mòduls', pub.moduls.length === 1, JSON.stringify(pub));
  cal('i no porta l\'adreça del full', !/FULL-123/.test(JSON.stringify(pub)), JSON.stringify(pub));

  cal('el text d\'un error s\'escapa', ctx.escapaHtml_('<script>x</script>').indexOf('<') === -1,
      ctx.escapaHtml_('<script>x</script>'));
}

// ------------------------------------------------------------- actualitzaMoltes
console.log('\nDades.actualitzaMoltes: escriu per trams seguits');
{
  const escriptures = [];
  const capcalera = ['id', 'estat', 'esborrat_el'];
  const files = [];
  for (let i = 1; i <= 10; i++) files.push(['t' + i, 'feta', '']);

  const fulla = {
    getDataRange: () => ({ getValues: () => [capcalera].concat(files) }),
    getRange: (fila, c, n) => ({
      setValues: (v) => { escriptures.push({ fila, n, v }); }
    }),
    getMaxRows: () => 100
  };

  const ctx = {
    Utils: { nouId: () => 'x', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => fulla }) },
    LockService: panyFals(), Moduls: undefined
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), ctx);

  // t2,t3,t4 seguits · t7 sol · t9,t10 seguits  →  3 escriptures, no 6
  const n = ctx.Dades.actualitzaMoltes('Tasques', ['t3', 't10', 't2', 't7', 't4', 't9'],
                                       { esborrat_el: 'ARA' });
  cal('diu quantes n\'ha tocat', n === 6, String(n));
  cal('agrupa en 3 escriptures i no 6', escriptures.length === 3,
      escriptures.map(e => e.fila + '×' + e.n).join(' '));
  cal('els trams són els que toca',
      escriptures.map(e => e.fila + '×' + e.n).sort().join(' ') === '10×2 3×3 8×1',
      escriptures.map(e => e.fila + '×' + e.n).sort().join(' '));
  cal('escriu el canvi', escriptures[0].v[0][2] === 'ARA', JSON.stringify(escriptures[0].v[0]));
  cal('no toca el que no li han dit',
      escriptures.every(e => e.v.every(f => ['t2','t3','t4','t7','t9','t10'].indexOf(f[0]) !== -1)),
      JSON.stringify(escriptures.map(e => e.v.map(f => f[0]))));

  // Un id que no hi és no ha de fer caure res.
  escriptures.length = 0;
  const n2 = ctx.Dades.actualitzaMoltes('Tasques', ['no_existeix'], { estat: 'x' });
  cal('id inexistent: no escriu res', n2 === 0 && escriptures.length === 0, String(n2));

  // Amb una funció, cada fila rep uns canvis diferents. És el que fa possible
  // reordenar una llista: el mateix camp amb un valor per fila.
  escriptures.length = 0;
  const capcalera2 = ['id', 'ordre'];
  const files2 = [['a', 9], ['b', 9], ['c', 9]];
  const fulla2 = {
    getDataRange: () => ({ getValues: () => [capcalera2].concat(files2) }),
    getRange: (fila, c, n) => ({ setValues: (v) => { escriptures.push({ fila, n, v }); } }),
    getMaxRows: () => 100
  };
  ctx.Config.full = () => ({ getSheetByName: () => fulla2 });
  ctx.Dades.invalida();

  const n3 = ctx.Dades.actualitzaMoltes('Habits', ['c', 'a', 'b'],
                                        (h, i) => ({ ordre: i + 1 }));
  const escrits = escriptures.flatMap(e => e.v).map(f => f[0] + ':' + f[1]).sort().join(' ');
  cal('amb funció, cada fila rep el seu valor', n3 === 3 && escrits === 'a:2 b:3 c:1', escrits);
}

/* ------------------------------------------------------- cap escriptura sola
   «Mirar on acaba el full» i «escriure-hi» eren dos moments i entremig hi
   cabia una altra pestanya: totes dues escrivien a la mateixa fila i la
   segona es menjava la primera. El pany hi era —`ambBloqueig_`— però només
   el demanaven els automatismes de la nit, no el que toques tu. */
console.log('\nEscriure al full: cap escriptura no va sola');
{
  const capcalera = ['id', 'text', 'creat_el'];
  const files = [['t1', 'una', 'ARA']];
  const fulla = {
    getDataRange: () => ({ getValues: () => [capcalera].concat(files) }),
    getRange: () => ({ setValues: () => {} }),
    getLastRow: () => files.length + 1,
    getMaxRows: () => 100,
    insertRowsAfter: () => {}
  };
  const ctx = {
    Utils: { nouId: () => 'nou', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => fulla }) },
    LockService: panyFals(), Moduls: undefined
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), ctx);

  const prova = (nom, fn) => {
    panys.demanats = 0; panys.alliberats = 0;
    ctx.Dades.invalida();
    fn();
    cal(nom + ' demana el pany', panys.demanats === 1, String(panys.demanats));
    cal(nom + ' el torna', panys.alliberats === 1, String(panys.alliberats));
  };

  prova('inserir', () => ctx.Dades.insereix('Tasques', { text: 'dues' }));
  prova('actualitzar', () => ctx.Dades.actualitza('Tasques', 't1', { text: 'canviada' }));
  prova('desar', () => ctx.Dades.desa('Tasques', { id: 't1', text: 'x' }, ['id']));
  prova('inserir-ne moltes', () => ctx.Dades.insereixMoltes('Tasques', [{ text: 'a' }, { text: 'b' }]));
  prova('actualitzar-ne moltes', () => ctx.Dades.actualitzaMoltes('Tasques', ['t1'], { text: 'y' }));

  /* UN DINS DE L'ALTRE NO EN SÓN DOS. `desa` acaba cridant `insereix`, i els
     resums de la nit ja s'executen dins d'un bloqueig: si cadascú en demanés
     un de nou, el fil s'esperaria a si mateix. */
  panys.demanats = 0; ctx.Dades.invalida();
  ctx.Dades.desa('Tasques', { id: 'cap', text: 'nova' }, ['id']);
  cal('un pany dins d\'un altre no en demana dos', panys.demanats === 1, String(panys.demanats));

  panys.demanats = 0; ctx.Dades.invalida();
  ctx.ambBloqueig_(function () {
    ctx.Dades.insereix('Tasques', { text: 'dins' });
    ctx.Dades.insereix('Tasques', { text: 'dins també' });
  });
  cal('i el de fora val per a tot el que hi passi', panys.demanats === 1, String(panys.demanats));

  /* I quan el pany no es pot agafar, l'escriptura no es fa d'amagat. */
  ctx.LockService = { getScriptLock: () => ({ tryLock: () => false, releaseLock() {} }) };
  let peta = false;
  try { ctx.Dades.insereix('Tasques', { text: 'sense pany' }); }
  catch (e) { peta = /ocupat/.test(e.message); }
  cal('si el pany no s\'agafa, no s\'escriu i es diu', peta === true);
}

// -------------------- parlar amb en JEFE no ha d'esborrar la fitxa que el fa rapid
console.log("");
console.log("La fitxa de la IA: nomes es llenca quan canvia alguna cosa que hi surt");
{
  const moduls = [
    { id: 'conversa', nom: 'JEFE',
      fulls: [{ nom: 'Converses' }] },                       // sense contextIA
    { id: 'habits', nom: 'Habits',
      fulls: [{ nom: 'Habits' }, { nom: 'Registres' }],
      contextIA: function () { return 'habits'; } },
    { id: 'calendari', nom: 'Calendari',
      fulls: [{ nom: 'Calendaris' }],
      contextIA: function () { return 'calendari'; } }
  ];

  let esborrades = 0;
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => ({
      get: () => null, getAll: () => ({}), put: () => {}, putAll: () => {},
      remove: () => { esborrades++; },
      removeAll: (ks) => { if (ks.length) esborrades++; } }) },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Dades: null, Esquema: {}, IA: {}, Utils: { ara: () => 'ara', avui: () => '2026-08-02' },
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  // Els mòduls es descobreixen per `globalThis`: se n'hi posen tres de mentida.
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  cal('el full de converses NO alimenta la fitxa',
      ctx.Moduls.alimentaContext('Converses') === false, 'diu que sí');
  cal('els registres d hàbits SÍ', ctx.Moduls.alimentaContext('Registres') === true, 'diu que no');
  cal('els calendaris SÍ', ctx.Moduls.alimentaContext('Calendaris') === true, 'diu que no');
  cal('els aparells de les notificacions NO',
      ctx.Moduls.alimentaContext('_Dispositius') === false, 'diu que sí');
  cal('el registre NO', ctx.Moduls.alimentaContext('_Registre') === false, 'diu que sí');
  cal('la configuració SÍ, que allà hi ha els objectius',
      ctx.Moduls.alimentaContext('_Config') === true, 'diu que no');
  cal('un full que no és de ningú, sí: davant del dubte, es torna a muntar',
      ctx.Moduls.alimentaContext('UnFullQueNoConec') === true, 'diu que no');

  // I ara el camí de debò: escriure passa per Dades.invalida.
  const dadesCtx = {
    Utils: { nouId: () => 'x', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => ({
      getDataRange: () => ({ getValues: () => [['id']] }),
      getRange: () => ({ setValues: () => {} }), getMaxRows: () => 10 }) }) },
    LockService: panyFals(), Moduls: ctx.Moduls
  };
  vm.createContext(dadesCtx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), dadesCtx);

  esborrades = 0;
  dadesCtx.Dades.invalida('Converses');
  cal('escriure una conversa no llença la fitxa', esborrades === 0, String(esborrades));

  dadesCtx.Dades.invalida('_Dispositius');
  cal('obrir l app tampoc', esborrades === 0, String(esborrades));

  dadesCtx.Dades.invalida('Registres');
  cal('marcar un hàbit sí que la llença', esborrades === 1, String(esborrades));

  dadesCtx.Dades.invalida();
  cal('i sense dir quin full, també: no se sap què ha canviat', esborrades === 2, String(esborrades));
}

// --------------- la fitxa es munta per trossos: marcar un habit no toca finances
console.log("");
console.log("La fitxa de la IA: per trossos, no d'una peca");
{
  const muntats = [];
  const moduls = [
    { id: 'conversa', fulls: [{ nom: 'Converses' }] },
    { id: 'habits', fulls: [{ nom: 'Habits' }, { nom: 'Registres' }],
      contextIA: function () { muntats.push('habits'); return 'HABITS: en falten 3'; } },
    { id: 'finances', fulls: [{ nom: 'Moviments' }, { nom: 'Categories' }],
      contextIA: function () { muntats.push('finances'); return 'FINANCES: 400 EUR'; } },
    { id: 'calendari', fulls: [{ nom: 'Calendaris' }],
      contextIA: function () { muntats.push('calendari'); return 'CALENDARI: res'; } }
  ];

  const memoria = {};
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => ({
      get: (k) => (memoria[k] === undefined ? null : memoria[k]),
      getAll: (ks) => { const o = {}; ks.forEach(k => { if (memoria[k] !== undefined) o[k] = memoria[k]; }); return o; },
      put: (k, v) => { memoria[k] = v; },
      putAll: (o) => { Object.keys(o).forEach(k => { memoria[k] = o[k]; }); },
      remove: (k) => { delete memoria[k]; },
      removeAll: (ks) => { ks.forEach(k => { delete memoria[k]; }); }
    }) },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Dades: null, Esquema: {}, IA: {}, Utils: { ara: () => 'ara', avui: () => '2026-08-02' },
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  const primera = ctx.Moduls.contextIA();
  cal('el primer cop els munta tots', muntats.sort().join(' ') === 'calendari finances habits',
      muntats.join(' '));
  cal('i la fitxa porta els tres', primera.indexOf('HABITS') !== -1 &&
      primera.indexOf('FINANCES') !== -1 && primera.indexOf('CALENDARI') !== -1, primera);

  muntats.length = 0;
  ctx.Moduls.contextIA();
  cal('el segon cop no en munta cap', muntats.length === 0, muntats.join(' '));

  // AIXO ES EL QUE IMPORTA: marcar un habit no ha de tornar a llegir finances.
  muntats.length = 0;
  ctx.Moduls.invalidaContext('Registres');
  const desprès = ctx.Moduls.contextIA();
  cal('marcar un habit nomes torna a muntar habits',
      muntats.join(' ') === 'habits', muntats.join(' ') || '(cap)');
  cal('i la fitxa segueix sencera', desprès.indexOf('FINANCES') !== -1 &&
      desprès.indexOf('CALENDARI') !== -1, desprès);

  // Una despesa nomes toca finances.
  muntats.length = 0;
  ctx.Moduls.invalidaContext('Moviments');
  ctx.Moduls.contextIA();
  cal('apuntar una despesa nomes torna a muntar finances',
      muntats.join(' ') === 'finances', muntats.join(' ') || '(cap)');

  // Un full de ningu no se sap que ha tocat: es tomben tots.
  muntats.length = 0;
  ctx.Moduls.invalidaContext('_Config');
  ctx.Moduls.contextIA();
  cal('un full que no es de cap modul els tomba tots',
      muntats.sort().join(' ') === 'calendari finances habits', muntats.join(' '));

  // I sense dir quin full, tambe.
  muntats.length = 0;
  ctx.Moduls.invalidaContext();
  ctx.Moduls.contextIA();
  cal('i sense dir res, tambe', muntats.length === 3, String(muntats.length));

  // El full de converses no ha de tombar res.
  muntats.length = 0;
  if (ctx.Moduls.alimentaContext('Converses')) ctx.Moduls.invalidaContext('Converses');
  ctx.Moduls.contextIA();
  cal('parlar segueix sense tombar res', muntats.length === 0, muntats.join(' '));
}

// ------------------- el que s'envia a Gemini: audio, eines i que no rumii per res
console.log("");
console.log("Transport a Gemini: la forma de la peticio");
{
  let enviat = null;
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp, encodeURIComponent,
    Log: { info() {}, avis() {}, error() {} },
    Config: {
      get: (k) => ({ model_bo: 'gemini-2.5-flash', model_barat: 'gemini-2.5-flash',
                     proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null,
      getNum: (k, d) => (k === 'pensa_tokens' ? 0 : d),
      esSi: () => true
    },
    Utils: { desJson: (t, d) => { try { return JSON.parse(t); } catch (e) { return d; } },
             talla: (t, n) => String(t).slice(0, n), ara: () => 'ara', avui: () => '2026-08-02' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'clau-de-mentida' }) },
    UrlFetchApp: { fetch: (url, o) => {
      enviat = { url: url, cos: JSON.parse(o.payload), capcaleres: o.headers };
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'fet' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 2, thoughtsTokenCount: 314 } }) };
    } },
    CacheService: { getScriptCache: () => null },
    SpreadsheetApp: {}, Session: {}, HtmlService: {}, LockService: panyFals(),
    Utilities: {}, ScriptApp: {}, Dades: {}, Moduls: {}, Esquema: {}
  };
  vm.createContext(ctx);
  ctx.PROP_CLAU_IA = 'CLAU_IA';
  vm.runInContext(fs.readFileSync('apps-script/50_IA.gs', 'utf8'), ctx);

  const r0 = ctx.IA.genera({
    sistema: 'ets en JEFE',
    missatges: [
      { rol: 'usuari', text: 'hola' },
      { role: 'user', parts: [{ text: 'aixo t ha dit de veu:' },
                              { inline_data: { mime_type: 'audio/wav', data: 'UklGRg==' } }] }
    ],
    eines: [{ nom: 'mostra_el_dia', descripcio: 'obre el dia',
              esquema: { type: 'object', properties: { data: { type: 'string' } } } }],
    model: 'bo', maxTokens: 1200, temperatura: 0
  });

  cal('la clau va a la capcalera i mai a l url',
      !!ctx.IA && enviat.capcaleres['x-goog-api-key'] === 'clau-de-mentida' &&
      enviat.url.indexOf('clau-de-mentida') === -1, enviat.url);

  cal('diu quant ha rumiat, amb la xifra de Google i no una suposada',
      r0.tokensPensats === 314, JSON.stringify(r0.tokensPensats));

  const parts = enviat.cos.contents[1].parts;
  cal("l'audio arriba tal qual, sense passar per cap transcripcio",
      parts[1].inline_data.mime_type === 'audio/wav' && parts[1].inline_data.data === 'UklGRg==',
      JSON.stringify(parts));
  cal('i el torn de text d abans hi segueix sent',
      enviat.cos.contents[0].parts[0].text === 'hola', JSON.stringify(enviat.cos.contents[0]));

  cal("amb l'audio hi van les EINES: les ordres d'accio han de seguir anant",
      enviat.cos.tools[0].functionDeclarations[0].name === 'mostra_el_dia',
      JSON.stringify(enviat.cos.tools));

  // AIXO ES EL QUE COSTAVA DEU SEGONS.
  cal('no se li deixa rumiar abans de contestar',
      enviat.cos.generationConfig.thinkingConfig.thinkingBudget === 0,
      JSON.stringify(enviat.cos.generationConfig));

  // I amb un model que no ho enten, aquest camp fa petar l'API: no s hi ha de posar.
  enviat = null;
  ctx.Config.get = (k) => ({ model_bo: 'gemini-1.5-pro', proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'hola' }], model: 'bo' });
  // I si el model es queixa, s'hi torna sense i se'n recorda.
  var intents = 0;
  ctx.UrlFetchApp.fetch = (url, o) => {
    intents++;
    enviat = { url: url, cos: JSON.parse(o.payload) };
    if (enviat.cos.generationConfig.thinkingConfig) {
      return { getResponseCode: () => 400,
               getContentText: () => JSON.stringify({ error: { message: 'invalid argument' } }) };
    }
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'fet' }] } }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } }) };
  };
  ctx.Config.get = (k) => ({ model_bo: 'gemini-2.5-pro', proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null;
  var r2 = ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'hola' }], model: 'bo' });
  cal('si no accepta el zero, baixa al minim i respon igual',
      intents === 3 && r2.text === 'fet', intents + ' intents');
  cal('i si ni amb el minim, es deixa corrent',
      enviat.cos.generationConfig.thinkingConfig === undefined,
      JSON.stringify(enviat.cos.generationConfig));

  // EL CAS QUE IMPORTA: n'hi ha que accepten el minim encara que no el zero.
  // Abans queien directament a «rumia el que vulguis» i alla se n'anaven els
  // segons que preteniem estalviar.
  intents = 0;
  ctx.UrlFetchApp.fetch = (url, o) => {
    intents++;
    enviat = { url: url, cos: JSON.parse(o.payload) };
    var t = enviat.cos.generationConfig.thinkingConfig;
    if (t && t.thinkingBudget === 0) {
      return { getResponseCode: () => 400,
               getContentText: () => JSON.stringify({ error: { message: 'budget must be >= 128' } }) };
    }
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'fet' }] } }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } }) };
  };
  ctx.Config.get = (k) => ({ model_bo: 'un-altre-model', proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'hola' }], model: 'bo' });
  cal('amb un que vol un minim, s hi queda i no el deixa lliure',
      intents === 2 && enviat.cos.generationConfig.thinkingConfig.thinkingBudget === 128,
      intents + ' intents · ' + JSON.stringify(enviat.cos.generationConfig.thinkingConfig));

  intents = 0;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'i ara' }], model: 'bo' });
  cal('i la seguent ja va directa al minim',
      intents === 1 && enviat.cos.generationConfig.thinkingConfig.thinkingBudget === 128,
      intents + ' intents');

  // I la seguent pregunta al mateix model ja no ho torna a provar.
  intents = 0;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'i ara' }], model: 'bo' });
  cal('i no ho torna a provar cada vegada', intents === 1, intents + ' intents');
}

// ------------------- una ordre dita de veu no ha de passar pel model
console.log("");
console.log("Veu: les ordres es reconeixen despres de transcriure, sense preguntar");
{
  const moduls = [
    { id: 'conversa', fulls: [{ nom: 'Converses' }],
      dreceres: [{ vista: 'dia', frases: ['pagina del dia', 'pagina d avui', 'full del dia'] }] },
    { id: 'habits', fulls: [{ nom: 'Habits' }], contextIA: function () { return 'habits'; } }
  ];
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => null },
    Config: { full: () => ({ getSheetByName: () => null }), zonaHoraria: () => 'Europe/Madrid' },
    Utilities: { formatDate: () => '2026-08-02' },
    Dades: { llegeix: () => [] }, Esquema: {}, IA: {},
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/01_Utils.gs', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  const d = (t) => { const r = ctx.Moduls.drecera(t); return r ? r.vista : null; };

  cal("amb accents i apostrof, com ho diu una persona",
      d("Ensenya'm la pàgina del dia") === 'dia', String(d("Ensenya'm la pàgina del dia")));
  cal('sense accents, igual', d('obre la pagina del dia') === 'dia', String(d('obre la pagina del dia')));
  cal('en majuscules, igual', d("ENSENYA LA PÀGINA D'AVUI") === 'dia',
      String(d("ENSENYA LA PÀGINA D'AVUI")));
  cal('amb signes pel mig, igual', d("va, ensenya-m'ho: la pàgina del dia!") === 'dia',
      String(d("va, ensenya-m'ho: la pàgina del dia!")));

  cal('una pregunta de debo NO es una ordre', d('quants cigarros he fumat avui') === null,
      String(d('quants cigarros he fumat avui')));
  cal('ni aquesta', d('com ha anat el dia') === null, String(d('com ha anat el dia')));
  cal('ni res buit', d('') === null && d(null) === null, 'diu que si');

  // La bessona del client ha de fer exactament el mateix.
  cal("l'aixafat treu accents, signes i espais de mes",
      ctx.Utils.aixafa("  Ensenya'm  la PÀGINA del dia!! ") === 'ensenya m la pagina del dia',
      ctx.Utils.aixafa("  Ensenya'm  la PÀGINA del dia!! "));
}

// --------- les pantalles desades: rapides, pero mai amb una dada vella
console.log("");
console.log("Memoria de pantalles: desar sense mentir");
{
  const memoria = {};
  const cau = {
    get: (k) => (memoria[k] === undefined ? null : memoria[k]),
    getAll: (ks) => { const o = {}; ks.forEach(k => { if (memoria[k] !== undefined) o[k] = memoria[k]; }); return o; },
    put: (k, v) => { memoria[k] = v; },
    putAll: (o) => { Object.keys(o).forEach(k => { memoria[k] = o[k]; }); },
    remove: (k) => { delete memoria[k]; },
    removeAll: (ks) => { ks.forEach(k => { delete memoria[k]; }); }
  };

  const moduls = [
    { id: 'tasques', fulls: [{ nom: 'Tasques' }] },
    { id: 'finances', fulls: [{ nom: 'Moviments' }, { nom: 'Categories' }] }
  ];

  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => cau },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Utils: { avui: () => '2026-08-02', ara: () => 'ara' },
    Dades: null, Esquema: {}, IA: {}, SpreadsheetApp: {}, PropertiesService: {},
    ScriptApp: {}, HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('apps-script/25_Memoria.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  let muntades = 0;
  const pantalla = (modul, nom, valor) =>
    ctx.Memoria.recorda(modul, nom, () => { muntades++; return { v: valor }; });

  // 1. La segona vegada no es torna a muntar.
  cal('la primera vegada la munta', pantalla('tasques', 'pantalla', 1).v === 1 && muntades === 1,
      String(muntades));
  muntades = 0;
  cal('la segona ja no', pantalla('tasques', 'pantalla', 1).v === 1 && muntades === 0,
      String(muntades));

  // 2. Dues pantalles diferents del mateix modul no es trepitgen.
  muntades = 0;
  const a = pantalla('finances', 'pantalla:mes:2026-08', 'agost');
  const b = pantalla('finances', 'pantalla:mes:2026-07', 'juliol');
  cal('cada pantalla te la seva clau', a.v === 'agost' && b.v === 'juliol' && muntades === 2,
      a.v + '/' + b.v + ' · ' + muntades);

  // 3. I ARA EL QUE IMPORTA: escriure ha de tombar el que sigui d'aquell modul.
  const dadesCtx = {
    Utils: { nouId: () => 'x', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => ({
      getDataRange: () => ({ getValues: () => [['id']] }),
      getRange: () => ({ setValues: () => {} }), getMaxRows: () => 10 }) }) },
    LockService: panyFals(), Moduls: ctx.Moduls, Memoria: ctx.Memoria
  };
  vm.createContext(dadesCtx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), dadesCtx);

  muntades = 0;
  dadesCtx.Dades.invalida('Moviments');
  pantalla('finances', 'pantalla:mes:2026-08', 'agost NOU');
  cal('apuntar un moviment tomba la pantalla de finances', muntades === 1, String(muntades));
  cal('i la torna a muntar amb el que hi ha ara',
      pantalla('finances', 'pantalla:mes:2026-08', 'x').v === 'agost NOU', 'ensenya la vella');

  // 4. I no ha de tombar la del vei.
  muntades = 0;
  pantalla('tasques', 'pantalla', 'no importa');
  cal('i no toca la de tasques, que no ha canviat', muntades === 0, String(muntades));

  // 5. Un full de ningu no se sap que ha tocat: cauen totes.
  muntades = 0;
  dadesCtx.Dades.invalida('_Config');
  pantalla('tasques', 'pantalla', 'z');
  pantalla('finances', 'pantalla:mes:2026-08', 'z');
  cal('canviar la configuracio les tomba totes', muntades === 2, String(muntades));

  // 6. I sense dir quin full, tambe.
  muntades = 0;
  dadesCtx.Dades.invalida();
  pantalla('tasques', 'pantalla', 'w');
  cal('i sense dir res, tambe', muntades === 1, String(muntades));

  // 7. EL CALAIX COMU: el que suma tots els moduls cau amb qualsevol escriptura.
  muntades = 0;
  ctx.Memoria.recordaComu('inici', () => { muntades++; return { v: 1 }; });
  ctx.Memoria.recordaComu('inici', () => { muntades++; return { v: 1 }; });
  cal('el calaix comu tambe es desa', muntades === 1, String(muntades));

  muntades = 0;
  dadesCtx.Dades.invalida('Tasques');          // una escriptura d'un modul qualsevol
  ctx.Memoria.recordaComu('inici', () => { muntades++; return { v: 2 }; });
  cal("qualsevol escriptura tomba el comu, sigui d'on sigui", muntades === 1, String(muntades));

  // I no ha de durar mitja hora: hi ha el calendari a dins, que no surt de cap full.
  const abansPut = memoria['gen_nucli'];
  cal('el comu te el seu calaix a part', typeof abansPut === 'string', String(abansPut));

  // 8. Sense memoria cau, ha de seguir funcionant.
  ctx.CacheService.getScriptCache = () => { throw new Error('sense cau'); };
  muntades = 0;
  const r = pantalla('tasques', 'pantalla', 'sense cau');
  cal('sense memoria cau munta igual i no peta', r.v === 'sense cau' && muntades === 1,
      String(muntades));
}

// ----------- les targetes d'inici es desen, menys les del que no surt d'un full
console.log("");
console.log("Inici: cada targeta desada a casa seva, i el calendari mai");
{
  const memoria = {};
  const cau = {
    get: (k) => (memoria[k] === undefined ? null : memoria[k]),
    getAll: (ks) => { const o = {}; ks.forEach(k => { if (memoria[k] !== undefined) o[k] = memoria[k]; }); return o; },
    put: (k, v) => { memoria[k] = v; }, putAll: (o) => { Object.keys(o).forEach(k => { memoria[k] = o[k]; }); },
    remove: (k) => { delete memoria[k]; }, removeAll: (ks) => { ks.forEach(k => { delete memoria[k]; }); }
  };

  const comptador = { finances: 0, calendari: 0, tasques: 0 };
  const moduls = [
    { id: 'finances', nom: 'Finances', fulls: [{ nom: 'Moviments' }],
      resumInici: function () { comptador.finances++; return { etiqueta: 'Balanç', valor: '400 €' }; } },
    { id: 'tasques', nom: 'Tasques', fulls: [{ nom: 'Tasques' }],
      resumInici: function () { comptador.tasques++; return { etiqueta: 'Per fer', valor: 3 }; } },
    // El calendari NO surt del seu full: no s'ha de desar mai.
    { id: 'calendari', nom: 'Calendari', volatil: true, fulls: [{ nom: 'Calendaris' }],
      resumInici: function () { comptador.calendari++; return { etiqueta: 'El següent', valor: '17:00' }; } }
  ];

  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => cau },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Utils: { avui: () => '2026-08-02', ara: () => 'ara' },
    Dades: { llegeix: () => [] }, Esquema: {}, IA: {},
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/25_Memoria.gs', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  const t1 = ctx.Moduls.resumInici();
  cal('la primera vegada les munta totes',
      comptador.finances === 1 && comptador.tasques === 1 && comptador.calendari === 1,
      JSON.stringify(comptador));
  cal('i surten totes tres', t1.length === 3, String(t1.length));
  cal('amb el mòdul a dins', t1[0].modul === 'finances', JSON.stringify(t1[0]));

  ctx.Moduls.resumInici();
  cal('la segona no torna a muntar les que surten del full',
      comptador.finances === 1 && comptador.tasques === 1, JSON.stringify(comptador));
  cal('PERO EL CALENDARI SI: el que ensenya no surt del seu full',
      comptador.calendari === 2, String(comptador.calendari));

  // I escriure a finances no ha de tocar la targeta de tasques.
  ctx.Memoria.oblida('finances');
  ctx.Moduls.resumInici();
  cal('escriure a finances només torna a muntar la de finances',
      comptador.finances === 2 && comptador.tasques === 1, JSON.stringify(comptador));
}


// -------------------------------------------------- avisos programats dels mòduls
/* El pic de divendres al matí és l'única raó per la qual el mòdul de seguiment
   existeix: un xat no pot obrir conversa sol. Si això s'espatlla, el mòdul
   deixa de servir per al que serveix i no ho notaria ningú fins divendres. */
console.log('\nAvisos: un mòdul pot demanar hora sense que el nucli el conegui');
{
  const ctx = carregaTotElServidor();

  let triggers = [];
  const cadena = (nom) => {
    const t = { fn: nom, hora: null, minut: null };
    const c = {};
    ['timeBased', 'everyDays', 'everyMinutes', 'everyHours', 'onWeekDay', 'onMonthDay']
      .forEach((m) => { c[m] = () => c; });
    c.atHour = (h) => { t.hora = h; return c; };
    c.nearMinute = (m) => { t.minut = m; return c; };
    c.create = () => { if (t.hora !== null) triggers.push(t); };
    return c;
  };
  ctx.ScriptApp = { newTrigger: (n) => cadena(n), getProjectTriggers: () => [],
                    WeekDay: { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
                               FRIDAY: 5, SATURDAY: 6, SUNDAY: 7 } };
  ctx.Config = { getNum: (k, d) => ({ hora_resum: 23, dia_revisio: 7, hora_revisio: 23 }[k] ?? d),
                 get: () => null };
  ctx.Log = { info() {}, avis() {}, error() {} };
  ctx.treuTriggers = () => {};
  ctx.ambBloqueig_ = (f) => f();

  let enviades = [];
  /* `junta` és de debò i no un doble: és el que ajunta el que diu el mòdul amb
     el cos, i si es doblés no es comprovaria el que arriba de veritat. */
  const juntaDeDebo = (a, b) => (!a ? b : !b ? a : a + (/[.!?:;·…]$/.test(a) ? ' ' : '. ') + b);
  ctx.Notifica = { junta: juntaDeDebo,
                   envia: (t, c, o) => { enviades.push({ titol: t, cos: c, url: o.url }); return {}; } };

  ctx.instalaTriggers();
  const seus = triggers.filter((t) => t.fn === 'triggerAvisos');
  cal('es crea una hora de trigger per cada hora que demana un mòdul',
      seus.length === 1 && seus[0].hora === 6, JSON.stringify(seus));

  /* SENSE `nearMinute` L'AVÍS ARRIBA QUAN VOL DINS D'UNA HORA, i el control
     setmanal ja va picar un divendres a les 7:37 amb en Pol camí de l'escola.
     Que la finestra sigui d'un quart i no d'una hora és el que fa que demanar
     les sis vulgui dir alguna cosa. */
  cal('els avisos dels mòduls demanen el minut, no només l\'hora',
      seus[0].minut === 0, JSON.stringify(seus));

  /* Les combinacions que importen. La que ha d'enviar és una de sola:
     DIUMENGE, a les sis, i amb el control encara per fer.

     El dia ja no és un número escrit al codi: el mòdul el llegeix del seu full
     de pla. Aquí es falseja aquesta lectura, que és exactament el forat pel
     qual el dia i l'avís es podrien tornar a separar. */
  const quan = (iso) => { ctx.Date = class extends Date { constructor() { super(iso); } }; };
  let diaDelPla = 7;
  ctx.Seguiment.diaDelControl = () => diaDelPla;
  const prova = (iso, fet) => {
    enviades = [];
    ctx.Seguiment.estat = () => ({ fetAquestaSetmana: fet });
    quan(iso);
    ctx.triggerAvisos();
    return enviades.length;
  };

  cal('diumenge a les 6 amb el control per fer: pica',
      prova('2026-08-09T06:10:00', false) === 1);
  cal('diumenge a les 6 amb el control ja fet: calla',
      prova('2026-08-09T06:10:00', true) === 0);
  cal('dissabte a les 6: no és el seu dia',
      prova('2026-08-08T06:10:00', false) === 0);
  cal('divendres a les 6 ja no pica: el dia s\'ha mogut',
      prova('2026-08-07T06:10:00', false) === 0);
  cal('diumenge a les 15: no és la seva hora',
      prova('2026-08-09T15:15:00', false) === 0);
  cal('diumenge a les 7: l\'avís de les sis ja ha passat, no es repeteix',
      prova('2026-08-09T07:15:00', false) === 0);

  /* EL QUART DE MENYS. `nearMinute(0)` pot picar ABANS de l'hora, i llavors el
     rellotge diu una hora que ningú no ha demanat. Si això no s'arrodonís,
     l'avís no s'enviaria i no ho sabria ningú. */
  cal('diumenge a les 5:50 encara compta com l\'avís de les sis',
      prova('2026-08-09T05:50:00', false) === 1);
  cal('diumenge a les 5:30 encara no toca',
      prova('2026-08-09T05:30:00', false) === 0);

  /* I l'arrodoniment ha de moure el DIA quan travessa la mitjanit: a les 23:50
     de dissabte, l'avís de les 0h és el de diumenge. Aquí es comprova al revés
     —dissabte a les 23:50 no és diumenge a les sis— però amb la mateixa peça. */
  cal('dissabte a les 23:50 no dispara res de diumenge que no sigui de les 0h',
      prova('2026-08-08T23:50:00', false) === 0);

  /* CANVIAR EL DIA AL FULL HA DE MOURE L'AVÍS, sense tornar a instal·lar res.
     Aquest és tot el motiu del canvi: abans el dia estava escrit dos cops —al
     full i al codi— i moure'n un deixava l'altre picant on no tocava. */
  diaDelPla = 3;
  cal('si al full hi posa dimecres, pica dimecres',
      prova('2026-08-05T06:10:00', false) === 1);
  cal('i llavors el diumenge calla', prova('2026-08-09T06:10:00', false) === 0);

  /* I si no es pot saber quin dia toca, NO pica cada dia. `dia: null` vol dir
     diàriament, i caure-hi per una avaria seria un avís cada matí a les sis
     fins que algú se n'adonés. */
  diaDelPla = null;
  ctx.Seguiment.diaDelControl = () => { throw new Error('el full de pla no hi és'); };
  const capDia = [prova('2026-08-09T06:10:00', false), prova('2026-08-05T06:10:00', false),
                  prova('2026-08-07T06:10:00', false)];
  cal('si no se sap quin dia toca, no pica cap dia',
      capDia.join('') === '000', capDia.join(''));
  ctx.Seguiment.diaDelControl = () => 7;

  /* Un mòdul que peti no se n'ha d'emportar cap altre: és la mateixa regla que
     a `elDia` i a `resumInici`, i aquí encara importa més perquè ningú no ho
     està mirant quan passa. */
  enviades = [];
  ctx.Seguiment.estat = () => { throw new Error('el full no hi és'); };
  quan('2026-08-07T06:10:00');
  let ha_petat = false;
  try { ctx.triggerAvisos(); } catch (e) { ha_petat = true; }
  cal('un avís que peta es registra i no tomba el repartidor', !ha_petat);

  /* CANVIAR L'HORA AL MÒDUL NO CANVIA L'AUTOMATISME que ja hi ha: els triggers
     miren l'hora quan es creen i mai més. I comptar-los no ho veu —n'hi ha un i
     n'hi ha d'haver un—, o sigui que l'avís arribaria a l'hora vella i el
     diagnòstic diria que tot va bé. Per això `instalaTriggers` apunta les hores
     i `provaAvisos` les compara. */
  let apuntat = null;
  ctx.PropertiesService = { getScriptProperties: () => ({
    getProperty: () => apuntat, setProperty: (k, v) => { apuntat = v; } }) };
  ctx.ScriptApp.getProjectTriggers = () => [{ getHandlerFunction: () => 'triggerAvisos' }];
  ctx.Notifica.disponible = () => false;
  ctx.Notifica.motiu = () => 'no és una prova de notificacions';
  ctx.Seguiment.estat = () => ({ fetAquestaSetmana: true });

  ctx.instalaTriggers();
  cal('en instal·lar, queda apuntat a quines hores han quedat els avisos',
      apuntat === '[6]', String(apuntat));
  cal('i acabats d\'instal·lar, el diagnòstic no es queixa de l\'hora',
      !/hora vella/.test(ctx.provaAvisos()));

  apuntat = '[7]';
  const informe = ctx.provaAvisos();
  cal('si el mòdul ha canviat d\'hora i ningú no ha reinstal·lat, ho diu',
      /FALLA/.test(informe) && /hora vella/.test(informe), informe);
  cal('i diu quina hora hi ha posada i quina es demana',
      /les 7h/.test(informe) && /les 6h/.test(informe), informe);
}


// --------------------------------------- les dues còpies de les regles del seguiment
/* HI HA DUES IMPLEMENTACIONS DE LES MATEIXES REGLES, i és a posta: al navegador
   perquè el veredicte surti sense cap viatge, i al servidor perquè `elDia`,
   `resumInici` i el context de la IA no passen pel navegador.

   Dues còpies deriven. I derivarien EN SILENCI: la pantalla diria una cosa i la
   notificació una altra, i tu no ho sabries fins que et fixessis. Això les fa
   córrer totes dues sobre els mateixos casos i compara què en surt. */
console.log('\nSeguiment: la còpia del navegador i la del servidor diuen el mateix');
{
  const font = fs.readFileSync('apps-script/40_Mod_Seguiment.gs', 'utf8');
  const vista = fs.readFileSync('apps-script/vista_seguiment.html', 'utf8');

  // --- la del servidor
  const srvFont = font.slice(font.indexOf('var Seguiment = (function ()'),
                             font.lastIndexOf('})();') + 5);
  const srvCtx = {
    Utils: { avui: () => '2026-08-03' }, Dades: { llegeix: () => [] },
    Log: { info() {}, avis() {}, error() {} }, IA: { disponible: () => false },
    Memoria: {}, Date, Math, Number, String, JSON, parseFloat, isFinite, Object, Array
  };
  vm.createContext(srvCtx);
  vm.runInContext(srvFont.replace('var Seguiment =', 'var Seguiment ='), srvCtx);
  const servidor = srvCtx.Seguiment;

  // --- la del navegador
  /* Es talla per on comencen les utilitats i per on s'acaben les regles. El
     final era «gràfiques», i el dia que la gràfica va sortir de la vista
     —perquè el visor també la fes servir— aquest tall va deixar de trobar
     res. Ara s'agafa pel que de debò delimita el que es prova. */
  const i0 = vista.indexOf('    function coma(n, dec) {');
  const i1 = vista.indexOf('    // -------------------------------------------------------------- capçalera');
  cal('es troba la còpia del navegador dins de la vista', i0 > 0 && i1 > i0);
  const cliCtx = { Date, Math, Number, String, JSON, Object, Array };
  vm.createContext(cliCtx);
  vm.runInContext(vista.slice(i0, i1) + '\nvar __regles = Regles;', cliCtx);
  const client = cliCtx.__regles;

  /* Els casos que importen: cadascun dispara una regla diferent, i n'hi ha un
     per cada error que el motor de referència tenia. */
  const L = servidor.LLINDAR;
  const c = (data, pes, cintura, valida, forca, trail, gros, energia) =>
    ({ data, pes, cintura, cinturaValida: valida, forca, trail, trailGros: gros,
       energia: energia || '', son: '', gana: '', dieta: '' });

  const CASOS = [
    ['ritme bo', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 69.4, 84.5, true, 2, 3, 0)]],
    ['massa ràpid', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 68.5, 84, true, 2, 3, 0)]],
    ['salt impossible', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 87, 84, true, 2, 3, 0)]],
    ['senyal bo', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 70.2, 84.5, true, 2, 3, 0)]],
    ['cintura incoherent', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 70.1, 82, true, 2, 3, 0)]],
    ['poca força', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 69.5, 84.5, true, 0, 3, 0)]],
    ['trail gros', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 69.5, 84.5, true, 2, 4, 2)]],
    ['energia baixa dues vegades', [c('2026-01-02', 70, 85, true, 2, 3, 0, 'baixa'),
                                    c('2026-01-09', 69.5, 84.5, true, 2, 3, 0, 'baixa')]],
    // Els tres que el motor de Python feia malament:
    ['interval de 10 dies', [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-12', 69.3, 84.5, true, 2, 3, 0)]],
    ['cintura marcada com a dolenta', [c('2026-01-02', 70, 89, false, 2, 3, 0),
                                       c('2026-01-09', 70.1, 84, true, 2, 3, 0)]],
    ['cintura de referència vella', [c('2026-01-02', 70, 85, true, 2, 3, 0),
                                     c('2026-01-09', 69.6, null, true, 2, 3, 0),
                                     c('2026-01-16', 69.2, 84.6, true, 2, 3, 0)]]
  ];

  let iguals = 0, diferents = [];
  CASOS.forEach(([nom, h]) => {
    for (let i = 0; i < h.length; i++) {
      const s = servidor.analitza(h, i).map((a) => a.id + ':' + a.nivell).sort().join(' ');
      const n = client.analitza(h, i, L).map((a) => a.id + ':' + a.nivell).sort().join(' ');
      if (s === n) iguals++;
      else diferents.push(nom + ' [' + i + ']  servidor=«' + s + '»  navegador=«' + n + '»');
    }
    const vs = servidor.veredicte(servidor.analitza(h, h.length - 1));
    const vn = client.veredicte(client.analitza(h, h.length - 1, L));
    if (vs !== vn) diferents.push(nom + ' veredicte  servidor=«' + vs + '»  navegador=«' + vn + '»');
  });

  cal('les dues còpies donen les mateixes regles a tots els casos',
      diferents.length === 0, '\n      ' + diferents.join('\n      '));
  cal('i s\'han comparat prou casos', iguals >= 20, iguals + ' comparacions');

  /* ══════════════════════════════════════════════════════════════════════
     UN CONTROL FET UN DIA ABANS NO POT DEIXAR L'AVÍS ENCÈS TOTA LA SETMANA

     En Pol va fer el control dissabte i el dia del control passava a diumenge.
     La pregunta era la bona: «si no el responc, tindré tota la setmana l'avís
     de que no he fet el seguiment?». La resposta havia de ser que no —dissabte
     i diumenge són la mateixa setmana ISO— i ho era per a la notificació, per
     al dia i per als senyals. Però NO per a la targeta de l'inici: preguntava
     per `toca`, que vol dir «ja ha arribat el dia», i deia «pendent» en vermell
     amb el control ja fet.
     ══════════════════════════════════════════════════════════════════════ */
  {
    const controls = [{ id: 's1', data: '2026-08-08', pes: 69.5, cintura: 82.5,
                        cintura_valida: 'SI', forca: 2, trail: 3, trail_gros: 1 }];
    const plaFiles = [{ clau: 'control.dia', valor: '7' }];
    const mira = (avui) => {
      const c = {
        Utils: { avui: () => avui, talla: (s, n) => String(s).slice(0, n), esDataValida: () => true },
        Dades: { llegeix: (f) => (f === 'Seguiment' ? controls
                                : f === 'SeguimentPla' ? plaFiles : []) },
        Log: { info() {}, avis() {}, error() {} },
        IA: { disponible: () => false, motiu: () => 'x' },
        Memoria: { recorda: (a, b, fer) => fer() },
        Date, Math, Number, String, JSON, parseFloat, isFinite, Object, Array
      };
      vm.createContext(c);
      vm.runInContext(fs.readFileSync('apps-script/40_Mod_Seguiment.gs', 'utf8'), c);
      const mod = c.MODUL_SEGUIMENT();
      /* EL MATEIX FILTRE QUE FA `triggerAvisos`: `mira()` només es crida el
         dia que l'avís demana. Sense el filtre, dimecres «picaria» —perquè la
         setmana nova encara no té control— i la prova diria una cosa que no
         passa mai. */
      const a = mod.avisos[0];
      const demana = typeof a.dia === 'function' ? a.dia() : a.dia;
      const avuiDia = (new Date(avui + 'T12:00:00').getDay() + 6) % 7 + 1;
      return { targeta: mod.resumInici(),
               avis: demana === avuiDia && !!a.mira(),
               dia: mod.elDia(avui), senyals: c.Seguiment.senyals().length };
    };

    const dissabte = mira('2026-08-08');
    cal('el mateix dia que el fas, la targeta no crida i diu «avui»',
        dissabte.targeta.urgent === false && dissabte.targeta.valor === 'avui',
        JSON.stringify(dissabte.targeta));

    /* L'endemà ÉS el dia del control, però el de la setmana ja està fet. */
    const diumenge = mira('2026-08-09');
    cal('l\'endemà, que és el dia del control, la targeta segueix sense cridar',
        diumenge.targeta.urgent === false && diumenge.targeta.valor === 'fa 1 d',
        JSON.stringify(diumenge.targeta));
    cal('i l\'avís de les sis calla, perquè la setmana ja té control',
        diumenge.avis === false);
    cal('i no surt ni al dia ni als senyals',
        diumenge.dia === null && diumenge.senyals === 0);

    /* Ni la resta de la setmana. */
    const dimecres = mira('2026-08-12');
    cal('ni a mitja setmana', dimecres.targeta.urgent === false &&
        dimecres.avis === false && dimecres.senyals === 0);

    /* I el diumenge SEGÜENT sí: aquell ja és d'una altra setmana. */
    const seguent = mira('2026-08-16');
    cal('i el diumenge següent torna a reclamar, que és el que ha de fer',
        seguent.targeta.urgent === true && seguent.avis === true &&
        seguent.senyals === 1 && seguent.dia !== null,
        JSON.stringify(seguent.targeta));
  }

  /* EL DIA DEL CONTROL, EN UN SOL LLOC.
     N'hi havia dos que havien de dir el mateix: el `dia: 5` del descriptor de
     l'avís i el `control.dia` del full del pla. Mentre coincidien no es notava;
     moure'n un hauria deixat l'altre picant on no toca, i en silenci. */
  const fontSeg = fs.readFileSync('apps-script/40_Mod_Seguiment.gs', 'utf8');
  cal('el dia de l\'avís no és un número escrit al codi',
      /dia: function \(\) \{ return Seguiment\.diaDelControl\(\); \}/.test(fontSeg));
  cal('i la pantalla llegeix el mateix dia que l\'avís',
      /var diaSetmana = diaDelControl\(\);/.test(fontSeg));
  cal('i per defecte és diumenge, que és quan s\'acaba la setmana',
      /return \(d >= 1 && d <= 7\) \? d : 7;/.test(fontSeg));
  const fontMod = fs.readFileSync('apps-script/20_Moduls.gs', 'utf8');
  cal('el nucli sap demanar el dia en calent',
      /if \(typeof dia === 'function'\)/.test(fontMod));

  /* Els tres arreglos respecte del motor de referència, comprovats un per un
     perquè si algú els desfés, la prova de dalt seguiria passant —les dues
     còpies estarien igual de malament—. */
  const regles = (h, i) => servidor.analitza(h, i).map((a) => a.id);

  /* EL CAS HA DE DISTINGIR. −1,0 kg en 10 dies son −0,70/setmana: franja bona.
     Sense normalitzar —que es el que feia el motor de referencia— serien
     −1,0/setmana i saltaria «massa rapid». I al reves: −0,5 kg en 4 dies son
     −0,875/setmana, massa; sense normalitzar semblarien una setmana bona.
     Amb aquests dos, desfer l arreglo trenca la prova. */
  const deuDies = [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-12', 69, 84.5, true, 2, 3, 0)];
  cal('10 dies i −1,0 kg són −0,70/setmana, no −1,0: franja bona',
      regles(deuDies, 1).indexOf('ritme_bo') !== -1 &&
      regles(deuDies, 1).indexOf('massa_rapid') === -1,
      JSON.stringify(regles(deuDies, 1)));

  const quatreDies = [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-06', 69.5, 84.5, true, 2, 3, 0)];
  cal('4 dies i −0,5 kg són −0,875/setmana: massa, i es diu que l interval és curt',
      regles(quatreDies, 1).indexOf('massa_rapid') !== -1 &&
      regles(quatreDies, 1).indexOf('interval_rar') !== -1,
      JSON.stringify(regles(quatreDies, 1)));

  const dolenta = [c('2026-01-02', 70, 89, false, 2, 3, 0), c('2026-01-09', 70.1, 84, true, 2, 3, 0)];
  cal('una cintura marcada com a dolenta no genera cap senyal',
      regles(dolenta, 1).indexOf('senyal_bo') === -1 &&
      regles(dolenta, 1).indexOf('cintura_incoherent') === -1,
      JSON.stringify(regles(dolenta, 1)));

  const gros = [c('2026-01-02', 70, 85, true, 2, 3, 0), c('2026-01-09', 69.5, 84.5, true, 2, 4, 2)];
  cal('els dies de trail gros avisen (la regla que no s\'havia implementat mai)',
      regles(gros, 1).indexOf('trail_gros') !== -1, JSON.stringify(regles(gros, 1)));
}

// ------------------------------------------------- les fotos serveixen per a algú
/* DURANT UN ANY LES FOTOS VAN SER UNA GALERIA, i una galeria no serveix de res:
   les té al telèfon i es veu cada dia al mirall. El que no pot fer sol és posar
   la primera i l'última del mateix angle una sobre l'altra. Això prova que la
   comparació es munti així —la més vella contra la d'ara, per angle, amb les
   xifres del dia al costat— i que hi vagin imatges de debò i no una descripció
   que el model s'hauria de creure. */
console.log('\nSeguiment: les fotos es comparen, no s\'ensenyen');
{
  const font = fs.readFileSync('apps-script/40_Mod_Seguiment.gs', 'utf8');
  const srvFont = font.slice(font.indexOf('var Seguiment = (function ()'),
                             font.lastIndexOf('})();') + 5);

  /* Tres controls: el primer amb frontal i perfil, el segon sense cap, el
     tercer amb frontal i esquena. Cada angle cau en un cas diferent. */
  const files = [
    { id: 's1', data: '2026-06-05', pes: 71.4, cintura: 88, cintura_valida: 'SI',
      forca: 2, trail: 3, trail_gros: 0,
      foto_frontal: 'F1', foto_perfil: 'P1', foto_esquena: '' },
    { id: 's2', data: '2026-06-12', pes: 70.8, cintura: 86, cintura_valida: 'SI',
      forca: 2, trail: 3, trail_gros: 1,
      foto_frontal: '', foto_perfil: '', foto_esquena: '' },
    { id: 's3', data: '2026-06-19', pes: 69.9, cintura: 84, cintura_valida: 'SI',
      forca: 2, trail: 3, trail_gros: 0,
      foto_frontal: 'F3', foto_perfil: '', foto_esquena: 'E3' }
  ];

  const munta = (hiHaIA) => {
    let enviat = null, obertes = [];
    const ctx = {
      Utils: { avui: () => '2026-06-19', talla: (s, n) => String(s).slice(0, n) },
      Dades: { llegeix: (full) => (full === 'Seguiment' ? files : []) },
      Log: { info() {}, avis() {}, error() {} },
      IA: { disponible: () => hiHaIA, motiu: () => 'no hi ha clau',
            genera: (p) => { enviat = p; return { text: 'la lectura' }; } },
      DriveApp: { getFileById: (id) => { obertes.push(id); return {
        getBlob: () => ({ getContentType: () => 'image/jpeg', getBytes: () => [1, 2, 3] }) }; } },
      Utilities: { base64Encode: () => 'AQID' },
      Memoria: {}, Date, Math, Number, String, JSON, parseFloat, isFinite, Object, Array
    };
    vm.createContext(ctx);
    vm.runInContext(srvFont, ctx);
    return { S: ctx.Seguiment, dit: () => enviat, obertes };
  };

  const m = munta(true);
  const r = m.S.analitzaFotos('2026-06-19');
  const parts = m.dit().missatges[0].parts;
  const imatges = parts.filter((p) => p.inlineData);
  const textos = parts.filter((p) => p.text).map((p) => p.text);

  cal('hi van imatges de debò i no una descripció',
      imatges.length === 4 && imatges.every((p) => p.inlineData.mimeType === 'image/jpeg'),
      imatges.length + ' imatges');
  cal('i el compte que torna és el que ha enviat', r.fotos === 4, String(r.fotos));

  cal('del frontal compara la més vella amb la d\'ara',
      textos.some((t) => /de front — ABANS, 2026-06-05/.test(t)) &&
      textos.some((t) => /de front — ARA, 2026-06-19/.test(t)),
      textos.join(' | '));

  /* El control d'ara no té perfil. Comparar-lo amb res seria perdre l'angle;
     s'agafa l'última que en tingui, encara que sigui la mateixa. */
  cal('un angle sense foto en aquest control agafa l\'última que en tingui',
      textos.some((t) => /de perfil — ARA, 2026-06-05/.test(t)) &&
      !textos.some((t) => /de perfil — ABANS/.test(t)),
      textos.join(' | '));

  /* Un angle estrenat avui no té amb què comparar-se, i no s'inventa cap parella. */
  cal('un angle amb una sola foto va sol i sense parella',
      textos.filter((t) => /d'esquena/.test(t)).length === 1, textos.join(' | '));

  cal('cada foto porta les xifres del seu dia',
      /71,4 kg/.test(textos.join(' ')) && /69,9 kg/.test(textos.join(' ')),
      textos.join(' | '));

  /* La instrucció és la meitat de la feina: sense demanar-li ON mira, contesta
     el que contesten tots. I sense permís per dir «no es veu res», se n'inventa. */
  const sis = String(m.dit().sistema || '');
  cal('se li demana on mira, i que pugui dir que no veu cap canvi',
      /QUÈ HI VEUS I ON/.test(sis) && /Si no es veu cap canvi/.test(sis), sis.slice(0, 80));

  /* Un control d'un dia que no existeix no ha de petar: es mira l'últim. */
  cal('una data desconeguda cau a l\'últim control',
      munta(true).S.analitzaFotos('2020-01-01').data === '2026-06-19');

  let quePassa = '';
  try { munta(false).S.analitzaFotos('2026-06-19'); } catch (e) { quePassa = e.message; }
  cal('sense capa d\'IA ho diu en comptes de fer veure que ha mirat',
      /no hi ha clau/.test(quePassa), quePassa);

  /* EL COMENTARI DEL CONTROL: EL QUE LI ARRIBA, NO EL MODEL.
     Amb dos controls i cap objectiu no es pot dir res que un xat qualsevol no
     digui millor, i això és exactament el que en Pol va notar. El que es prova
     aquí és que hi vagi el tram sencer i el que demana la fase. */
  const ambPla = {
    'pla.resum': 'Dèficit moderat, proteïna alta, trail com a prioritat.',
    'fase.1.desde': '2026-06-01', 'fase.1.nom': 'Base', 'fase.1.objectiu': 'més magre',
    'fase.1.forca': '3', 'fase.1.trail': '4', 'fase.1.kcal': '2000'
  };
  let ditAlCoach = null;
  const ctxC = {
    Utils: { avui: () => '2026-06-19', talla: (s, n) => String(s).slice(0, n) },
    Dades: { llegeix: (full) => (full === 'Seguiment' ? files
      : Object.keys(ambPla).map((k) => ({ clau: k, valor: ambPla[k] }))) },
    Log: { info() {}, avis() {}, error() {} },
    IA: { disponible: () => true, motiu: () => null,
          genera: (p) => { ditAlCoach = p; return { text: 'el comentari' }; } },
    DriveApp: {}, Utilities: {}, Memoria: {},
    Date, Math, Number, String, JSON, parseFloat, isFinite, Object, Array
  };
  vm.createContext(ctxC);
  vm.runInContext(srvFont, ctxC);
  ctxC.Seguiment.comenta('2026-06-19');
  const quediu = String(ditAlCoach.missatges[0].parts[0].text);

  cal('al comentari hi va el tram sencer, no dos controls',
      /2026-06-05/.test(quediu) && /2026-06-12/.test(quediu) && /2026-06-19/.test(quediu),
      quediu.slice(0, 120));
  cal('i el que demana la fase, que és el que fa que un número vulgui dir alguna cosa',
      /3 sessions de força/.test(quediu) && /4 sortides de trail/.test(quediu), quediu);
  cal('i el resum del pla', /Dèficit moderat/.test(quediu));
  cal('i se li diu quin és l\'últim de la llista',
      /2026-06-19.*← aquest/.test(quediu), quediu);
  cal('i té espai per lligar-ho', ditAlCoach.maxTokens >= 500,
      String(ditAlCoach.maxTokens));

  /* LA CÀRREGA DE DEBÒ AL COSTAT DEL CONTROL.
     «3 trail» no distingeix tres sortides planes de tres amb mil sis-cents
     metres, i aquesta és justament la diferència que explica per què una
     setmana ha anat com ha anat. Aquí es prova que hi arribi —i, sobretot,
     que el seguiment segueixi sencer si el mòdul d'entrenaments no hi és: el
     que mana en aquesta pantalla és el cos, i la càrrega és context. */
  cal('sense el mòdul d\'entrenaments, el seguiment funciona igual',
      !/entrenat:/.test(quediu) && ctxC.Seguiment.pantalla().carregues &&
      Object.keys(ctxC.Seguiment.pantalla().carregues).length === 0);

  let ditAmbCarrega = null;
  const ctxE = Object.assign({}, ctxC, {
    IA: { disponible: () => true, motiu: () => null,
          genera: (p) => { ditAmbCarrega = p; return { text: 'x' }; } },
    Entrenaments: {
      sessions: () => [{ data: '2026-06-19', mena: 'trail', kmEsforc: 25 }],
      setmana: (dl) => (dl === '2026-06-15'
        ? { sessions: 3, trail: 3, forca: 0, km: 30, desnivell: 1600,
            kmEsforc: 46, llargues: 2 }
        : { sessions: 0, trail: 0, forca: 0, km: 0, desnivell: 0, kmEsforc: 0, llargues: 0 })
    }
  });
  vm.createContext(ctxE);
  vm.runInContext(srvFont, ctxE);

  const ambC = ctxE.Seguiment.pantalla().carregues;
  cal('amb el mòdul, la càrrega arriba a la pantalla per dilluns',
      ambC['2026-06-15'] && ambC['2026-06-15'].kmEsforc === 46, JSON.stringify(ambC));
  cal('i les setmanes sense cap entrenament queden a null, no a zero',
      ambC['2026-06-08'] === null || ambC['2026-06-08'] === undefined,
      JSON.stringify(ambC));

  ctxE.Seguiment.comenta('2026-06-19');
  const textC = String(ditAmbCarrega.missatges[0].parts[0].text);
  cal('i al comentari hi va la càrrega de la setmana, no el nombre de sortides',
      /entrenat: 46 km-esforç/.test(textC) && /1600 m D\+/.test(textC),
      textC.slice(0, 400));
  cal('i se li diu que no parli de sortides quan tingui la càrrega',
      /No parlis de sortides quan tinguis la càrrega/.test(String(ditAmbCarrega.sistema)));
}

// ------------------------------------------------- els entrenaments: la càrrega
/* LA QUEIXA, LITERAL: «canvia molt un entreno de 2 km amb 0 de desnivell a un de
   6 km amb 1000 de desnivell». Comptant sortides els dos són «1». Això prova que
   els quilòmetres d'esforç els separin, i que la setmana sencera també: quatre
   sortides planes contra tres amb desnivell de debò. Si algú toqués la fórmula,
   aquestes dues assercions cauen abans que ningú s'ho miri a la pantalla. */
console.log('\nEntrenaments: dues sortides no són dues sortides');
{
  const font = fs.readFileSync('apps-script/40_Mod_Entrenaments.gs', 'utf8');
  const srvFont = font.slice(font.indexOf('var Entrenaments = (function ()'),
                             font.lastIndexOf('})();') + 5);

  const munta = (files, opcions) => {
    const o = opcions || {};
    let desats = [], seguit = 0, ditAlModel = null;
    const ctx = {
      Utils: {
        avui: () => o.avui || '2026-08-03',
        talla: (s, n) => String(s).slice(0, n),
        esDataValida: (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')),
        dillunsDe: (iso) => {
          const d = new Date(iso + 'T12:00:00');
          d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          return d.toISOString().slice(0, 10);
        },
        sumaDies: (iso, n) => {
          const d = new Date(iso + 'T12:00:00');
          d.setDate(d.getDate() + n);
          return d.toISOString().slice(0, 10);
        },
        rangDates: (a, b) => {
          const l = []; let d = new Date(a + 'T12:00:00');
          const f = new Date(b + 'T12:00:00');
          while (d <= f) { l.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
          return l;
        },
        desJson: (t, x) => { try { return JSON.parse(t); } catch (e) { return x; } }
      },
      Dades: {
        llegeix: (full) => (full === 'Entrenaments' ? files
                          : full === 'EntrenamentsPassos' ? (o.passos || []) : []),
        desa: (full, fila, claus, prefix) => {
          desats.push({ full, fila });
          return { id: prefix + (++seguit) };
        },
        perId: (full, id) => files.filter((f) => f.id === id)[0] || null,
        actualitza: (full, id, canvis) => { desats.push({ full, id, canvis }); }
      },
      Log: { info() {}, avis() {}, error() {} },
      IA: {
        disponible: () => o.ia !== false, motiu: () => 'no hi ha clau',
        genera: (p) => { ditAlModel = p; return { text: o.resposta || '{}' }; }
      },
      Memoria: {}, Date, Math, Number, String, JSON, parseFloat, isFinite, Object, Array
    };
    vm.createContext(ctx);
    vm.runInContext(srvFont, ctx);
    return { E: ctx.Entrenaments, desats, dit: () => ditAlModel };
  };

  const s = (data, mena, titol, km, des, min) =>
    ({ id: 'e' + data + titol, data, mena, titol, km, desnivell: des, minuts: min,
       kcal: '', pulsacions: '', font: 'captura', notes: '' });

  /* Els dos exemples seus, clavats. */
  const dos = munta([]).E;
  cal('6 km amb 1000 de desnivell són 16 km-esforç',
      dos.kmEsforc({ km: 6, desnivell: 1000 }) === 16,
      String(dos.kmEsforc({ km: 6, desnivell: 1000 })));
  cal('i 2 km plans en són 2, o sigui vuit vegades menys',
      dos.kmEsforc({ km: 2, desnivell: 0 }) === 2,
      String(dos.kmEsforc({ km: 2, desnivell: 0 })));
  cal('una sessió de força sense km ni desnivell no en té',
      dos.kmEsforc({ km: null, desnivell: null }) === null);

  /* LA SETMANA, QUE ÉS ON ES VEIA EL FORAT. Quatre sortides planes contra tres
     amb desnivell: amb el número de sortides la primera setmana guanya. */
  const planes = munta([
    s('2026-07-20', 'trail', 'A', 5, 30, 30), s('2026-07-21', 'trail', 'B', 5, 20, 30),
    s('2026-07-22', 'trail', 'C', 6, 40, 35), s('2026-07-23', 'trail', 'D', 5, 10, 30)
  ]).E.setmana('2026-07-20');
  const dures = munta([
    s('2026-07-27', 'trail', 'A', 8, 500, 60), s('2026-07-28', 'trail', 'B', 7, 450, 55),
    s('2026-07-29', 'trail', 'C', 14, 1100, 150)
  ]).E.setmana('2026-07-27');

  cal('comptant sortides, la setmana plana en té MÉS',
      planes.sessions === 4 && dures.sessions === 3,
      planes.sessions + ' vs ' + dures.sessions);
  cal('però amb més sortides no arriba ni a la meitat de la càrrega',
      planes.kmEsforc * 2 < dures.kmEsforc,
      planes.kmEsforc + ' vs ' + dures.kmEsforc);
  cal('i la més dura de la setmana és la de catorze quilòmetres i mil cent',
      dures.mesLlarga.titol === 'C' && dures.mesLlarga.kmEsforc === 25,
      JSON.stringify(dures.mesLlarga.kmEsforc));
  cal('les que buiden es marquen: dues de les tres',
      dures.llargues === 2, String(dures.llargues));
  cal('i cap de les planes no ho és', planes.llargues === 0);

  // -------------------------------------------------------------- la captura
  /* LA PROPIETAT QUE NO ES POT PERDRE MAI: llegir una captura no escriu res.
     Una lectura d'imatge s'equivoca en silenci, i una xifra falsa dins de la
     sèrie se la creuen les regles i les gràfiques. */
  const bo = JSON.stringify({ sessions: [
    { data: '2026-07-28', mena: 'trail', titol: 'Sèries', km: 7.8, desnivell: 480, minuts: 62 },
    { data: null, mena: 'trail', titol: 'Sense dia', km: 5, desnivell: 100, minuts: 30 },
    { data: '2025-07-29', mena: 'forca', titol: 'Any mal llegit', km: null, desnivell: null, minuts: 40 }
  ], avis: '' });

  const cap = munta([], { resposta: bo });
  const r = cap.E.llegeixCaptura({ contingut: 'data:image/jpeg;base64,AQID',
                                   mena: 'trail', dilluns: '2026-07-27' });

  cal('llegir una captura no escriu absolutament res', cap.desats.length === 0,
      JSON.stringify(cap.desats));
  cal('i torna una sessió per fila llegida', r.sessions.length === 3,
      String(r.sessions.length));
  cal('la que porta dia bo no és dubtosa i ja té la seva càrrega',
      r.sessions[0].dubtosa === false && r.sessions[0].kmEsforc === 12.6,
      JSON.stringify(r.sessions[0]));
  cal('la que no té dia queda marcada, no se n\'hi inventa cap',
      r.sessions[1].dubtosa === true && r.sessions[1].data === null);
  /* L any mal llegit es el error tipic d aquestes pantalles: no hi surt mai. */
  cal('i una data fora de la setmana que s\'importa també queda marcada',
      r.sessions[2].dubtosa === true && r.sessions[2].data === '2025-07-29');

  /* I se li ha de DEMANAR que no endevini: sense aquesta frase, omple el buit. */
  const demanat = cap.dit().missatges[0].parts[0].text;
  cal('al model se li diu que deixi la data en blanc si no la sap',
      /posa null\. No l'endevinis/.test(demanat) || /No l'endevinis/.test(demanat), demanat.slice(0, 200));
  cal('i que la imatge hi va de debò',
      cap.dit().missatges[0].parts.some((x) => x.inlineData));
  cal('i que contesti JSON i res més', cap.dit().json === true);

  /* Confirmar sí que escriu, i només el que porta dia. */
  const conf = munta([], {});
  const x = conf.E.confirmaCaptura({ sessions: [
    { data: '2026-07-28', mena: 'trail', titol: 'Sèries', km: 7.8, desnivell: 480, minuts: 62 },
    { data: null, mena: 'trail', titol: 'Sense dia', km: 5 }
  ] });
  cal('confirmar-la desa només les que tenen dia',
      x.desats === 1 && conf.desats.length === 1, JSON.stringify(x));
  cal('i queden marcades com a vingudes d\'una captura',
      conf.desats[0].fila.font === 'captura');

  let quePassa = '';
  try { munta([], { ia: false }).E.llegeixCaptura({ contingut: 'x', mena: 'trail' }); }
  catch (e) { quePassa = e.message; }
  cal('sense capa d\'IA no es fa veure que ha llegit res', /no hi ha clau/.test(quePassa),
      quePassa);

  /* «HE MIRAT LA IMATGE I NO HI HA RES» NO ÉS UNA AVARIA: és l'únic final que
     vol dir que tot el camí ha anat bé. Va marcat a l'error i no al text del
     missatge, perquè la comprovació d'instal·lació comparava cadenes —buscava
     «no he sabut veure» i el missatge diu «no HI he sabut veure»— i donava per
     fallat el cas bo amb un consell equivocat a sota. */
  const buides = [
    ['cap entrenament', 'trail', JSON.stringify({ sessions: [], avis: '' })],
    ['cap xifra de passos', 'passos', JSON.stringify({ passos: {}, avis: '' })]
  ];
  buides.forEach(([nom, mena, resposta]) => {
    let err = null;
    try {
      munta([], { resposta }).E.llegeixCaptura({ contingut: 'data:image/png;base64,AQID', mena });
    } catch (e) { err = e; }
    cal('una captura sense ' + nom + ' es distingeix d\'una avaria',
        err && err.buida === true, err ? err.message : 'no ha petat');
  });

  let real = null;
  try { munta([], { resposta: 'no és json' }).E.llegeixCaptura({ contingut: 'x', mena: 'trail' }); }
  catch (e) { real = e; }
  cal('i una avaria de debò NO porta la marca', real && !real.buida,
      real ? real.message : 'no ha petat');

  /* I la comprovació d'instal·lació ha de mirar la marca, no el text. */
  const inst = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');
  cal('la comprovació d\'instal·lació mira la marca i no el missatge',
      /if \(err\.buida\)/.test(inst) && !/no he sabut veure cap entrenament/.test(inst));

  /* TREURE-NE UNA LA DEIXA SENSE DIA, i una fila sense dia no és de cap
     setmana. Si passa el filtre, `dillunsDe('')` no és cap dilluns i les
     sèries peten senceres: una setmana amb una sessió esborrada s'enduria la
     pantalla d'entrenaments i la de relacions. */
  const ambTreta = munta([
    s('2026-07-28', 'trail', 'A', 8, 500, 60),
    { id: 'e0', data: '', mena: 'trail', titol: '(esborrada) B', km: 5,
      desnivell: 100, minuts: 30, kcal: '', pulsacions: '', font: 'ma', notes: '' }
  ], {}).E;
  cal('una sessió treta no compta enlloc', ambTreta.sessions().length === 1,
      JSON.stringify(ambTreta.sessions().map((x) => x.data)));
  let peta = '';
  try { ambTreta.seriesDiaries('2026-07-06', '2026-08-02'); }
  catch (e) { peta = e.message; }
  cal('i no fa petar les sèries', peta === '', peta);

  // --------------------------------------------------------------- els passos
  const pas = munta([], {});
  const p1 = pas.E.desaPassos({ dilluns: '2026-07-27', total: 81250 });
  cal('amb el total de la setmana, la mitjana surt sola', p1.mitjana === 11607,
      String(p1.mitjana));
  const p2 = munta([], {}).E.desaPassos({ dilluns: '2026-07-27', mitjana: 10000 });
  cal('i amb la mitjana, el total', p2.total === 70000, String(p2.total));

  // ------------------------------------------------- el que es pot creuar
  /* Un dimarts sense sortida d'una setmana importada és descans i val zero. Un
     dimarts d'una setmana que no has importat mai no és un zero: no se sap. */
  const ser = munta([s('2026-07-21', 'trail', 'Z', 4, 100, 25),
                     s('2026-07-28', 'trail', 'A', 8, 500, 60)], {
    passos: [{ id: 'p1', dilluns: '2026-07-27', total: 81250, mitjana: 11607, font: 'captura' }]
  }).E.seriesDiaries('2026-07-06', '2026-08-02');
  const carrega = ser.filter((x) => x.id === 'esforc')[0];
  /* Quatre setmanes al rang i només dues importades: catorze dies, no vint-i-vuit. */
  cal('només compten els dies de setmanes que has importat',
      carrega && Object.keys(carrega.dies).length === 14,
      carrega ? String(Object.keys(carrega.dies).length) : 'no hi és');
  cal('i dins d\'aquella setmana, un dia sense sortida sí que és un zero',
      carrega && carrega.dies['2026-07-29'] === 0 && carrega.dies['2026-07-28'] === 13,
      carrega ? JSON.stringify(carrega.dies) : '');
}

// -------------------------- la imatge de prova de provaEntrenaments() és una imatge
/* La comprovació d'entrenaments envia una imatge de debò al model per veure si
   la clau i el model accepten imatges. Va escrita al codi en base64 i partida en
   tres línies perquè hi càpiga, i partir-la és exactament com es trenca: una
   línia reflowada i el que arriba és una cadena que no és cap PNG. Llavors la
   comprovació falla i sembla que falli el model.
   Això la torna a muntar i la desxifra: capçalera, mida i el bloc de píxels. */
console.log('\nLa imatge de prova dels entrenaments encara és un PNG');
{
  const s = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');
  const i = s.indexOf("var PROVA = 'data:image/png;base64,'");
  cal('es troba la imatge de prova dins de la comprovació', i > 0);

  const tros = s.slice(i, s.indexOf("';\n", i + 40) + 2);
  const parts = [...tros.matchAll(/'([^']*)'/g)].map((x) => x[1]);
  const buf = Buffer.from(parts.slice(1).join(''), 'base64');

  cal('i porta la signatura d\'un PNG', buf.slice(1, 4).toString() === 'PNG',
      buf.slice(0, 8).toString('hex'));
  const ample = buf.readUInt32BE(16), alt = buf.readUInt32BE(20);
  /* Un píxel el rebutgen: ha de ser prou gran per ser una imatge de debò. */
  cal('i és prou grossa perquè el model l\'accepti', ample >= 8 && alt >= 8,
      ample + 'x' + alt);

  const idat = buf.indexOf(Buffer.from('IDAT')) + 4;
  let pixels = 0;
  try { pixels = zlib.inflateSync(buf.slice(idat, idat + buf.readUInt32BE(idat - 8))).length; }
  catch (e) { pixels = -1; }
  cal('i els píxels es descomprimeixen: no s\'ha partit malament',
      pixels === alt * (1 + ample * 3), String(pixels));
}

// ------------------------------------------- la pantalla del seguiment, per parts
/* Les quatre coses que en Pol va dir que no li feien el pes, cadascuna amb la
   seva prova. Són de forma i no de càlcul, però són exactament el que va fallar:
   una etiqueta que no volia dir res, unes fotos sempre a la vista, una lectura
   que no existia i el trail com a lletra petita. */
console.log('\nSeguiment: la pantalla diu el que ha de dir');
{
  const v = fs.readFileSync('apps-script/vista_seguiment.html', 'utf8');
  const e = fs.readFileSync('apps-script/ui_estil.html', 'utf8');

  cal('«De grosses» ja no és l\'etiqueta de res', !/De grosses/.test(v));
  cal('i el camp diu què és una sortida llarga al costat del camp',
      /Llargues<\/label>/.test(v) && /que et deixen buit/.test(v));

  cal('les fotos comencen amagades', /var fotosObertes = false;/.test(v) &&
      /id="seg-tires"' \+ \(fotosObertes \? '' : ' hidden'\)/.test(v));
  cal('i hi ha un botó que les ensenya i les torna a amagar',
      /data-ulls/.test(v) && /aria-expanded/.test(v) && /Amaga-les/.test(v));
  /* Amagades vol dir amagades de debò: sense `src` no hi ha cap petició a
     Google, i no depèn de si el navegador carrega el que no es veu. */
  cal('i amagades no es demanen a Google fins que s\'obren',
      /\(fotosObertes \? 'src' : 'data-src'\)/.test(v) &&
      /img\[data-src\]/.test(v) && /im\.src = im\.dataset\.src/.test(v));

  /* La lectura ha d'anar ABANS de les imatges: és el que ha de sortir de
     fer-se les fotos. Si va darrere, per llegir-la has de passar per elles. */
  cal('la lectura va abans de les imatges, no darrere',
      v.indexOf('data-mira="') < v.indexOf("id=\"seg-tires\"") &&
      v.indexOf('data-mira="') > 0);
  cal('i la demana al servidor i la desa al telèfon',
      /crida\('seguiment', 'analitzaFotos'/.test(v) && /Cau\.set\('seg\.ullada\.'/.test(v));
  cal('canviar una foto llença les lectures desades',
      (v.match(/Cau\.oblida\('seg\.ullada\.'\)/g) || []).length === 2);

  cal('el trail té columna pròpia al resum de la setmana',
      /xifra\('Trail'/.test(v) && /xifra\('Pes'/.test(v) &&
      /xifra\('Cintura'/.test(v) && /xifra\('Força'/.test(v));
  cal('i ja no penja com a lletra petita de la força',
      !/cur\.trail \+ ' trail'/.test(v));
  cal('i quatre columnes no s\'escanyen al mòbil',
      /\.seg-xifres \{ display: grid; grid-template-columns: repeat\(2, 1fr\)/.test(e) &&
      /min-width: 420px\) \{ \.seg-xifres \{ grid-template-columns: repeat\(4, 1fr\)/.test(e));
}


// ------------------------------------------ on va cada notificació en tocar-la
/* Quatre de les nou notificacions obrien una pàgina 404, i cap prova ho veia:
   totes passaven, perquè el destí era una cadena i ningú comprovava que fos
   una pantalla de debò. Això ho mira, i mira TOTES les que hi hagi al codi:
   una de nova que s'equivoqui igual, es trobarà aquesta prova al davant. */
console.log('\nNotificacions: totes han de portar a una pantalla que existeixi');
{
  const src = fs.readFileSync('apps-script/60_Notificacions.gs', 'utf8');
  const cos = src.slice(src.indexOf('function capOn_(url) {'), src.indexOf('function envia(titol'));
  const ctx = { String };
  vm.createContext(ctx);
  vm.runInContext(cos + '\nvar __c = capOn_;', ctx);
  const capOn = ctx.__c;

  cal('un nom de pantalla a seques es converteix en hash',
      capOn('seguiment') === './#seguiment', capOn('seguiment'));
  cal('el que ja estava bé no es toca',
      capOn('./#finances') === './#finances', capOn('./#finances'));
  cal('l\'arrel es queda com l\'arrel',
      capOn('./') === './' && capOn('') === './');

  /* I que `envia` la FACI SERVIR. Sense això, la prova de dalt passava amb la
     normalització desconnectada: comprovava una funció que no cridava ningú.
     Ho he vist perquè he tornat a trencar-ho a posta per veure si saltava. */
  cal('i que envia() la faci servir a la notificació i a l\'enllaç',
      /url:\s*capOn_\(/.test(src) && /link:\s*capOn_\(/.test(src));

  /* Les pantalles que existeixen de debò, llegides d'on es registren. */
  const vistes = new Set();
  fs.readdirSync('apps-script').filter((f) => f.startsWith('vista_')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    const m = t.match(/App\.registraVista\(\s*'([a-z0-9_]+)'/g) || [];
    m.forEach((x) => vistes.add(x.match(/'([a-z0-9_]+)'/)[1]));
  });
  cal('es troben les pantalles registrades', ['inici', 'seguiment', 'entrenaments'].every((v) => vistes.has(v)), [...vistes].join(', '));

  /* Cada `url:` que surti al costat d'un `Notifica.envia`. */
  const destins = [];
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    let i = 0;
    while ((i = t.indexOf('Notifica.envia(', i)) !== -1) {
      const tros = t.slice(i, i + 500);
      const m = tros.match(/url:\s*'([^']*)'/);
      if (m) destins.push({ on: f, url: m[1] });
      i += 15;
    }
  });
  cal('es troben les notificacions del codi', destins.length >= 1, destins.length + ' trobades');

  const dolents = destins.filter((d) => {
    /* El destí pot portar una data: «./#dia:2026-08-07». Es talla pels dos
       punts, igual que fa `App.deLAdreca` al navegador. Aquesta prova va
       saltar el dia que el repàs de la nit va estrenar aquesta forma, i
       tenia raó a preguntar-ho. */
    const v = capOn(d.url).replace('./#', '').replace('./', '').split(':')[0];
    return v && !vistes.has(v);
  });
  cal('cap notificació porta a una pantalla que no existeix',
      dolents.length === 0, dolents.map((d) => d.on + ' → ' + d.url).join(' · '));

  /* I CAP NO POT ANAR SENSE ETIQUETA. Les que no en porten arriben totes amb
     la mateixa —«jefe»—, i al telèfon una etiqueta repetida no vol dir dues
     notificacions: vol dir que la segona tapa la primera. Els senyals hi anaven
     així, i com que en surten dos al dia, la meitat no s'arribaven a veure. */
  const senseEtiqueta = [];
  let mirades = 0;
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    let i = 0;
    while ((i = t.indexOf('Notifica.envia(', i)) !== -1) {
      mirades++;
      const tros = t.slice(i, i + 700);
      if (!/etiqueta:/.test(tros)) senseEtiqueta.push(f + ':' + t.slice(0, i).split('\n').length);
      i += 15;
    }
  });
  cal('es miren totes les notificacions del codi', mirades >= 3, mirades + ' mirades');
  cal('cada notificació porta la seva etiqueta', senseEtiqueta.length === 0,
      senseEtiqueta.join(' · '));


  /* EL TÍTOL NO POT DIR EL MATEIX QUE EL COS. Amb una sola cita al calendari
     sortia «Montgrony 7:00-15:00» de títol i «Montgrony 7:00-15:00» de cos:
     una notificació que es repeteix a si mateixa no diu res dues vegades, no
     diu res una. La regla és que el títol digui d'on ve i el cos què passa. */
  const junta = (function () {
    const c2 = { String, RegExp };
    vm.createContext(c2);
    vm.runInContext(src.slice(src.indexOf('function junta_'), src.indexOf('function capOn_')) +
                    '\nvar __j = junta_;', c2);
    return c2.__j;
  })();

  cal('el que deia el títol s\'enganxa al cos amb un punt',
      junta('Control setmanal', 'Ara, en dejú') === 'Control setmanal. Ara, en dejú',
      junta('Control setmanal', 'Ara, en dejú'));
  cal('i sense doble puntuació quan ja n\'hi ha',
      junta('Bon dia, Pol!', '09:00 Claustre') === 'Bon dia, Pol! 09:00 Claustre',
      junta('Bon dia, Pol!', '09:00 Claustre'));

  /* Els títols escrits al codi han de ser curts. Un títol de sis paraules és
     una frase, i una frase al títol vol dir que el cos la repetirà.

     EL PUNT VOLAT NO ÉS UNA PARAULA. La forma és «Apartat · què» —«Diari ·
     resum», «Finances · patrimoni»— i comptar el separador com a paraula
     deixava el pressupost real en dues. Es treu abans de comptar. */
  const titols = [];
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    let i = 0;
    while ((i = t.indexOf('Notifica.envia(', i)) !== -1) {
      const m = t.slice(i, i + 220).match(/Notifica\.envia\(\s*'([^']+)'/);
      if (m) titols.push({ on: f, titol: m[1] });
      i += 15;
    }
  });
  cal('es troben els títols escrits al codi', titols.length >= 1, titols.length + ' trobats');
  const paraules = (t) => t.split(/\s+/).filter((p) => p && p !== '·').length;
  const llargs = titols.filter((t) => paraules(t.titol) > 3);
  cal('cap títol és una frase', llargs.length === 0,
      llargs.map((t) => t.on + ': «' + t.titol + '»').join(' · '));

  /* I CAP NO POT SER UNA COSA QUE PASSA. Els títols han de dir d'on ve la
     notificació, i el que es va escapar era just al revés: «Resum del dia»,
     «Revisió setmanal», «Banc», «Demà». Es comprova que cadascun comenci per
     un apartat de debò —el nom d'un mòdul o d'una pantalla de l'app. */
  const APARTATS = ['Calendari', 'Diari', 'Finances', 'Hàbits', 'Nutrició',
                    'Tasques', 'Focus', 'Relacions', 'Memòria', 'Seguiment', 'El dia',
                    'La setmana', 'Prova'];
  const forasters = titols.filter((t) =>
    !APARTATS.some((a) => t.titol === a || t.titol.indexOf(a + ' · ') === 0));
  cal('cada títol comença per l\'apartat d\'on ve', forasters.length === 0,
      forasters.map((t) => t.on + ': «' + t.titol + '»').join(' · '));

  /* I la còpia del treballador de servei ha de dir el mateix: és la que mana
     quan la notificació ja és al telèfon i l'app està tancada. */
  const sw = fs.readFileSync('firebase-messaging-sw.js', 'utf8');
  const bloc = sw.slice(sw.indexOf("self.addEventListener('notificationclick'"),
                        sw.indexOf('// Que una versió nova'));
  const arrel = 'https://exemple.test/jefe/';
  /* El treballador contesta amb una promesa —`matchAll` ho és— i la primera
     versió d'aquesta prova llegia el resultat abans que hi fos. Fallava la
     prova, no el codi. `waitUntil` és per on el treballador diu «encara no he
     acabat»: aquí s'agafa i s'espera, que és el que fa el navegador. */
  const obre = async (url, jaOberta) => {
    let obertes = [], navegat = null, missatges = [], guardat = null;
    const finestra = { url: arrel, focus: () => finestra,
                       navigate: (u) => { navegat = u; return Promise.resolve(finestra); },
                       postMessage: (m) => missatges.push(m) };
    const c = { String, Promise,
      self: { registration: { scope: arrel },
              clients: { matchAll: () => Promise.resolve(jaOberta ? [finestra] : []),
                         openWindow: (u) => { obertes.push(u); return Promise.resolve(); } },
              addEventListener: (n, f) => { c.__f = f; } } };
    c.self.self = c.self;
    vm.createContext(c);
    vm.runInContext(bloc, c);
    c.__f({ notification: { close: () => {}, data: { url } },
            waitUntil: (pr) => { guardat = pr; } });
    await guardat;
    return { obertes, navegat, missatges };
  };

  const tancada = await obre('seguiment', false);
  cal('el treballador obre l\'adreça sencera, no la relativa',
      tancada.obertes[0] === arrel + '#seguiment', tancada.obertes[0]);

  const oberta = await obre('seguiment', true);
  cal('i amb l\'app ja oberta hi navega en comptes de deixar-te on eres',
      oberta.navegat === arrel + '#seguiment', oberta.navegat);
  cal('i a més li ho diu per missatge, que és instantani',
      (oberta.missatges[0] || {}).vista === 'seguiment', JSON.stringify(oberta.missatges));
}


// ------ cap automatisme pot quedar-se fora de la llista que els neteja
/* `instalaTriggers` esborra els seus i els torna a crear. Els «seus» són els
   d'una llista escrita a mà, i el 4 d'agost del 2026 hi faltava
   `triggerEscalfaFora`: cada execució en deixava un de vell i en creava un de
   nou. Amb dos, i costant quaranta segons per passada, es menjaven més quota
   diària de la que té el compte —i quan la quota s'acaba, Google atura TOTS
   els automatismes sense avisar de res.
   Un descuit d'una línia amb aquestes conseqüències no es pot deixar a la
   memòria de ningú. */
console.log('\nEls automatismes: cap pot quedar fora de la llista que els neteja');
{
  const inst = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');

  const creats = (inst.match(/newTrigger\('(\w+)'\)/g) || [])
    .map((x) => x.replace(/newTrigger\('|'\)/g, ''));
  const llista = (inst.slice(inst.indexOf('var TRIGGERS = ['),
                             inst.indexOf('];', inst.indexOf('var TRIGGERS = [')))
    .match(/'(\w+)'/g) || []).map((x) => x.replace(/'/g, ''));

  cal('n\'hi ha uns quants de creats', creats.length >= 4, String(creats.length));
  const fora = creats.filter((t) => llista.indexOf(t) === -1);
  cal('i tots surten a la llista que els esborra',
      fora.length === 0, 'en falten: ' + fora.join(', '));

  /* I a l'inrevés: un nom a la llista que ja no es crea enlloc no fa mal, però
     vol dir que hi ha codi mort o un nom mal escrit. */
  const morts = llista.filter((t) => creats.indexOf(t) === -1);
  cal('i a la llista no hi ha noms que ja no existeixin',
      morts.length === 0, 'sobren: ' + morts.join(', '));
}

// ------------------------------------------------------------------ el visor
console.log('\nEl visor: qualsevol eina pot ensenyar el que ha trobat');
{
  /* `visorRetallat_` viu dins de l'assistent. S'extreu i s'executa tal com és:
     el que es prova és el sostre, que és el que evita que una eina de tres mil
     files faci una resposta de mig mega cap al navegador. */
  const src = fs.readFileSync('apps-script/55_Assistent.gs', 'utf8');
  const tros = src.slice(src.indexOf('  var VISOR_MAX'), src.indexOf('  function retalla_('));
  const c = { String, Object, Array, Number, Math, JSON };
  vm.createContext(c);
  vm.runInContext(tros + '\nvar __r = visorRetallat_;', c);
  const retalla = c.__r;

  const moltes = [];
  for (let i = 0; i < 400; i++) moltes.push({ text: 'cosa ' + i });

  const r = retalla({ titol: 'Moltes', mena: 'llista', dades: moltes, peu: ['400 coses'] });
  cal('es retalla pel sostre', r.dades.length === 120, r.dades.length);
  cal('i es diu quantes se n\'han quedat fora',
      r.peu.join(' ').indexOf('280 més') !== -1, r.peu.join(' · '));
  cal('el que hi cap no es toca',
      retalla({ mena: 'llista', dades: [{ text: 'una' }] }).dades.length === 1);

  const t = retalla({ mena: 'taula',
                      dades: { caps: ['a', 'b'], files: moltes.map(() => ['x', 'y']) } });
  cal('una taula també es retalla, i per files', t.dades.files.length === 120, t.dades.files.length);
  cal('i les capçaleres es queden', t.dades.caps.join(',') === 'a,b');

  cal('sense res, no hi ha visor', retalla(null) === undefined);
  cal('la forma per defecte és la llista', retalla({ dades: [] }).mena === 'llista');

  /* I que el pas del servidor a la pantalla hi sigui de debò: sense això,
     l'eina retorna el visor i no s'obre res mai. */
  cal('l\'assistent el fa viatjar', /visor: \(resultat && resultat\._visor\)/.test(src));
  /* Qui l'obria era la pantalla de la conversa, i ja no hi és. El visor es
     queda —el fan servir els mòduls per ensenyar coses— però la comprovació
     de qui el recull tornarà el dia que hi torni la IA, amagada. */

  /* LES EINES QUE DIUEN QUE SABEN ENSENYAR, HO HAN DE FER.
     No es compta quantes n'hi ha —això creixerà— sinó que cap declari
     `ensenya` a l'esquema i després no retorni res per ensenyar: seria una
     casella que el model marca i que no fa res. */
  const ambEnsenya = [];
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t2 = fs.readFileSync('apps-script/' + f, 'utf8');
    if (/ensenya:\s*\{ type: 'boolean'/.test(t2)) ambEnsenya.push([f, /_visor\s*=/.test(t2)]);
  });
  /* En aquesta app cap eina no porta la casella: la que ensenya,
     `ensenya_la_mesura` del seguiment, ensenya sempre. Que hi sigui. */
  cal("l'eina que ensenya la mesura hi és",
      /nom: 'ensenya_la_mesura'/.test(fs.readFileSync('apps-script/40_Mod_Seguiment.gs', 'utf8')));
  cal('i totes les que ho diuen, ho fan',
      ambEnsenya.every((x) => x[1]),
      ambEnsenya.filter((x) => !x[1]).map((x) => x[0]).join(', ') || 'cap');

  /* I QUE NO TORNI A PARLAR DE LES SEVES EINES.
     «No tinc cap eina per a això» és explicar-li com estàs fet en comptes de
     respondre-li, i el deixa sense saber què fer. La instrucció és al prompt,
     i el prompt és una cosa que s'esporga sense voler. */
  cal('se li diu que no parli mai de les seves eines',
      /MAI PARLIS DE LES TEVES EINES/.test(src));
  cal('amb les paraules exactes que ha de defugir',
      /no tinc cap eina/i.test(src) && /no disposo/i.test(src), '');
  cal('i amb què ha de fer al seu lloc: dir què sí que pot donar',
      /què SÍ que li pots donar/.test(src));
}

// ═══════════════════════════════════════════════ EL FULL ÍNDEX: CAP SENSE PORTA
/* La pantalla d'arrencada era la conversa, i des d'allà un botó de quadrícula
   obria el tauler amb TOTS els apartats. En treure-la, aquell botó se'n va
   anar amb ella i sis pantalles es van quedar sense manera d'obrir-se: hi
   eren, funcionaven, i no s'hi podia arribar. Ho vaig veure comptant portes,
   no provant-ho —i és exactament la mena de cosa que no es nota fins que un
   dia en necessites una.

   Ara l'índex les llista totes: les que reporten una xifra van a la graella
   i la resta a la tira de sota. Això ho comprova. */
console.log('\nEl full índex: cap apartat es pot quedar sense porta');
{
  const ctx = carregaTotElServidor();
  ctx.Log = { info() {}, avis() {}, error() {} };
  ctx.Dades = { llegeix: () => [] };
  ctx.Config = { get: () => null, getNum: (k, v) => v, esSi: () => false };

  const ambVista = ctx.Moduls.perAlClient().filter((m) => m.teVista);
  cal('hi ha mòduls amb pantalla: el seguiment i els entrenaments',
      ambVista.map((m) => m.id).sort().join(',') === 'entrenaments,seguiment', ambVista.map((m) => m.id).join(','));

  const inici = fs.readFileSync('apps-script/vista_inici.html', 'utf8');
  cal('l\'índex llista TOTS els mòduls que tenen pantalla',
      /m\.teVista && m\.id !== 'conversa'/.test(inici));

  /* ELS QUE NO SÓN PER A ELL. La memòria i les relacions són eines de dins
     —què sap l'app de tu i què ha vist creuant dades—: hi entra molt de tant
     en tant i a la graella ocupaven el mateix que els hàbits. Van a una icona
     al marge del capçal. Ho declara el mòdul i no la pantalla, perquè si demà
     en neix un altre d'aquesta mena s'ha de col·locar sol. */
  const secundaris = ctx.Moduls.perAlClient().filter((m) => m.secundari);
  /* Aquí no n'hi ha cap: la memòria i les relacions eren de JEFE. */
  cal("cap mòdul d'aquesta app no és una eina de dins",
      secundaris.length === 0,
      secundaris.map((m) => m.id).join(','));
  cal('i el nucli ho porta fins a la pantalla',
      /secundari: !!m\.secundari/.test(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8')));
  cal('la graella les deixa fora',
      /function apartats\(\)[\s\S]{0,140}!m\.secundari/.test(inici));
  cal('i el capçal les recull, que si no desapareixerien',
      /function eines\(\)[\s\S]{0,140}m\.secundari/.test(inici) && /class="cap-eina"/.test(inici));

  /* CAP PORTA CAP A UNA PANTALLA QUE NO HI ÉS. A JEFE l'índex portava al dia
     i a la setmana; aquí no existeixen, i un botó cap allà tornava a l'inici
     sense dir res. Les portes surten del registre de mòduls i prou. */
  const fixes = (inici.match(/data-ves="([a-z]+)"/g) || []);
  cal('cap porta escrita a mà cap a una pantalla que no existeix', fixes.length === 0, fixes.join(', '));

  /* I LA MARCA A DALT: les carenes de la icona, les quatre capes. És el que
     lliga l'inici amb la pila de carenes del seguiment. */
  cal("l'inici porta la marca de les carenes", /function marca\(\)/.test(inici) && /marca\(\) \+/.test(inici));
  const estil = fs.readFileSync('apps-script/ui_estil.html', 'utf8');
  cal('i ja no hi queda res del mapa de JEFE', !/reticula|Relleu|corba-mestra/.test(estil + inici));

  /* I LA LLISTA DEL MIRALL NO POT ANAR PER LLIURE. S'ha desincronitzat dues
     vegades —primer hi faltava l'escola, després la memòria—, i des del
     mirall no es nota: senzillament hi ha una porta menys que a l'app. */
  const dades = fs.readFileSync('eines/mirall-dades.mjs', 'utf8');
  const bloc = dades.slice(dades.indexOf('const nucliInici'), dades.indexOf('targetes:', dades.indexOf('const nucliInici')));
  const alMirall = (bloc.match(/id: '([a-z]+)'/g) || []).map((s) => s.slice(5, -1));
  const falten = ambVista.map((m) => m.id).filter((id) => alMirall.indexOf(id) === -1);
  cal('el mirall ensenya els mateixos apartats que l\'app', falten.length === 0,
      'al mirall hi falta: ' + falten.join(', '));
}

// --------------------------------------------- el cos: el que és d'aquesta app
/* Les coses que la separació de JEFE va haver de canviar o de respectar, i
   que si un dia es desfan no fallaria res a la vista: l'app s'instal·laria
   com si fos JEFE, trepitjaria la memòria de Nutrició o perdria les fotos. */
console.log('\nEl cos: viu a /seguimentFitFat/, porta el seu nom i troba les coses de JEFE');
{
  const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
  cal("el manifest té l'id del cos, no el de JEFE", manifest.id === '/seguimentFitFat/', manifest.id);
  /* ANDROID NO FABRICA L'APP AMB SVG. A Nutrició, amb només icones SVG,
     Chrome deia «ja està instal·lada» i en obrir-la «l'app no s'ha pogut
     obrir». Calen PNG de 192 i de 512, i una de retallable, des del primer dia. */
  cal('hi ha icones PNG de 192 i 512, i una de retallable',
      ['192x192', '512x512'].every((m) => manifest.icons.some((i) => i.type === 'image/png' && i.sizes === m)) &&
      manifest.icons.some((i) => i.type === 'image/png' && i.purpose === 'maskable'));
  cal('i les icones hi són', manifest.icons.every((i) => fs.existsSync(i.src)),
      manifest.icons.map((i) => i.src).join(', '));
  cal("i la de l'iPhone també", fs.existsSync('apple-touch-icon.png'));
  cal('i les adreces relatives, que viatgen soles',
      manifest.start_url === './' && manifest.scope === './', manifest.start_url + ' · ' + manifest.scope);

  const sw = fs.readFileSync('sw.js', 'utf8');
  cal('la memòria cau del navegador porta el prefix del cos', /var PREFIX = 'cos-';/.test(sw));
  cal('i només esborra les seves, no les de Nutrició ni les de Finances',
      /n\.indexOf\(PREFIX\) === 0 && n !== CAU/.test(sw));

  const app = fs.readFileSync('apps-script/ui_app.html', 'utf8');
  cal('la memòria local també porta el prefix del cos', /var PREFIX_CAU = 'cos\.';/.test(app));
  cal("i ja no en queda cap amb el «jefe.» de JEFE", !/localStorage\.\w+\('jefe\./.test(app));

  const inst = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');
  const fulls = (inst.match(/var FULLS_COS = \[([^\]]*)\]/) || [, ''])[1].match(/'(\w+)'/g) || [];
  cal('es copien les quatre pestanyes del cos',
      fulls.map((x) => x.replace(/'/g, '')).join(',') === 'Seguiment,SeguimentPla,Entrenaments,EntrenamentsPassos',
      fulls.join(','));
  cal('i el full de JEFE només es llegeix: cap escriptura hi va',
      !/origen\.(insertSheet|deleteSheet|getRange\([^)]*\)\.set)/.test(inst));

  /* LES FOTOS. La carpeta es busca pel nom, i el nom és el de JEFE a posta:
     si es canviés, l'app en crearia una de buida i l'històric no hi arribaria. */
  const seg = fs.readFileSync('apps-script/40_Mod_Seguiment.gs', 'utf8');
  cal('les fotos es busquen a la carpeta de sempre de JEFE',
      /var CARPETA_FOTOS = 'JEFE · Seguiment físic';/.test(seg));
  cal('i provaFotos mira les velles abans de crear res', /fotosVelles_\(\)\.forEach/.test(inst) &&
      inst.indexOf('fotosVelles_().forEach') < inst.indexOf('carpeta = Seguiment.carpetaFotos()'));

  /* EL CONTROL SETMANAL LLEGEIX ELS ENTRENAMENTS. Amb els dos mòduls al
     mateix projecte, `carregues_` troba `Entrenaments` sola. */
  cal('el seguiment llegeix la càrrega dels entrenaments, sense tocar',
      /function carregues_\(h\) \{\s*if \(typeof Entrenaments === 'undefined'\) return \{\};/.test(seg));
  const ctx = carregaTotElServidor();
  cal('i al mateix servidor, Entrenaments hi és', typeof ctx.Entrenaments === 'object');

  /* LA RESPOSTA DE LA IA ES POT TALLAR. Es reintenta amb el triple de sostre
     i, si encara es talla, es marca; la pantalla del seguiment ho diu. */
  const ia = fs.readFileSync('apps-script/50_IA.gs', 'utf8');
  cal('una resposta tallada es torna a demanar amb el triple de sostre',
      /motiuFi === 'MAX_TOKENS' && !ampliat/.test(ia) && /sostre \* 3/.test(ia));
  cal('i si es torna a tallar, es marca', /r\.tallat = true/.test(ia));
  cal('el seguiment ho passa a la pantalla, i la pantalla ho diu',
      /tallat: !!r\.tallat/.test(seg) &&
      /r\.tallat \?/.test(fs.readFileSync('apps-script/vista_seguiment.html', 'utf8')));

  cal("els ajustos de la IA es porten de JEFE, perquè de sèrie la IA va apagada",
      /'ia_activa'/.test(inst) && /portaAjustosDeJefe_\(portades\.origen\)/.test(inst));
}

// ------------------------------- el control desa, els entrenaments hi arriben
/* Els criteris de l'encàrrec, amb el codi de debò dels dos mòduls i un full
   de mentida a sota: desar un control el posa a l'històric, apuntar una
   sessió la posa a la gràfica de dotze setmanes, i la càrrega d'aquella
   setmana surt al control. Si aquesta última sortís buida, els dos mòduls no
   es parlarien —que és el que vol dir haver-los copiat malament—. */
console.log('\nEl cos de punta a punta: el control, la sessió i la càrrega');
{
  const ctx = carregaTotElServidor();
  const fulls = {};
  let seq = 0;
  ctx.Log = { info() {}, avis() {}, error() {} };
  ctx.Memoria = { recorda: (m, k, fn) => fn(), oblida() {} };
  ctx.Dades = {
    llegeix: (nom) => (fulls[nom] || []).map((f) => Object.assign({}, f)),
    perId: (nom, id) => (fulls[nom] || []).find((f) => f.id === id) || null,
    actualitza: (nom, id, canvis) => {
      const f = (fulls[nom] || []).find((x) => x.id === id);
      if (f) Object.assign(f, canvis);
      return f;
    },
    desa: (nom, obj, claus, prefix) => {
      const t = fulls[nom] = fulls[nom] || [];
      const hi = t.find((f) => claus.every((c) => String(f[c]) === String(obj[c])));
      if (hi) { Object.assign(hi, obj); return { id: hi.id }; }
      const nova = Object.assign({ id: (prefix || 'x') + '_' + (++seq) }, obj);
      t.push(nova);
      return { id: nova.id };
    },
    invalida() {}
  };
  ctx.Utils.avui = () => '2026-09-27';   // un diumenge: el dia del control
  /* Apps Script dona les dates amb la zona horària de l'script; aquí, amb la
     de la màquina, que per a dies sencers a migdia és el mateix. */
  const dos = (n) => ('0' + n).slice(-2);
  ctx.Utilities.formatDate = (d, _tz, forma) => {
    if (forma !== 'yyyy-MM-dd') throw new Error('format no previst a la prova: ' + forma);
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
  };

  const desat = ctx.Seguiment.desaControl({ data: '2026-09-27', pes: '78.4', cintura: '88',
    forca: 2, trail: 3, trailGros: 1, energia: 'bona', son: 'bo', gana: 'normal', dieta: 'bé' });
  cal('el control es desa', desat.desat === true && !!desat.id, JSON.stringify(desat));
  const h = ctx.Seguiment.pantalla().historic;
  const elDia = h.find((c) => c.data === '2026-09-27');
  cal('i surt a l\'històric amb el pes i la cintura', !!elDia && elDia.pes === 78.4 && elDia.cintura === 88,
      JSON.stringify(elDia));

  const s1 = ctx.Entrenaments.desaSessio({ data: '2026-09-23', mena: 'trail', titol: 'Matagalls',
    km: '12', desnivell: '900', minuts: '110', kcal: '950', pulsacions: '148', notes: 'fang' });
  const s2 = ctx.Entrenaments.desaSessio({ data: '2026-09-25', mena: 'forca', titol: 'Cames', minuts: '45' });
  cal('les sessions es desen', s1.desat && s2.desat && s1.id !== s2.id);
  const ent = ctx.Entrenaments.pantalla('2026-09-27');
  const ultima = ent.corba[ent.corba.length - 1];
  cal('la gràfica té dotze setmanes', ent.corba.length === 12, ent.corba.length);
  cal('i la darrera és la de la sessió, amb 12 km + 900 m / 100 = 21 km-esforç',
      ultima.dilluns === '2026-09-21' && ultima.kmEsforc === 21 && ultima.sessions === 2,
      JSON.stringify(ultima));

  const c = ctx.Seguiment.pantalla().carregues['2026-09-21'];
  cal('al control setmanal hi surt la càrrega de la setmana', !!c, JSON.stringify(c));
  cal('amb els km-esforç, les sessions i el desnivell dels entrenaments',
      !!c && c.kmEsforc === 21 && c.sessions === 2 && c.desnivell === 900, JSON.stringify(c));

  const altra = ctx.Seguiment.desaControl({ data: '2026-09-27', pes: '78.1' });
  cal('tornar a desar el mateix dia corregeix, no en fa un bessó',
      altra.id === desat.id && ctx.Seguiment.pantalla().historic.filter((x) => x.data === '2026-09-27').length === 1);

  /* L'AVÍS DEL DIUMENGE. L'hora és un número i el dia el diu el full: canviar
     el dia a SeguimentPla ha de moure l'avís sense tocar cap automatisme. */
  fulls.SeguimentPla = [{ clau: 'control.dia', valor: '7' }];
  const avis = () => ctx.Moduls.avisos().find((a) => a.modul === 'seguiment' && a.id === 'control');
  cal("l'avís del control existeix, a les sis", !!avis() && avis().hora === 6, JSON.stringify(avis()));
  cal('i és el diumenge, que el llegeix del full', !!avis() && avis().dia === 7, avis() && avis().dia);
  fulls.SeguimentPla = [{ clau: 'control.dia', valor: '3' }];
  cal('si el full diu dimecres, l\'avís passa a dimecres', avis().dia === 3, avis().dia);
  fulls.SeguimentPla = [{ clau: 'control.dia', valor: '7' }];
  cal('amb el control ja fet aquesta setmana, no diu res', avis().mira() === null);
  const guardats = fulls.Seguiment; fulls.Seguiment = [];
  const r = avis().mira();
  cal('sense el control, avisa i porta al seguiment', !!r && !!r.titol && r.url === 'seguiment', JSON.stringify(r));
  fulls.Seguiment = guardats;

  /* LA CAPTURA DE STRAVA: llegir torna una proposta i NO ESCRIU. Escriu
     confirmaCaptura, amb el que ell hagi deixat marcat. La IA és de mentida:
     el que es prova és el camí, no la lectura d'una pantalla real. */
  ctx.IA = {
    disponible: () => true, motiu: () => '',
    genera: () => ({ text: JSON.stringify({ avis: '', sessions: [
      { data: '2026-09-22', mena: 'trail', titol: 'Collsacabra', km: 9.5, desnivell: 420, minuts: 70 },
      { data: '2025-09-24', mena: 'trail', titol: 'Any mal llegit', km: 6, desnivell: 200, minuts: 40 },
      { data: null, mena: 'forca', titol: 'Sense dia', minuts: 30 }
    ] }) })
  };
  const abans = fulls.Entrenaments.length;
  const prop = ctx.Entrenaments.llegeixCaptura({ contingut: 'data:image/png;base64,AAAA', mena: 'trail',
                                                  dilluns: '2026-09-21' });
  cal('la captura torna una proposta', prop.sessions && prop.sessions.length === 3, JSON.stringify(prop));
  cal('i no escriu res fins que la confirmes', fulls.Entrenaments.length === abans,
      fulls.Entrenaments.length + ' files, n\'hi havia ' + abans);
  cal("les files dubtoses van marcades: l'any mal llegit i la que no té dia",
      prop.sessions.map((s) => s.dubtosa).join(',') === 'false,true,true',
      prop.sessions.map((s) => s.dubtosa).join(','));
  const conf = ctx.Entrenaments.confirmaCaptura({ sessions: [prop.sessions[0]] });
  cal('en confirmar, entra només el que has deixat', conf.desats === 1 && fulls.Entrenaments.length === abans + 1);
}

// --------------------------------------------- el disseny nou: el que no pot caure
/* «El pols de les setmanes», triat per en Pol entre tres esbossos. Les coses
   que el fan ser el que és i que una neteja es podria endur sense que res
   deixés de funcionar. */
console.log('\nEl disseny: les carenes són de debò i la paleta és la de la icona');
{
  const seg = fs.readFileSync('apps-script/vista_seguiment.html', 'utf8');
  const ent = fs.readFileSync('apps-script/vista_entrenaments.html', 'utf8');
  const estil = fs.readFileSync('apps-script/ui_estil.html', 'utf8');
  const srv = fs.readFileSync('apps-script/40_Mod_Entrenaments.gs', 'utf8');

  /* LES CARENES. Cada una és la càrrega dia a dia d'una setmana, i ve del
     servidor dels entrenaments. Ni un cim inventat: l'esbós feia servir
     soroll aleatori per fer-les boniques, i a l'app no n'hi pot haver. */
  cal('el servidor dona la càrrega dia a dia de cada setmana', /dies: perDies_\(s\)/.test(srv));
  cal('les carenes es dibuixen amb això', /x\.dies/.test(seg) && /setmanes\[dillunsDe\(c\.data\)\]/.test(seg));
  cal("i no hi ha res a l'atzar al dibuix", !/Math\.random/.test(seg + ent));
  const ctx = carregaTotElServidor();
  const fulls = { Entrenaments: [
    { id: 'e1', data: '2026-09-22', mena: 'trail', titol: 'A', km: 10, desnivell: 500 },
    { id: 'e2', data: '2026-09-27', mena: 'trail', titol: 'B', km: 6, desnivell: 100 },
    { id: 'e3', data: '2026-09-24', mena: 'forca', titol: 'C', minuts: 40 }
  ] };
  ctx.Log = { info() {}, avis() {}, error() {} };
  ctx.Dades = { llegeix: (n) => (fulls[n] || []).slice() };
  ctx.Utils.avui = () => '2026-09-28';
  const dos = (n) => ('0' + n).slice(-2);
  ctx.Utilities.formatDate = (d) => d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
  const corba = ctx.Entrenaments.pantalla('2026-09-21').corba;
  const dies = corba[corba.length - 1].dies;
  cal('i són els dies bons: dimarts 15, diumenge 7, la força no hi suma',
      JSON.stringify(dies) === '[0,15,0,0,0,0,7]', JSON.stringify(dies));

  /* LA PALETA ÉS LA DE LA ICONA, i en Pol va dir que li agrada molt. */
  cal('la paleta és la de la icona',
      ['#e8eef0', '#bcced4', '#7ab5c1', '#1c8496', '#054a57', '#0d191e'].every((c) => estil.includes(c)));
  cal("i un sol color d'avís, l'ocre", /--ocre:\s+#85580f/.test(estil));
  cal('la font és dins del repositori, no a fora', /url\("fonts\/hanken-grotesk\.woff2"\)/.test(estil) &&
      fs.existsSync('fonts/hanken-grotesk.woff2') && !/fonts\.googleapis/.test(estil));
  cal('i el treballador de servei la desa per obrir sense xarxa',
      /\.\/fonts\/hanken-grotesk\.woff2/.test(fs.readFileSync('sw.js', 'utf8')));
  cal("el moviment es respecta quan es demana que no n'hi hagi", /prefers-reduced-motion: reduce/.test(estil));

  /* EL FORMULARI DE LA SESSIÓ: kcal, pulsacions i notes, que el servidor ja
     guardava i la pantalla no deixava escriure. En corregir una sessió a mà,
     a més, s'esborraven: ara viatgen. */
  cal('el formulari de la sessió té kcal, pulsacions i notes',
      /id="e-kcal"/.test(ent) && /id="e-pul"/.test(ent) && /id="e-notes"/.test(ent));
  cal('i els envia en desar',
      /kcal: buit\('#e-kcal'\), pulsacions: buit\('#e-pul'\)/.test(ent) && /notes: cos\.querySelector\('#e-notes'\)/.test(ent));
}

console.log(falles ? '\n' + falles + ' falla(des).\n' : '\nTot correcte.\n');
process.exit(falles ? 1 : 0);
