/**
 * EL COS — Instal·lació i manteniment
 *
 * Ve del `90_Instalacio.gs` de JEFE, retallat al que fa servir aquesta app.
 * Funcions per executar A MÀ des de l'editor d'Apps Script:
 *
 *   instala()           → TOT D'UN COP, la primera vegada: el full, les dades
 *                         de JEFE, la clau d'accés i els automatismes.
 *   configura()         → crea el full de càlcul i l'estructura. Idempotent.
 *   generaClauAcces()   → la clau que et demana la pantalla en connectar-la.
 *   instalaTriggers()   → instal·la els automatismes. Idempotent.
 *   treuTriggers()      → els desinstal·la.
 *   provaTriggers()     → hi són tots, i quants de cada?
 *   provaAvisos()       → l'avís del control setmanal, arribarà?
 *   provaNotificacio()  → t'arriba un avís al mòbil?
 *   provaFotos()        → es veuen les fotos velles, i es poden pujar les noves?
 *   provaEntrenaments() → es pot llegir una captura de Strava?
 */

/* EL FULL D'ON VENEN LES DADES. Es busca i es LLEGEIX: no s'hi escriu mai
   res. Vegeu `trobaFullJefe_` per com es reconeix. */
var NOM_FULL_JEFE = 'JEFE — Assistent';
var FULLS_COS = ['Seguiment', 'SeguimentPla', 'Entrenaments', 'EntrenamentsPassos'];

/**
 * LA PRIMERA VEGADA, AIXÒ I PROU.
 * Crea el full, s'hi porta les dades de JEFE, genera la clau i instal·la els
 * automatismes. Es pot tornar a executar: no duplica res ni torna a copiar
 * les dades si ja hi són. La clau, però, sí que la canvia; si ja la tens
 * posada a l'app, no l'executis més —fes servir les altres funcions.
 */
function instala() {
  var linies = [];
  linies.push(configura());
  linies.push(instalaTriggers());
  linies.push(generaClauAcces());
  var text = linies.join('\n\n');
  Logger.log(text);
  return text;
}

/**
 * Posada en marxa. Es pot executar tantes vegades com calgui:
 * si el full ja existeix, no en crea un altre; només posa al dia l'estructura.
 *
 * Quan el crea, abans de res s'hi porta les quatre pestanyes del cos del
 * full de JEFE —amb «Copia a», que deixa l'original on és i tal com és—.
 * Va ABANS d'`Esquema.sincronitza` a posta: si no, l'esquema crearia les
 * quatre pestanyes buides i les bones arribarien amb un altre nom al costat.
 */
function configura() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_ID_FULL);
  var ss;
  var acabatDeCrear = false;

  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create(NOM_FULL_CALCUL);
    props.setProperty(PROP_ID_FULL, ss.getId());
    acabatDeCrear = true;
  }

  var portades = portaDadesDeJefe_(ss);

  var informe = Esquema.sincronitza();
  var afegides = Config.inicialitza();
  var moduls = Moduls.sincronitzaFull();
  /* ELS AJUSTOS ES BUSQUEN SEMPRE, no només quan s'acaben de copiar les
     pestanyes. Si la primera execució es va aturar a mig camí —en autoritzar
     el projecte, per exemple—, les pestanyes ja hi eren a la segona i el full
     de JEFE no es tornava a obrir: la IA es quedava apagada sense dir-ho. */
  var origen = portades.origen;
  if (!origen) {
    try { origen = trobaFullJefe_(ss.getId()); }
    catch (e) { Log.avis('instalacio', 'No he trobat el full de JEFE per portar-ne els ajustos: ' + e.message); }
  }
  var ajustos = portaAjustosDeJefe_(origen);

  if (acabatDeCrear) netejaFullPerDefecte_(ss);

  Log.info('instalacio', 'configura() completada', {
    creat: acabatDeCrear,
    portades: portades.copiades,
    fullsCreats: informe.fullsCreats,
    columnesAfegides: informe.columnesAfegides,
    configAfegida: afegides,
    moduls: moduls
  });

  var resum =
    (acabatDeCrear ? 'Full de càlcul creat.\n' : 'Full de càlcul ja existent, estructura posada al dia.\n') +
    'Dades de JEFE: ' + portades.text + '\n' +
    (ajustos ? 'Ajustos de la IA de JEFE: ' + ajustos + '\n' : '') +
    'Fulls creats: ' + (informe.fullsCreats.join(', ') || 'cap') + '\n' +
    'Columnes afegides: ' + (informe.columnesAfegides.join(', ') || 'cap') + '\n' +
    'Mòduls detectats: ' + moduls + '\n' +
    'URL: ' + ss.getUrl();

  console.log(resum);
  return resum;
}

/**
 * LES DADES ES COPIEN, NO ES MOUEN.
 *
 * Per cada pestanya que encara no és al full nou, se la copia del de JEFE
 * —`copyTo`, que és el mateix que «Copia a → Full de càlcul existent»— i li
 * torna el nom. L'original no es toca: ni es mou, ni s'esborra, ni s'hi
 * escriu. Si la pestanya ja hi és, no fa res: tornar-ho a executar no
 * duplica ni trepitja el que hagis apuntat des d'aquí.
 */
function portaDadesDeJefe_(ss) {
  var falten = FULLS_COS.filter(function (n) { return !ss.getSheetByName(n); });
  if (!falten.length) return { copiades: [], text: 'ja hi eren, no s\'ha copiat res', origen: null };

  var origen = trobaFullJefe_(ss.getId());
  var copiades = [];
  falten.forEach(function (nom) {
    var full = origen.getSheetByName(nom);
    if (!full) return;   // a JEFE no hi era: l'esquema el crearà buit
    var copia = full.copyTo(ss);
    copia.setName(nom);
    copiades.push(nom + ' (' + Math.max(0, copia.getLastRow() - 1) + ' files)');
  });

  return {
    copiades: copiades,
    text: copiades.length ? 'copiades ' + copiades.join(', ') : 'cap pestanya del cos a JEFE',
    origen: origen
  };
}

/**
 * QUIN ÉS EL FULL DE JEFE.
 *
 * Primer es va buscar pel nom, «JEFE — Assistent», i no hi era: el full havia
 * tingut altres noms i el teu no es deia així. El nom no és de fiar; el que
 * hi ha a dins, sí. El full de JEFE és el que té les pestanyes del cos
 * (`Seguiment`, `Entrenaments`) i les del nucli (`_Config`, `_Moduls`).
 *
 *   1. Si a Propietats de l'script hi ha `ID_FULL_JEFE`, és aquest i prou.
 *   2. Si no, el busca pel nom de sempre i, si no hi és, pel contingut entre
 *      els fulls de càlcul del teu Drive.
 *   3. Si en surt més d'un, no en tria cap: diu quins són i com triar-lo.
 *
 * El full nou del cos (`idPropi`) no compta mai, encara que ja tingui
 * alguna d'aquestes pestanyes.
 */
function trobaFullJefe_(idPropi) {
  var posat = PropertiesService.getScriptProperties().getProperty('ID_FULL_JEFE');
  if (posat) return SpreadsheetApp.openById(posat);

  function esJefe(ss) {
    return ss.getSheetByName('Seguiment') && ss.getSheetByName('Entrenaments') &&
           ss.getSheetByName('_Config') && ss.getSheetByName('_Moduls');
  }

  function candidats(consulta, limit) {
    var trobats = [], vistos = 0;
    var it = DriveApp.searchFiles(consulta);
    while (it.hasNext() && vistos < limit) {
      var f = it.next();
      vistos++;
      if (f.getId() === idPropi) continue;
      try {
        var ss = SpreadsheetApp.openById(f.getId());
        if (esJefe(ss)) trobats.push(ss);
      } catch (e) { /* un full que no es pot obrir no és el nostre */ }
    }
    return trobats;
  }

  var FULLS = 'mimeType = "application/vnd.google-apps.spreadsheet" and trashed = false';
  var trobats = candidats(FULLS + ' and title = "' + NOM_FULL_JEFE + '"', 10);
  if (!trobats.length) {
    trobats = candidats(FULLS + ' and (title contains "JEFE" or title contains "Popu" or ' +
                        'title contains "Assistent" or title contains "Jefe")', 40);
  }
  if (!trobats.length) {
    trobats = candidats(FULLS + ' and "me" in owners', 300);
  }

  if (!trobats.length) {
    throw new Error('No trobo el full de dades de JEFE en aquest compte: cap full de càlcul teu ' +
                    'té alhora les pestanyes Seguiment, Entrenaments, _Config i _Moduls. Si és en un ' +
                    'altre compte de Google, obre aquest projecte amb aquell compte. Si el saps, posa ' +
                    'el seu identificador a Propietats de l\'script com a ID_FULL_JEFE.');
  }
  if (trobats.length > 1) {
    throw new Error('Hi ha ' + trobats.length + ' fulls que semblen el de JEFE: ' +
                    trobats.map(function (s) { return '«' + s.getName() + '»'; }).join(', ') +
                    '. No en trio cap a cegues: posa l\'identificador del bo a Propietats de ' +
                    'l\'script com a ID_FULL_JEFE i torna-ho a executar.');
  }
  return trobats[0];
}

/**
 * ELS AJUSTOS DE LA IA NO SÓN A CAP PESTANYA DEL COS: són al `_Config` de
 * JEFE. I aquí fan falta de debò: sense `ia_activa` a SI no hi ha lectura de
 * fotos, ni comentari de l'entrenador, ni captures de Strava —i el valor de
 * sèrie és NO—.
 *
 * Es porta cada ajust només si aquí encara té el valor de sèrie, o sigui que
 * si ja l'has canviat des d'aquesta app, no es trepitja. Del full de JEFE
 * només es llegeix.
 */
var AJUSTOS_DE_JEFE = ['ia_activa', 'proveidor_ia', 'model_barat', 'model_bo', 'model_veu', 'pensa_tokens'];

function portaAjustosDeJefe_(origen) {
  if (!origen) return '';
  var full = origen.getSheetByName('_Config');
  if (!full || full.getLastRow() < 2) return '';

  var valors = full.getDataRange().getValues();
  var cap = valors[0].map(String);
  var iClau = cap.indexOf('clau'), iValor = cap.indexOf('valor');
  if (iClau === -1 || iValor === -1) return '';

  var portats = [];
  for (var i = 1; i < valors.length; i++) {
    var clau = String(valors[i][iClau] || '');
    if (AJUSTOS_DE_JEFE.indexOf(clau) === -1) continue;
    var v = valors[i][iValor];
    if (v === '' || v === null) continue;
    var deSerie = String(CONFIG_DEFECTE[clau] === undefined ? '' : CONFIG_DEFECTE[clau]);
    var ara = String(Config.get(clau, ''));
    if (ara !== deSerie || String(v) === ara) continue;
    Config.set(clau, v);
    portats.push(clau + ' = ' + v);
  }
  return portats.join(', ');
}

/**
 * Esborra el full buit «Full 1» / «Sheet1» que Google crea automàticament,
 * però NOMÉS si està completament buit i ja hi ha altres fulls.
 * Mai toca un full amb dades.
 */
function netejaFullPerDefecte_(ss) {
  var fulls = ss.getSheets();
  if (fulls.length < 2) return;

  for (var i = 0; i < fulls.length; i++) {
    var f = fulls[i];
    var nom = f.getName();
    var esPerDefecte = /^(Sheet1|Full 1|Hoja 1|Feuille 1)$/i.test(nom);
    var esBuit = f.getLastRow() === 0 && f.getLastColumn() === 0;
    if (esPerDefecte && esBuit) {
      ss.deleteSheet(f);
      Log.info('instalacio', 'Esborrat el full buit per defecte «' + nom + '»');
      return;
    }
  }
}

// ------------------------------------------------------------------ triggers

/**
 * ELS AUTOMATISMES QUE SÓN NOSTRES.
 *
 * Aquesta llista NO és decoració: és la que fa servir `treuTriggers` per
 * netejar abans de tornar-los a crear. Un automatisme que no hi surti no
 * s'esborra mai, i cada `instalaTriggers()` en deixa un de vell i en crea un
 * de nou. A JEFE va passar amb `triggerEscalfaFora` el 4 d'agost del 2026: en
 * van quedar dos, i entre tots dos es menjaven més quota diària de la que té
 * el compte sencer. Quan la quota s'acaba, Google atura TOTS els automatismes
 * sense dir res —i la quota és del compte, no d'aquest projecte: la gasten
 * també JEFE i les altres apps—.
 *
 * REGLA: si afegeixes un `newTrigger` aquí sota, el seu nom va aquí dalt. La
 * prova `eines/prova.mjs` ho comprova i peta si te'n descuides.
 */
/* On queda apuntat a quines hores es van crear els avisos dels mòduls. Vegeu
   el final d'`instalaTriggers` per què cal, i `provaAvisos` per a què serveix. */
var PROP_HORES_AVISOS = 'COS_HORES_AVISOS';

var TRIGGERS = ['triggerManteniment', 'triggerEscalfa', 'triggerSenyals', 'triggerAvisos'];

/** Instal·la els automatismes. Esborra només els seus abans, mai els d'altri. */
function instalaTriggers() {
  treuTriggers();

  ScriptApp.newTrigger('triggerManteniment')
    .timeBased().atHour(3).everyDays(1).create();

  /* LA PANTALLA, PREPARADA. Desar-la fa que obrir l'app sigui ràpid.
     Cada deu minuts i no cada cinc com a JEFE: el que es desa dura mitja hora,
     o sigui que no caduca mai igualment, i la quota d'automatismes és de tot
     el compte —noranta minuts al dia per a JEFE i les apps que en surten—.
     Passar-se vol dir que s'atura tot, l'avís del diumenge inclòs, sense dir
     res. */
  ScriptApp.newTrigger('triggerEscalfa').timeBased().everyMinutes(10).create();

  /* ELS SENYALS, cada tres hores. Qui decideix si en surt cap és el
     pressupost de dos al dia —vegeu 65_Senyals.gs—, no aquesta xifra. */
  ScriptApp.newTrigger('triggerSenyals').timeBased().everyHours(3).create();

  /* ELS AVISOS QUE DEMANIN ELS MÒDULS. Aquí n'hi ha un: el control setmanal
     del seguiment, a les sis del matí del dia que digui el full (`dia` és una
     funció que llegeix `SeguimentPla`, per això el dia no s'apunta enlloc
     més). Una hora de trigger per cada hora que demani algú, i ni una més.

     I VAN AMB `nearMinute`, QUE NO ÉS UN DETALL. Un `atHour(6)` pelat vol dir
     «entre les sis i les set», i Google tria: el control setmanal va picar un
     divendres a les 7:37, quan en Pol ja anava cap a l'escola i la mesura en
     dejú ja no es podia fer. Amb `nearMinute(0)` la finestra passa d'una hora
     a un quart llarg. El preu és que pot picar ABANS de l'hora; qui ho
     arregla és `triggerAvisos`, que mira l'hora amb el mateix arrodoniment. */
  var hores = {};
  Moduls.avisos().forEach(function (a) { hores[a.hora] = true; });
  Object.keys(hores).forEach(function (h) {
    ScriptApp.newTrigger('triggerAvisos')
      .timeBased().atHour(Number(h)).nearMinute(0).everyDays(1).create();
  });

  /* I S'APUNTA A QUINES HORES HAN QUEDAT. Apps Script no deixa preguntar a
     quina hora està programat un automatisme, o sigui que si un mòdul canvia
     d'hora i ningú no torna a instal·lar, l'antic es queda i NO ES NOTA.
     Ho llegeix `provaAvisos`. */
  PropertiesService.getScriptProperties().setProperty(
    PROP_HORES_AVISOS,
    JSON.stringify(Object.keys(hores).map(Number).sort(function (a, b) { return a - b; })));

  Log.info('instalacio', 'Triggers instal·lats', { triggers: TRIGGERS, horesDAvisos: Object.keys(hores) });
  return 'Triggers instal·lats: ' + TRIGGERS.join(', ') +
         (Object.keys(hores).length ? '\nAvisos de mòduls a les: ' + Object.keys(hores).join(', ') : '');
}

/**
 * HI SÓN DE DEBÒ?
 *
 * Un automatisme que falta falla en silenci: te n'assabentes per no rebre
 * res. Això mira els que hi ha instal·lats ara mateix i els compara amb la
 * llista: diu els que falten i els que hi són repetits.
 */
function provaTriggers() {
  var compte = {};
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var n = t.getHandlerFunction();
    compte[n] = (compte[n] || 0) + 1;
  });
  var l = ['=== AUTOMATISMES ==='];
  var totBe = true;
  /* De `triggerAvisos` n'hi ha un per cada hora que demanin els mòduls; de
     la resta, un i prou. */
  var horesAvisos = {};
  Moduls.avisos().forEach(function (a) { horesAvisos[a.hora] = true; });
  TRIGGERS.forEach(function (n) {
    var cal = n === 'triggerAvisos' ? Object.keys(horesAvisos).length : 1;
    var q = compte[n] || 0;
    if (q !== cal) totBe = false;
    l.push((q === cal ? '  ✓ ' : '  ✗ ') + n + (q === cal ? (cal === 1 ? '' : '  (' + q + ')') :
           '  (n\'hi ha ' + q + ', n\'hi ha d\'haver ' + cal + ')'));
  });
  l.push(totBe ? 'Tots hi són, els que toquen.' : 'Executa instalaTriggers() per arreglar-ho.');
  var text = l.join('\n');
  Logger.log(text);
  return text;
}

/**
 * Esborra els automatismes NOSTRES —els de la llista— i deixa estar els
 * d'altri. Si en trobés dos amb el mateix nom, els treu tots dos: duplicats
 * vol dir doble consum de quota, i la quota és de tot el compte.
 */
function treuTriggers() {
  var tots = ScriptApp.getProjectTriggers();
  var tret = 0;
  for (var i = 0; i < tots.length; i++) {
    if (TRIGGERS.indexOf(tots[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(tots[i]);
      tret++;
    }
  }
  return 'Triggers eliminats: ' + tret;
}


// ------------------------------------------------- punts d'entrada dels triggers

/** Manteniment nocturn. Aquest sí que funciona des del primer dia. */
function triggerManteniment() {
  try {
    var informe = { rotades: 0, esquema: [] };

    informe.rotades = Log.rota();

    informe.esquema = Esquema.comprova();
    if (informe.esquema.length) {
      Esquema.sincronitza();
      informe.esquema = Esquema.comprova();
    }

    /* Aquí hi havia previst un reintent dels resums que haguessin fallat, i
       s'ha tret perquè seria mentida: el resum del dia es munta amb el que
       diuen els mòduls ARA, i a les tres de la matinada «ara» ja és l'endemà.
       Tornar-lo a generar li posaria a la nit de dimarts les xifres de
       dimecres. Si un vespre falla, hi ha el botó de demanar-lo a mà, i al
       registre en queda constància. */

    CacheService.getScriptCache().removeAll(['fitxa_ia']);

    Log.info('trigger.manteniment', 'Manteniment completat', informe);
  } catch (err) {
    Log.error('trigger.manteniment', err);
  }
}

/**
 * LA PANTALLA, PREPARADA ABANS QUE L'OBRIS.
 * La primera crida de cada estona costava segons: obrir el full i muntar la
 * pantalla. Això ho fa cada deu minuts —la pantalla d'inici, les dues de
 * l'app i la fitxa que llegeix la IA—, i quan l'obres ja hi és.
 *
 * NO FALLA MAI CAP A FORA. Escalfar és un luxe: si una pantalla peta mentre
 * es munta, es deixa estar i el registre ho diu.
 */
function triggerEscalfa() {
  var t0 = Date.now();
  var fets = [], fallats = [];

  function escalfa(nom, fn) {
    try { fn(); fets.push(nom); }
    catch (err) { fallats.push(nom + ': ' + err.message); }
  }

  var m = Moduls.actius();
  for (var i = 0; i < m.length; i++) {
    var id = m[i].id;
    var accions = m[i].accions || {};

    /* El que no surt d'un full no s'escalfa aquí: costa segons i no
       mil·lisegons. En aquesta app no n'hi ha cap, però la regla es queda. */
    if (m[i].volatil) continue;

    // Les targetes de la pantalla d'inici també, que és la primera que veus.
    if (typeof m[i].resumInici === 'function') {
      escalfa(id + ':targeta', (function (mod) {
        return function () {
          Memoria.recorda(mod.id, 'resumInici', function () { return mod.resumInici(); });
        };
      })(m[i]));
    }

    /* Cada mòdul s'escalfa per la porta per on hi entres tu, i amb els
       paràmetres de sèrie: el mes en curs, el dia d'avui. La resta —un mes
       de fa mig any, l'històric d'un hàbit— es munta quan hi vas, que és de
       tant en tant i no val la pena tenir-ho calent sempre. */
    if (typeof accions.pantalla === 'function') {
      escalfa(id, (function (a) { return function () { a({}); }; })(accions.pantalla));
    } else if (typeof accions.dia === 'function') {
      escalfa(id, (function (a) { return function () { a({}); }; })(accions.dia));
    }
  }

  /* LA FITXA QUE LLEGEIX LA IA, TAMBÉ.
     Cada cosa que li dius a JEFE —escrita o de veu— es prepara amb el que
     tenen a dir tots els mòduls. Es desa mitja hora, però no l'escalfava
     ningú: la primera pregunta de cada estona la pagava ell, i just abans de
     posar-se a esperar el model, que ja triga per si sol. Aquí no costa gairebé
     res perquè el que la fitxa mira ja acaba de quedar calent tres línies més
     amunt. */
  escalfa('fitxa de la IA', function () { Moduls.contextIA({ compacte: true }); });

  /* Es deixa dit quant ha trigat. Aquest automatisme s'executa unes cent quaranta
     vegades al dia i el pot d'automatismes és de noranta minuts: si un dia
     s'allargués, aquí es veuria abans que no pas quedant-nos sense avisos. */
  var ms = Date.now() - t0;
  if (fallats.length) {
    Log.avis('escalfa', 'Alguna pantalla no s\'ha pogut escalfar', { fallats: fallats, ms: ms });
  } else {
    Log.info('escalfa', 'Pantalles a punt', { quantes: fets.length, ms: ms });
  }
  /* Al registre de l'editor també: quan l'executes a mà des d'allà, el que
     retorna una funció no es veu enlloc, i sense això sembla que no hagi fet
     res. Va passar. */
  var resum = fets.join(', ') + '  ·  ' + ms + ' ms';
  Logger.log(resum);
  return resum;
}

/**
 * EL REPARTIDOR DELS AVISOS DELS MÒDULS.
 *
 * Un automatisme d'Apps Script no pot rebre paràmetres, o sigui que totes les
 * hores instal·lades criden aquí i és aquesta funció la que mira quina hora és
 * i a qui li toca. Un mòdul que peti no s'emporta els altres: es registra i se
 * segueix, que és la mateixa regla que a tot arreu.
 */
function triggerAvisos() {
  var ara = new Date();

  /* L'HORA ES MIRA ARRODONIDA, i cal que sigui així.
     Els triggers es creen amb `nearMinute(0)`, que vol dir «a l'hora, més o
     menys un quart». Aquell «menys» és el problema: un avís de les sis pot
     picar a les 5:50, i llavors el rellotge diu cinc, cap mòdul no demana les
     cinc i l'avís es perdria en silenci —que és la pitjor manera de perdre'l.
     Del minut 45 endavant, doncs, comptem que ja som a l'hora següent. I si
     amb això es passa la mitjanit, també canvia el dia: a les 23:50 de dijous,
     l'avís que toca és el de les 0h de DIVENDRES. */
  var hora = ara.getHours();
  var dia = ara.getDay() === 0 ? 7 : ara.getDay();     // 1 = dilluns … 7 = diumenge
  if (ara.getMinutes() >= 45) {
    hora = (hora + 1) % 24;
    if (hora === 0) dia = dia === 7 ? 1 : dia + 1;
  }
  var enviats = 0, mirats = 0;

  Moduls.avisos().forEach(function (a) {
    if (a.hora !== hora) return;
    if (a.dia !== null && a.dia !== dia) return;
    if (typeof a.mira !== 'function') return;
    mirats++;
    try {
      var r = ambBloqueig_(function () { return a.mira(); });
      /* Retornar null vol dir «avui no hi ha res a dir», i no és cap error:
         un avís que pica cada setmana tant si passa alguna cosa com si no
         deixa de voler dir res al cap de tres setmanes. */
      if (!r || !r.titol) return;
      /* EL TÍTOL ÉS EL NOM DEL MÒDUL, no el que digui l'avís.
         El mòdul escriu què passa; d'on ve ho sap el nucli, que és qui té el
         registre. Així cap mòdul no s'ha de recordar de la regla, i el que
         escrigui al `titol` no es perd: encapçala el cos. */
      var m = Moduls.perId(a.modul);
      Notifica.envia(
        (m && m.nom) || a.modul,
        Notifica.junta(r.titol, r.cos),
        { url: r.url || a.modul, etiqueta: 'avis-' + a.modul + '-' + a.id }
      );
      enviats++;
    } catch (err) {
      Log.error('trigger.avisos', 'Avís ' + a.modul + '.' + a.id + ': ' + err.message);
    }
  });

  if (mirats) Log.info('trigger.avisos', 'Avisos mirats', { hora: hora, mirats: mirats, enviats: enviats });
}


// ------------------------------------------------------------------ claus i proves

/**
 * Genera la clau d'accés per a la interfície servida des de fora.
 *
 * Executa-la un cop. Escriu la clau al registre: copia-la, enganxa-la a la
 * pantalla quan te la demani, i no la desis enlloc més.
 * Si algun dia sospites que se t'ha escapat, torna a executar-la: la vella
 * deixa de servir a l'instant.
 */
function generaClauAcces() {
  var alfabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var clau = '';
  var bytes = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  for (var i = 0; i < 48; i++) {
    clau += alfabet.charAt((bytes.charCodeAt(i % bytes.length) * (i + 7)) % alfabet.length);
  }

  PropertiesService.getScriptProperties().setProperty(PROP_CLAU_ACCES, clau);
  Log.info('instalacio', 'Clau d\'accés generada');

  var text = [
    '',
    '=== CLAU D\'ACCÉS DEL COS ===',
    '',
    clau,
    '',
    'Copia-la ara. Aquesta és l\'única vegada que te la mostro còmodament.',
    '(Sempre la pots recuperar a Configuració del projecte → Propietats de l\'script.)',
    '',
    'Qui tingui aquesta clau i l\'URL del desplegament pot llegir les teves dades.',
    'No la posis en cap fitxer del projecte ni la comparteixis.',
    '============================'
  ].join('\n');
  Logger.log(text);
  return text;
}

/**
 * PROVA DE NOTIFICACIONS — executa-la i mira't el mòbil.
 *
 * Comprova la cadena sencera: compte de servei, autenticació amb Google,
 * dispositius registrats i enviament real. Si arriba la notificació, tot
 * funciona; si no, el registre diu exactament on s'ha trencat.
 */
function provaNotificacio() {
  var linies = ['=== PROVA DE NOTIFICACIONS ==='];
  function afegeix(t) { linies.push(t); Logger.log(t); }

  if (!Notifica.disponible()) {
    afegeix('FALLA: ' + Notifica.motiu());
    return linies.join('\n');
  }
  afegeix('1. Compte de servei ..... correcte');

  // La configuració web (apiKey, vapid…) no es comprova des d'aquí: viu a
  // firebase.config.json, que és del client. Si algun dispositiu s'ha
  // registrat, és que aquella configuració ja funciona. Val més comprovar
  // el resultat que no pas repetir la declaració en dos llocs.
  var d;
  try {
    d = Notifica.dispositius();
  } catch (e) {
    afegeix('2. Dispositius .......... FALLA: falta el full _Dispositius');
    afegeix('');
    afegeix('Executa configura() per crear-lo i torna a provar-ho.');
    return linies.join('\n');
  }

  afegeix('2. Dispositius actius ... ' + d.length);
  d.forEach(function (x) { afegeix('   · ' + x.nom + '  (vist ' + x.vist_el + ')'); });

  if (!d.length) {
    afegeix('');
    afegeix('Cap dispositiu registrat encara. Al mòbil: obre l\'app i prem');
    afegeix('«Activa els avisos». Si el botó et diu');
    afegeix('que Firebase no està configurat, és que firebase.config.json encara');
    afegeix('té els valors d\'exemple o que no has fet git push.');
    return linies.join('\n');
  }

  var r = Notifica.envia(
    'Prova',
    'La cadena funciona de punta a punta: l\'app et pot escriure encara que estigui tancada.',
    { etiqueta: 'prova', url: './' }
  );
  afegeix('3. Enviades ............. ' + r.enviades + ' de ' + d.length);
  (r.errors || []).forEach(function (e) {
    afegeix('   ERROR a ' + e.nom + ': codi ' + e.codi + ' — ' + e.text);
  });

  afegeix('=== FI · mira\'t el mòbil ===');
  return linies.join('\n');
}

/**
 * ELS AVISOS DELS MÒDULS: ARRIBARAN O NO?
 *
 * Un avís programat falla EN SILENCI. Si divendres a les sis no et pica, el
 * que passa és que no passa res, i te n'assabentes per no rebre res —que és la
 * pitjor manera d'assabentar-se'n, perquè és igual que si aquell dia no hi
 * hagués res a dir. Això ho pregunta avui.
 *
 * Comprova les quatre coses que poden estar trencades i les diu totes, no
 * només la primera: quins avisos declaren els mòduls, si l'automatisme de
 * l'hora existeix de debò, què contestaria el mòdul ara mateix, i si la
 * cadena de notificacions està dempeus.
 */
function provaAvisos() {
  var linies = ['=== AVISOS PROGRAMATS DELS MÒDULS ==='];
  function afegeix(t) { linies.push(t); Logger.log(t); }

  var DIES = ['', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge'];

  var avisos = Moduls.avisos();
  if (!avisos.length) {
    afegeix('Cap mòdul demana cap avís. Aquí no hi ha res a comprovar.');
    return linies.join('\n');
  }

  /* Quants n'hi ha instal·lats de debò. Apps Script no deixa preguntar a quina
     hora està programat un automatisme —`getHandlerFunction` és tot el que en
     dona—, o sigui que el que es pot comprovar és que n'hi hagi tants com
     hores demanen els mòduls. Si el número no quadra, falta un
     `instalaTriggers()`. */
  var quants = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === 'triggerAvisos';
  }).length;
  var calen = {};
  avisos.forEach(function (a) { calen[a.hora] = true; });
  var horesCalen = Object.keys(calen).map(Number).sort(function (a, b) { return a - b; });
  var nCalen = horesCalen.length;

  afegeix('Automatismes «triggerAvisos»: ' + quants + ' instal·lats, ' +
          nCalen + ' que en calen (' + horesCalen.join(', ') + 'h)');
  if (quants < nCalen) {
    afegeix('  FALLA: en falta algun. Executa instalaTriggers().');
  }

  /* I A QUINA HORA ES VAN CREAR. Comptar-los no ho veu: si un mòdul passa de
     les set a les sis, segueix havent-hi un automatisme i segueix calent-ne
     un, i el que hi ha és el de les set. El número quadra i l'avís arriba una
     hora tard —que és com no arribar. */
  var apuntades = Utils.desJson(
    PropertiesService.getScriptProperties().getProperty(PROP_HORES_AVISOS), null);
  if (!apuntades) {
    afegeix('  No consta a quina hora es van crear. Executa instalaTriggers()');
    afegeix('  per deixar-ho apuntat; fins llavors això no ho pot comprovar.');
  } else if (apuntades.join(',') !== horesCalen.join(',')) {
    afegeix('  FALLA: es van crear per a les ' + apuntades.join(', ') + 'h i ara');
    afegeix('  els mòduls demanen les ' + horesCalen.join(', ') + 'h. L\'avís arribaria');
    afegeix('  a l\'hora vella. Executa instalaTriggers().');
  }
  afegeix('');

  var potEnviar = Notifica.disponible();
  afegeix('Cadena de notificacions: ' + (potEnviar ? 'dempeus' : 'TRENCADA — ' + Notifica.motiu()));
  if (potEnviar) {
    var d = [];
    try { d = Notifica.dispositius(); } catch (e) { d = []; }
    afegeix('Dispositius registrats: ' + d.length +
            (d.length ? '' : '  ← FALLA: sense cap dispositiu no arribarà enlloc'));
  }
  afegeix('');

  avisos.forEach(function (a) {
    afegeix('· ' + a.modul + '.' + a.id + ' — ' +
            (a.dia === null ? 'cada dia' : 'cada ' + (DIES[a.dia] || '?')) +
            ' cap a les ' + a.hora + ':00 (entre les ' + ((a.hora + 23) % 24) +
            ':45 i les ' + a.hora + ':15)');
    var r;
    try {
      r = a.mira();
    } catch (err) {
      afegeix('  FALLA en preguntar-li: ' + err.message);
      return;
    }
    if (!r || !r.titol) {
      afegeix('  Ara mateix no diria res. No és cap error: vol dir que ara');
      afegeix('  no hi ha res a avisar. Torna-ho a provar quan sí que n\'hi hagi.');
      return;
    }
    afegeix('  Enviaria: «' + r.titol + '»');
    afegeix('            ' + (r.cos || '').slice(0, 90) + ((r.cos || '').length > 90 ? '…' : ''));
    afegeix('  Obriria:  ' + (r.url || a.modul));
  });

  afegeix('');
  afegeix('=== FI ===');
  afegeix('Si vols veure\'n una al mòbil ara, executa provaNotificacio().');
  return linies.join('\n');
}

/**
 * LES FOTOS VELLES, HI ARRIBA L'APP?
 *
 * Les fotos no són al full: són a la carpeta «JEFE · Seguiment físic» del teu Drive, i el
 * full només en guarda l'identificador. Aquesta app la busca pel nom, igual que
 * JEFE. Això mira, sense crear ni tocar res, si la carpeta hi és (i només una)
 * i quantes de les fotos que el full apunta s'obren de debò.
 */
function fotosVelles_() {
  var l = [];
  var n = 0, it = DriveApp.getFoldersByName('JEFE · Seguiment físic');
  while (it.hasNext()) { it.next(); n++; }
  l.push('0. Fotos velles');
  if (n === 0) l.push('   FALLA: no hi ha cap carpeta «JEFE · Seguiment físic» en aquest compte.');
  if (n > 1) l.push('   ATENCIÓ: n\'hi ha ' + n + '. L\'app agafa la primera que li dona Google.');
  if (n === 1) l.push('   Carpeta ............... hi és');

  var files = [];
  try { files = Dades.llegeix('Seguiment'); } catch (e) {
    l.push('   El full Seguiment no es pot llegir: ' + e.message);
    return l;
  }
  var total = 0, obertes = 0, perdudes = [];
  files.forEach(function (f) {
    ['frontal', 'perfil', 'esquena'].forEach(function (angle) {
      var id = String(f['foto_' + angle] || '');
      if (!id) return;
      total++;
      try { DriveApp.getFileById(id).getName(); obertes++; }
      catch (e) { perdudes.push(String(f.data || '?') + ' ' + angle); }
    });
  });
  l.push('   Fotos al full ......... ' + total + ', i se n\'obren ' + obertes);
  if (perdudes.length) l.push('   No s\'obren: ' + perdudes.slice(0, 12).join(', ') + (perdudes.length > 12 ? '…' : ''));
  return l;
}

/**
 * LES FOTOS DEL SEGUIMENT: HI HA PERMÍS PER ESCRIURE A DRIVE?
 *
 * El mòdul de seguiment és l'únic d'aquesta app que toca Drive, i això vol
 * dir un permís que la resta no demana. El problema és ON es demana: un permís que
 * falta el navegador te'l pregunta, però una app web ja desplegada no pregunta
 * res —peta i prou—. O sigui que provant-ho des del telèfon el que veuries és
 * un error, i no sabries que només et falta dir que sí.
 *
 * Aquí sí que es pot preguntar: executant això des de l'editor, Google et
 * demana el permís, tu l'acceptes, i a partir d'aquell moment el telèfon ja
 * el té. Per això existeix aquesta funció i per això s'executa des d'aquí.
 *
 * Crea la carpeta si no hi és, hi escriu un fitxer de no res i el llença a la
 * paperera. No toca res del que hi hagi.
 */
function provaFotos() {
  var linies = ['=== FOTOS DEL SEGUIMENT ==='];
  function afegeix(t) { linies.push(t); Logger.log(t); }

  /* ABANS DE RES, LES FOTOS VELLES. `carpetaFotos()` crea la carpeta si no la
     troba, i una carpeta nova i buida voldria dir que l'històric no hi arriba
     i que no ho sabries mai. Per això es mira primer, sense crear res. */
  fotosVelles_().forEach(afegeix);
  afegeix('');

  var carpeta;
  try {
    carpeta = Seguiment.carpetaFotos();
  } catch (err) {
    afegeix('FALLA en obrir la carpeta: ' + err.message);
    afegeix('');
    afegeix('Si parla de permisos o d\'autorització, torna a executar aquesta');
    afegeix('mateixa funció i accepta el que et demani Google.');
    return linies.join('\n');
  }
  afegeix('1. Carpeta .............. ' + carpeta.getName());
  afegeix('   ' + carpeta.getUrl());

  var f;
  try {
    var blob = Utilities.newBlob('prova', 'text/plain', 'prova-cos.txt');
    f = carpeta.createFile(blob);
  } catch (err) {
    afegeix('2. Escriure-hi .......... FALLA: ' + err.message);
    return linies.join('\n');
  }
  afegeix('2. Escriure-hi .......... correcte (' + f.getId() + ')');

  try {
    f.setTrashed(true);
    afegeix('3. Netejar .............. el fitxer de prova és a la paperera');
  } catch (err) {
    afegeix('3. Netejar .............. no s\'ha pogut treure: ' + err.message);
    afegeix('   Es diu «prova-cos.txt» i el pots esborrar tu.');
  }

  afegeix('');
  afegeix('=== FI · ja pots pujar fotos des del mòbil ===');
  return linies.join('\n');
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 * ESTÀ LLEST EL MÒDUL D'ENTRENAMENTS?
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Cinc coses han de ser certes perquè passar una captura funcioni, i quatre
 * no es poden comprovar des de fora del teu compte: si els fulls existeixen,
 * si el nucli ha vist el mòdul, si hi ha clau d'IA i —la que de debò importa—
 * si el model que tens configurat accepta que li enviïs una imatge.
 *
 * L'ÚLTIMA ES PROVA DE DEBÒ, amb una imatge minúscula generada aquí mateix.
 * Que digui «no hi he vist cap entrenament» és el resultat BO: vol dir que la
 * imatge ha arribat, l'ha mirada i ha contestat. El que buscàvem no era que hi
 * veiés res —és un quadre de setze píxels—, era que el camí sencer funcionés
 * abans que et passi amb una captura de veritat a mitja tarda de divendres.
 */
function provaEntrenaments() {
  var l = ['=== ENTRENAMENTS · ESTÀ LLEST? ==='];
  function a(t) { l.push(t); Logger.log(t); }

  // 1. Els fulls
  ['Entrenaments', 'EntrenamentsPassos'].forEach(function (nom) {
    try {
      var cap = Dades.capcalera(nom);
      a('Full ' + nom + ' ..... hi és, amb ' + cap.length + ' columnes');
    } catch (err) {
      a('Full ' + nom + ' ..... NO HI ÉS. Executa configura().');
    }
  });

  // 2. El nucli l'ha vist
  var seu = Moduls.actius().filter(function (m) { return m.id === 'entrenaments'; })[0];
  a('El nucli el veu ....... ' + (seu ? 'sí, com a «' + seu.nom + '»' : 'NO. Revisa el full _Moduls.'));

  // 3. Què hi ha apuntat
  try {
    var n = Entrenaments.sessions().length;
    a('Sessions apuntades .... ' + n);
  } catch (err) {
    a('Sessions apuntades .... no s\'han pogut llegir: ' + err.message);
  }

  // 4. La capa d'IA
  if (!IA.disponible()) {
    a('Lectura de captures ... NO ES POT PROVAR: ' + IA.motiu());
    a('');
    a('=== FI · els fulls poden estar bé, però sense IA no es llegeix cap captura ===');
    return l.join('\n');
  }
  a('Capa d\'IA ............. disponible (' + Config.get('model_bo') + ')');

  // 5. El camí sencer, amb una imatge de debò
  var PROVA = 'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAATElEQVR4nGNgYGD4TzRggKgmUg9U' +
    'MTKHoGqEBvx6kKUYcEngEkRXgS6NYQQ+I7FbiMvRuLxEDQ2kOYk0T5MWrKRFHGlJg7TER2ryBgA6' +
    'H51/5Ll+SgAAAABJRU5ErkJggg==';
  try {
    var r = Entrenaments.llegeixCaptura({ contingut: PROVA, mena: 'trail' });
    a('Lectura de captures ... funciona (i encara diu que hi ha vist ' +
      r.sessions.length + ' sessions en un quadre de 16 píxels)');
  } catch (err) {
    /* La marca la posa el mòdul, i no és el text del missatge a posta: la
       primera versió d'això comparava cadenes, buscava «no he sabut veure» i
       el missatge diu «no HI he sabut veure». Donava per fallat justament el
       cas bo, amb un consell equivocat a sota. */
    if (err.buida) {
      a('Lectura de captures ... FUNCIONA');
      a('   Ha mirat la imatge i ha dit que no hi veu cap entrenament, que és');
      a('   exactament el que havia de dir: és un quadre de setze píxels.');
      a('   Ja pots passar-hi una captura de Strava de debò.');
    } else {
      a('Lectura de captures ... FALLA: ' + err.message);
      a('');
      if (/limit|quota/i.test(err.message)) {
        a('   Això és el límit gratuït de Gemini, no el mòdul. Espera una estona.');
      } else {
        a('   Si parla del model o d\'imatges, el model configurat a `model_bo`');
        a('   no accepta imatges: posa\'n un que en accepti a `model_bo`, al full _Config.');
      }
    }
  }

  a('');
  a('=== FI ===');
  return l.join('\n');
}
