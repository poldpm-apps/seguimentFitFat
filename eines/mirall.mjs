/**
 * El cos — MIRALL: l'app de debò al navegador, amb un servidor fingit
 *
 *   npm run mirall [vista]        inici · seguiment · entrenaments
 *
 * Agafa el `index.html` construït —el mateix codi que et serveix Apps Script—
 * i, just abans de l'arrencada, canvia `crida()` i `escriu()` per un servidor
 * de mentida amb dades inventades. Així es pot obrir qualsevol pantalla i
 * tocar-la sense clau, sense connexió i sense tocar ni una dada teva.
 *
 * PER QUÈ EXISTEIX
 *   `npm run comprova` i `npm run prova` no veuen res del que es VEU. Scroll
 *   horitzontal al mòbil, un text que no es llegeix sobre el seu fons, un
 *   botó que queda fora de pantalla: tot això passa totes les comprovacions i
 *   es veu en tres segons mirant-ho. Aquesta eina és per mirar-ho.
 *
 * LES DADES SÓN INVENTADES i la pàgina ho diu a baix amb una barra vermella.
 * No s'assemblen a les d'en Pol a posta. Viuen a `mirall-dades.mjs`.
 *
 * Genera també `amplades.html`, que ensenya la mateixa pantalla a l'amplada
 * d'un mòbil i a la d'un escriptori alhora: és on surten els desbordaments,
 * que a la finestra del navegador tal com està no es veuen mai.
 */
import fs from 'fs';
import path from 'path';
import { dades } from './mirall-dades.mjs';

const VISTA = process.argv[2] || 'inici';
const CARPETA = process.env.MIRALL_CARPETA || '.mirall';

const ARA = new Date();
/* La data LOCAL, no la de Greenwich. Amb `toISOString` a dos quarts d'una
   de la nit a Madrid encara surt el dia d'abans, i llavors el mirall et
   marca «ahir» al dia d'avui i et fa perseguir un error que no hi és. */
const iso = (d) => [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2),
                    ('0' + d.getDate()).slice(-2)].join('-');
const AVUI = iso(ARA);
const menys = (n) => { const d = new Date(ARA); d.setDate(d.getDate() - n); return iso(d); };

const D = dades(AVUI, menys);
const j = (v) => JSON.stringify(v);

const font = fs.readFileSync('index.html', 'utf8');

// -------------------------------------------------------------- el servidor fals

const MOCK = `
<script>
(function () {
  var AVUI = ${j(AVUI)};
  var INICI       = ${j(D.nucliInici())};
  var SEGUIMENT   = ${j(D.segPantalla())};
  /* Cinc setmanes cuinades. La del 20 de juliol son quatre sortides planes i
     la del 27 tres amb desnivell: es el cas que en Pol demanava veure. */
  var ENTRENA     = ${j(Object.fromEntries(
    ['2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03']
      .map((dl) => [dl, D.entPantalla(dl)])))};
  var copia = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* Bessona d'Utils.aixafa. Amb normalize('NFD') la a amb accent es parteix en
     dos i queda «pa gina»: per aixo el servidor fa servir una taula, i aqui
     tambe, que si no el mirall no prova el mateix que passa de debo. */
  function aixafa(text) {
    var s = String(text || '').toLowerCase();
    var amb = 'àáâäèéêëìíîïòóôöùúûüñç';
    var sense = 'aaaaeeeeiiiioooouuuunc';
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var n = amb.indexOf(s.charAt(i));
      var c = n === -1 ? s.charAt(i) : sense.charAt(n);
      out += /[a-z0-9]/.test(c) ? c : ' ';
    }
    return out.replace(/ +/g, ' ').trim();
  }


  function respon(modul, accio, p) {
    p = p || {};

    if (modul === 'nucli') {
      if (accio === 'inici') return copia(INICI);
      if (accio === 'moduls') return { moduls: copia(INICI).moduls };
      if (accio === 'estat') return { versio: 'mirall', configurat: true, moduls: INICI.moduls,
                                      problemesEsquema: [], triggers: [], ia: { disponible: false } };
      if (accio === 'notificacions') return { disponible: false, motiu: 'mirall', dispositius: 0 };
      if (accio === 'ping') return { ara: AVUI, versio: 'mirall' };

      /* El paquet: totes les pantalles en una anada. Aquí es munta amb les
         mateixes dades que tornaria cadascuna per separat, que és justament el
         que ha de passar: si el paquet tornés una altra forma, el client
         desaria una cosa que la vista no sap pintar. */
      if (accio === 'paquet') {
        var dins = function (m, a) {
          try { return respon(m, a, {}); } catch (e) { return null; }
        };
        return { avui: AVUI, pantalles: {
          seguiment: dins('seguiment', 'pantalla'),
          entrenaments: dins('entrenaments', 'pantalla')
        } };
      }
    }

    if (modul === 'seguiment') {
      if (accio === 'pantalla') return copia(SEGUIMENT);
      if (accio === 'desa') { return { desat: true, data: p.data, id: 'seg_mirall' }; }
      if (accio === 'pujaFoto') return { id: 'mirall', angle: p.angle, data: p.data };
      if (accio === 'esborraFoto') { window.__ultimEsborrat = p; return { tret: true, paperera: true }; }
      if (accio === 'comenta') return { comentari: 'Comentari inventat del mirall: aqui no hi ha cap IA.', data: p.data };
      /* La lectura de les fotos. Aqui no s obre cap imatge ni es crida ningu:
         el que es prova es que el boto la demani, que la resposta es pinti i
         que quedi desada al telefon per no tornar-la a demanar. */
      if (accio === 'analitzaFotos') {
        window.__ultimaUllada = p;
        return { comentari: 'Lectura inventada del mirall: aqui no hi ha cap IA ni cap foto.',
                 data: p.data, fotos: 3, desde: '2026-06-12' };
      }
    }

    if (modul === 'entrenaments') {
      if (accio === 'pantalla') {
        /* La setmana que demani, o la mes recent que hi hagi cuinada. */
        var claus = Object.keys(ENTRENA).sort();
        var vol = p && p.desde ? p.desde : claus[claus.length - 1];
        var tria = claus[0];
        for (var ci = 0; ci < claus.length; ci++) if (claus[ci] <= vol) tria = claus[ci];
        return copia(ENTRENA[tria]);
      }
      if (accio === 'desa') return { desat: true, id: 'ent_mirall', data: p.data };
      if (accio === 'esborra') return { tret: true };
      if (accio === 'desaPassos') return { desat: true, dilluns: p.dilluns,
        total: p.total || (p.mitjana || 0) * 7, mitjana: p.mitjana || Math.round((p.total || 0) / 7) };
      /* La lectura de la captura. Aqui no s obre cap imatge ni es crida ningu:
         es torna una proposta cuinada —amb una fila dubtosa a posta— per poder
         provar que es pugui repassar, corregir la data i desar nomes el que
         s hagi marcat. */
      if (accio === 'llegeixCaptura') {
        window.__ultimaCaptura = { mena: p.mena, mida: String(p.contingut || '').length };
        if (p.mena === 'passos') {
          return { mena: 'passos', dilluns: p.dilluns,
                   passos: { total: 81250, mitjana: null }, avis: '' };
        }
        return { mena: p.mena, dilluns: p.dilluns, avis: '', sessions: [
          { data: '2026-07-28', mena: 'trail', titol: 'Sèries a la pujada', km: 7.8,
            desnivell: 480, minuts: 62, pulsacions: 163, font: 'captura',
            kmEsforc: 12.6, dubtosa: false },
          { data: '2026-07-29', mena: 'forca', titol: 'Esquena i espatlles', km: null,
            desnivell: null, minuts: 38, pulsacions: null, font: 'captura',
            kmEsforc: null, dubtosa: false },
          { data: null, mena: 'trail', titol: 'Sortida sense dia', km: 5.4,
            desnivell: 120, minuts: 36, pulsacions: 150, font: 'captura',
            kmEsforc: 6.6, dubtosa: true }
        ] };
      }
      if (accio === 'confirmaCaptura') {
        window.__ultimaConfirmacio = p;
        return { desats: (p.sessions || []).length };
      }
    }

    throw new Error('El mirall no sap respondre ' + modul + '.' + accio);
  }

  /* Mig segon de retard, que és el que costa de debò. Sense això la pantalla
     es veuria instantània i no es notaria cap dels problemes que hi ha
     justament mentre s'espera. */
  window.crida = function (modul, accio, params) {
    return new Promise(function (ok, mal) {
      setTimeout(function () {
        try { ok(respon(modul, accio, params)); } catch (e) { mal(e); }
      }, 500);
    });
  };
  /* I TAMBÉ PEL FORAT DE LA XARXA.
     Canviar la «crida» global no n'hi ha prou: l'app viu dins d'una funció
     tancada i les crides que fa el NUCLI des de dins resolen la seva còpia
     local, no la global. Només les vistes, que són a fora, veuen la de
     mentida. El resultat era que «nucli.paquet» i «nucli.moduls» sortien a
     la xarxa de debò, contestaven 405 i omplien la consola d'errors que
     tapaven els de veritat: un banc de proves amb un forat a sota.
     Enganxant-se al «fetch» es tanca per sota i no se n'escapa cap. */
  var fetchDeDebo = window.fetch;
  window.fetch = function (url, opcions) {
    if (String(url) !== 'mirall') return fetchDeDebo.apply(this, arguments);
    var p = {};
    try { p = JSON.parse((opcions || {}).body || '{}'); } catch (e) {}
    return new Promise(function (ok) {
      setTimeout(function () {
        var cos;
        try { cos = { ok: true, dades: respon(p.modul, p.accio, p.params || {}) }; }
        catch (e) { cos = { ok: false, error: e.message }; }
        ok({ ok: true, status: 200, json: function () { return Promise.resolve(cos); } });
      }, 500);
    });
  };

  window.escriu = function (modul, accio, params, pantalla) {
    return window.crida(modul, accio, params).then(function () {
      return respon(modul, 'pantalla', pantalla || {});
    });
  };

  try {
    localStorage.setItem('cos.servidor', JSON.stringify({ url: 'mirall', clau: 'mirall' }));
    localStorage.removeItem('cos.cua');
  } catch (e) {}
  /* SENSE TREBALLADOR DE SERVEI AL MIRALL. Algun navegador de proves —el
     panell integrat, per exemple— no en deixa registrar cap: el fitxer arriba
     bé i el registre falla igualment, i la consola s'omple d'un error que a
     l'app de debò no hi és. El mirall és per mirar la pantalla; el treballador
     es comprova a la pàgina publicada. */
  if (navigator.serviceWorker) {
    try {
      navigator.serviceWorker.register = function () {
        return new Promise(function () {});   // ni resol ni falla: com si no hi fos
      };
    } catch (e) {}
  }
  window.__MIRALL_VISTA = ${j(VISTA)};
})();
</script>
<div style="position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#c8332b;color:#fff;
            font:600 11px/1.6 system-ui;letter-spacing:.08em;text-align:center;padding:3px">
  MIRALL · DADES INVENTADES · NO SÓN LES TEVES
</div>
`;

/* Va DESPRÉS de l'arrencada: el hash no serveix perquè l'arrencada se'l menja. */
const DESPRES = `
<script>
  setTimeout(function () {
    var v = new URLSearchParams(location.search).get('vista') || window.__MIRALL_VISTA;
    if (v && App.vistes[v]) App.ves(v);
  }, 60);
</script>`;

const marca = '<script>\n  (function () {';
if (font.indexOf(marca) === -1) {
  console.error('No trobo el bloc d\'arrencada a index.html. Executa `npm run construeix`.');
  process.exit(1);
}

if (!fs.existsSync(CARPETA)) fs.mkdirSync(CARPETA, { recursive: true });
fs.writeFileSync(path.join(CARPETA, 'index.html'),
  font.replace(marca, MOCK + marca).replace('</body>', DESPRES + '</body>'));

/* Les peces d'instal·lació, al costat. Sense elles el navegador no troba el
   treballador de servei i la consola s'omple d'errors que a l'app de debò no
   hi són —i un mirall que avisa de coses falses ensenya a no mirar-lo. */
['sw.js', 'firebase-messaging-sw.js', 'manifest.webmanifest', 'icona.svg', 'icona-192.png', 'icona-512.png', 'icona-maskable-512.png', 'apple-touch-icon.png', 'icona-192.png', 'icona-512.png', 'icona-maskable-512.png', 'apple-touch-icon.png',
 'icona-maskable.svg', 'favicon.svg'].forEach((f) => {
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(CARPETA, f));
});

/* Les dues amplades alhora. Els desbordaments no es veuen mai a la finestra
   tal com la tens: es veuen quan poses la pantalla a 375 de debò. */
const VISTES = ['inici', 'seguiment', 'entrenaments'];
fs.writeFileSync(path.join(CARPETA, 'amplades.html'), `<!doctype html>
<meta charset="utf-8"><title>El cos · amplades</title>
<style>
  html,body{margin:0;background:#2b2f31;font:13px system-ui;color:#cfd6d8}
  .barra{padding:8px 10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .barra a{color:#8fd0ea;text-decoration:none;padding:3px 8px;border:1px solid #56666d}
  .barra a.ara{background:#4e9bc0;color:#08131a;border-color:#4e9bc0}
  .fila{display:flex;gap:14px;padding:0 10px 14px;align-items:flex-start}
  figure{margin:0} figcaption{padding:4px 0;color:#93a2a8}
  iframe{border:1px solid #56666d;background:#0e1214;display:block}
</style>
<div class="barra"><b>MIRALL</b> · dades inventades ·
  ${VISTES.map(v => `<a href="amplades.html?v=${v}"${v === VISTA ? ' class="ara"' : ''}>${v}</a>`).join('')}
</div>
<div class="fila">
  <figure><figcaption>375 — mòbil</figcaption>
    <iframe id="m" width="375" height="720"></iframe></figure>
  <figure><figcaption>1180 — escriptori</figcaption>
    <iframe id="d" width="1180" height="720"></iframe></figure>
</div>
<script>
  var v = new URLSearchParams(location.search).get('v') || ${j(VISTA)};
  document.getElementById('m').src = 'index.html?vista=' + v;
  document.getElementById('d').src = 'index.html?vista=' + v;
</script>`);

console.log('\nMirall a `' + CARPETA + '`  ·  vista d\'arrencada: ' + VISTA);
console.log('  index.html      una sola pantalla');
console.log('  amplades.html   mòbil i escriptori alhora, amb totes les vistes a dalt\n');
