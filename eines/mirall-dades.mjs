/**
 * El cos — les dades inventades del mirall
 *
 * Viuen a part perquè `mirall.mjs` no acabi sent un fitxer de mil línies on
 * el que importa —com s'enganxa el servidor fals— quedi enterrat.
 *
 * NO S'ASSEMBLEN A LES D'EN POL A POSTA. Noms, xifres i comerços són
 * inventats, i la pàgina ho diu amb una barra vermella a sota. El que sí que
 * s'assembla és la FORMA: quantitats realistes, noms llargs i curts, i prou
 * files per fer aparèixer els problemes que només surten quan n'hi ha moltes.
 */

export function dades(AVUI, menys) {

  /* Data LOCAL. Amb toISOString, a la nit surt el dia d'abans i el mirall
     et fa perseguir un error que no hi és. */
  const localIso = (d) => [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-');
  const dillunsDe = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    const n = (d.getDay() + 6) % 7;          // 0 = dilluns
    d.setDate(d.getDate() - n);
    return localIso(d);
  };
  const suma = (iso, n) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return localIso(d);
  };

  // ------------------------------------------------- les setmanes del mirall
  /* TOT ES COMPTA A PARTIR D'AVUI, i el seguiment i els entrenaments
     comparteixen les mateixes setmanes: el control de cada diumenge llegeix
     la càrrega de la seva setmana, i les carenes del seguiment es dibuixen
     amb els entrenaments d'aquells dies. Amb dates fixes, el dia que les
     dates quedaven enrere el mirall deixava de provar res.
     Inventat, com tot el mirall: aquest fitxer va al repositori públic. */
  const dlAra = dillunsDe(AVUI);
  const N = 12;                                   // controls fets
  const diumenge = (k) => suma(dlAra, -1 - 7 * k); // k = 0 és el de la setmana passada

  // La sèrie, de la més vella a la d'ara.
  const S = {
    pes:    [80.6, 80.2, 80.4, 79.9, 80.0, 79.7, 79.5, 79.4, 79.1, 79.6, 78.7, 78.4],
    cint:   [91.0, 90.8, 90.7, 90.4, 90.3, 89.9, 89.6, 89.4, 89.1, 89.3, 88.5, 88.0],
    forca:  [1, 2, 1, 0, 2, 2, 2, 2, 1, 1, 2, 2],
    trail:  [2, 2, 3, 0, 2, 3, 3, 3, 3, 4, 3, 3],
    gros:   [0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    energia:['normal', 'normal', 'baixa', 'normal', 'normal', 'alta', 'normal', 'normal', 'normal', 'baixa', 'baixa', 'normal']
  };

  /* Les sortides de cada setmana: dia (0 = dilluns), mena, km, desnivell,
     minuts i títol. Un patró per setmana, que es repeteix girat. */
  const PATRONS = [
    [[1, 'trail', 6.2, 120, 38, 'Suau de tarda'], [3, 'forca', null, null, 40, 'Tren superior'], [5, 'trail', 9.4, 420, 64, 'Volta pel Puigsacalm']],
    [[0, 'forca', null, null, 35, 'Cames i core'], [2, 'trail', 7.8, 480, 62, 'Sèries a la pujada'], [5, 'trail', 14.6, 1120, 158, 'Matinal al Montseny'], [6, 'trail', 5.0, 60, 31, 'Rodatge de recuperació']],
    [[1, 'trail', 8.1, 260, 52, 'Pel camí del Ter'], [3, 'forca', null, null, 42, 'Esquena i espatlles'], [4, 'trail', 6.0, 180, 39, 'Tirada curta'], [6, 'trail', 18.2, 1380, 210, 'Travessa del Collsacabra']],
    [[2, 'trail', 10.4, 640, 78, 'Tavertet per dalt'], [3, 'forca', null, null, 38, 'Tren superior'], [5, 'trail', 12.0, 900, 128, 'Matagalls des de Collformic']]
  ];
  const sessions = [];
  let nSes = 0;
  for (let k = N; k >= 0; k--) {               // k = N … 1: setmanes amb control; 0: aquesta
    const dl = suma(dlAra, -7 * k);
    const vell = N - k;                         // índex a la sèrie
    if (k > 0 && S.trail[vell] === 0) continue; // la setmana de vacances: res
    const pat = PATRONS[(vell + 1) % PATRONS.length];
    pat.forEach((p, n) => {
      const data = suma(dl, p[0]);
      if (data > AVUI) return;                  // el que encara no ha passat no hi és
      sessions.push({ id: 'ent_' + (++nSes), data, mena: p[1], titol: p[5],
        km: p[2], desnivell: p[3], minuts: p[4],
        kcal: p[2] ? Math.round(p[4] * 9.5) : Math.round(p[4] * 5.5),
        pulsacions: p[2] ? 140 + ((vell * 7 + n * 5) % 22) : null,
        font: n % 3 === 2 ? 'ma' : 'captura', notes: '' });
    });
  }
  const kmEsforc = (s) => (s.km || s.desnivell)
    ? Math.round(((s.km || 0) + (s.desnivell || 0) / 100) * 10) / 10 : null;

  const entSetmana = (dl) => {
    const fins = suma(dl, 6);
    const dins = sessions.filter((s) => s.data >= dl && s.data <= fins)
      .map((s) => { const e = kmEsforc(s); return Object.assign({}, s, { kmEsforc: e, llarga: e !== null && e >= 12 }); });
    const sumaCamp = (c) => dins.reduce((t, s) => t + (s[c] || 0), 0);
    const kmE = Math.round(sumaCamp('kmEsforc') * 10) / 10;
    let mesLlarga = null;
    dins.forEach((s) => { if (s.kmEsforc !== null && (!mesLlarga || s.kmEsforc > mesLlarga.kmEsforc)) mesLlarga = s; });
    return {
      dilluns: dl, fins, sessions: dins.length,
      trail: dins.filter((s) => s.mena === 'trail').length,
      forca: dins.filter((s) => s.mena === 'forca').length,
      altres: dins.filter((s) => s.mena === 'altre').length,
      km: Math.round(sumaCamp('km') * 10) / 10, desnivell: sumaCamp('desnivell'), minuts: sumaCamp('minuts'),
      kmEsforc: kmE, llargues: dins.filter((s) => s.llarga).length, mesLlarga, llista: dins, dura: kmE >= 60
    };
  };
  const perDies = (s) => {
    const d = [0, 0, 0, 0, 0, 0, 0];
    s.llista.forEach((x) => { if (x.kmEsforc === null) return; for (let i = 0; i < 7; i++) if (suma(s.dilluns, i) === x.data) d[i] += x.kmEsforc; });
    return d.map((v) => Math.round(v * 10) / 10);
  };

  const PASSOS = {};
  for (let k = 1; k <= 6; k++) {
    const dl = suma(dlAra, -7 * k);
    const total = 61000 + ((k * 7919) % 21000);
    PASSOS[dl] = { dilluns: dl, total, mitjana: Math.round(total / 7), font: 'captura', id: 'pas_' + k };
  }

  const entPantalla = (desde) => {
    const dl = dillunsDe(desde || AVUI);
    const corba = [];
    let cur = dl;
    for (let i = 0; i < 12; i++) {
      const s = entSetmana(cur);
      corba.unshift({ dilluns: cur, kmEsforc: s.kmEsforc, sessions: s.sessions, desnivell: s.desnivell,
                      passos: PASSOS[cur] ? PASSOS[cur].total : null, dies: perDies(s) });
      cur = suma(cur, -7);
    }
    const ara = entSetmana(dl);
    ara.passos = PASSOS[dl] || null;
    return { avui: AVUI, dilluns: dl, setmana: ara, corba, total: sessions.length,
             llindars: { llarga: 12, setmanaDura: 60 } };
  };

  // ------------------------------------------------------------- seguiment
  const historic = S.pes.map((pes, i) => {
    const k = N - 1 - i;
    const ambFotos = i === 0 || i === 4 || i === 8 || i === N - 1;
    return {
      id: 'seg_' + (i + 1), data: diumenge(k), pes, cintura: S.cint[i], cinturaValida: i !== 2,
      forca: S.forca[i], trail: S.trail[i], trailGros: S.gros[i], energia: S.energia[i],
      son: i % 4 === 0 ? 'malament' : 'normal', gana: i % 3 === 0 ? 'molta' : 'normal',
      dieta: i % 5 === 0 ? 'a mitges' : 'bé',
      fotos: ambFotos ? { frontal: 'fals_' + i + 'f', perfil: i % 8 === 0 ? 'fals_' + i + 'p' : '', esquena: 'fals_' + i + 'e' }
                      : { frontal: '', perfil: '', esquena: '' },
      notes: i === 0 ? 'Punt de partida de la fase.' : ''
    };
  });
  const carregues = {};
  historic.forEach((c) => {
    const s = entSetmana(dillunsDe(c.data));
    carregues[dillunsDe(c.data)] = s.sessions ? { sessions: s.sessions, trail: s.trail, forca: s.forca,
      km: s.km, desnivell: s.desnivell, kmEsforc: s.kmEsforc, llargues: s.llargues } : null;
  });
  const diaDelControl = 7;
  const avuiDia = ((new Date(AVUI + 'T12:00:00').getDay() + 6) % 7) + 1;
  const ultim = historic[historic.length - 1];
  const fetAquesta = ultim.data >= dlAra;
  const segPantalla = () => ({
    avui: AVUI,
    historic,
    pla: {
      'control.dia': String(diaDelControl),
      'pla.resum': 'Dèficit moderat, proteïna alta, trail com a prioritat.',
      'fase.1.desde': historic[0].data, 'fase.1.nom': 'Base',
      'fase.1.objectiu': 'més magre i en forma aeròbica'
    },
    fase: { desde: historic[0].data, nom: 'Base', objectiu: 'més magre i en forma aeròbica',
            kcal: 2000, proteina: 150, forca: 2, trail: 3 },
    estat: { avui: AVUI, dia: diaDelControl, toca: avuiDia >= diaDelControl,
             pendent: avuiDia >= diaDelControl && !fetAquesta, fetAquestaSetmana: fetAquesta,
             ultim: ultim.data },
    llindars: { perdSana: [0.4, 0.7], perdRapida: 0.8, saltImpossible: 3.0,
                cinturaIncoherent: 2.5, pesEstable: 0.3, forcaMinima: 2, diesTolerats: [5, 10] },
    comEsMesura: {
      pes: 'Matí, en dejú, després del lavabo. Si pots, mitjana de 2-3 dies.',
      cintura: 'Matí, en dejú, dret i relaxat. Expiració normal —ni buidar pulmons ni contreure—. Cinta al melic, sense estrènyer.',
      fotos: 'Mateix lloc, mateixa llum, mateixa hora, mateixa roba.'
    },
    carregues
  });

  // ------------------------------------------------------------------ inici
  const nucliInici = () => ({
    avui: AVUI,
    moduls: [
      { id: 'seguiment', nom: 'Seguiment FitFat', icona: 'seguiment', ordre: 25, teVista: true },
      { id: 'entrenaments', nom: 'Entrenaments', icona: 'entrenaments', ordre: 26, teVista: true }
    ],
    targetes: [
      { modul: 'seguiment', icona: 'seguiment', etiqueta: 'Control setmanal', valor: 'pendent', urgent: true, accio: 'seguiment' },
      { modul: 'entrenaments', icona: 'entrenaments', etiqueta: 'Entrenaments', valor: 'aquesta setmana', urgent: false, accio: 'entrenaments' }
    ],
    ia: { disponible: false }
  });

  return { nucliInici, segPantalla, entPantalla, entSetmana, dlAra, suma, dillunsDe };
}
