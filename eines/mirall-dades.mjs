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

  // ------------------------------------------------------------- seguiment
  /* Inventat, com tot el mirall. Les xifres de debò no surten mai d aqui:
     aquest fitxer si que va al repositori public. */
  const segPantalla = () => ({
    avui: AVUI,
    historic: [
      { id: 'seg_1', data: '2026-06-05', pes: 71.4, cintura: 88, cinturaValida: false,
        forca: 1, trail: 2, trailGros: 0, energia: 'normal', son: 'normal', gana: 'normal',
        dieta: 'a mitges', fotos: { frontal: '', perfil: '', esquena: '' }, notes: 'Punt de partida.' },
      { id: 'seg_2', data: '2026-06-12', pes: 70.8, cintura: 84.5, cinturaValida: true,
        forca: 2, trail: 3, trailGros: 1, energia: 'normal', son: 'bé', gana: 'normal',
        dieta: 'bé', fotos: { frontal: 'fals_1f', perfil: 'fals_1p', esquena: '' }, notes: '' },
      { id: 'seg_3', data: '2026-06-19', pes: 69.3, cintura: 83, cinturaValida: true,
        forca: 0, trail: 4, trailGros: 2, energia: 'baixa', son: 'normal', gana: 'molta',
        dieta: 'a mitges', fotos: { frontal: '', perfil: '', esquena: '' }, notes: 'Setmana de molt desnivell.' },
      { id: 'seg_4', data: '2026-06-26', pes: 69.5, cintura: 82.5, cinturaValida: true,
        forca: 2, trail: 3, trailGros: 0, energia: 'normal', son: 'bé', gana: 'normal',
        dieta: 'bé', fotos: { frontal: 'fals_4f', perfil: '', esquena: 'fals_4e' }, notes: '' }
    ],
    pla: {
      'control.dia': '7',
      'pla.resum': 'Dèficit moderat, proteïna alta, trail com a prioritat.',
      'fase.1.desde': '2026-06-01', 'fase.1.nom': 'Base',
      'fase.1.objectiu': 'més magre i en forma aeròbica'
    },
    fase: { desde: '2026-06-01', nom: 'Base', objectiu: 'més magre i en forma aeròbica',
            kcal: 2000, proteina: 150, forca: 2, trail: 3 },
    estat: { avui: AVUI, dia: 7, toca: true, pendent: true, fetAquestaSetmana: false,
             fa: 38, ultim: '2026-06-26' },
    llindars: { perdSana: [0.4, 0.7], perdRapida: 0.8, saltImpossible: 3.0,
                cinturaIncoherent: 2.5, pesEstable: 0.3, forcaMinima: 2, diesTolerats: [5, 10] },
    comEsMesura: {
      pes: 'Matí, en dejú, després del lavabo. Si pots, mitjana de 2-3 dies.',
      cintura: 'Matí, en dejú, dret i relaxat. Expiració normal. Cinta al melic, sense estrènyer.',
      fotos: 'Mateix lloc, mateixa llum, mateixa hora, mateixa roba.'
    },
    /* La carrega de les setmanes que tenen control. La del 19 de juny hi es a
       posta amb desnivell de debo i la del 26 no: aixi es veu que la linia
       apareix quan hi ha dades i desapareix quan no n hi ha. */
    carregues: {
      '2026-06-15': { sessions: 4, trail: 3, forca: 1, km: 18.2, desnivell: 240,
                      kmEsforc: 20.6, llargues: 0 },
      '2026-06-22': null
    }
  });
  // -------------------------------------------------------- entrenaments
  /* Inventat, com tot el mirall. Les setmanes estan fetes a posta perquè es
     vegi la diferencia que en Pol demanava: la del 20 de juliol son quatre
     sortides curtes i planes, la del 27 son tres sortides amb desnivell de
     debo. Amb «sortides: 4» i «sortides: 3» la primera semblava la mes dura;
     amb quilometres d esforc no s hi assemblen. */
  const entSessions = () => ([
    { id: 'ent_1', data: '2026-07-20', mena: 'trail', titol: 'Volta pel canal',
      km: 5.2, desnivell: 40, minuts: 31, kcal: 340, pulsacions: 148, font: 'captura', notes: '' },
    { id: 'ent_2', data: '2026-07-22', mena: 'forca', titol: 'Tren superior',
      km: null, desnivell: null, minuts: 42, kcal: 210, pulsacions: null, font: 'captura', notes: '' },
    { id: 'ent_3', data: '2026-07-23', mena: 'trail', titol: 'Suau de tarda',
      km: 6.1, desnivell: 90, minuts: 38, kcal: 400, pulsacions: 151, font: 'captura', notes: '' },
    { id: 'ent_4', data: '2026-07-25', mena: 'trail', titol: 'Sortida del dissabte',
      km: 8.4, desnivell: 210, minuts: 54, kcal: 560, pulsacions: 155, font: 'captura', notes: '' },
    { id: 'ent_5', data: '2026-07-28', mena: 'trail', titol: 'Sèries a la pujada',
      km: 7.8, desnivell: 480, minuts: 62, kcal: 640, pulsacions: 163, font: 'captura', notes: '' },
    { id: 'ent_6', data: '2026-07-29', mena: 'forca', titol: 'Esquena i espatlles',
      km: null, desnivell: null, minuts: 38, kcal: 190, pulsacions: null, font: 'ma', notes: '' },
    { id: 'ent_7', data: '2026-08-01', mena: 'trail', titol: 'Matinal al Montseny',
      km: 14.6, desnivell: 1120, minuts: 158, kcal: 1420, pulsacions: 149, font: 'captura', notes: '' }
  ]);

  const entSetmana = (dl) => {
    const fins = suma(dl, 6);
    const dins = entSessions().filter((s) => s.data >= dl && s.data <= fins)
      .map((s) => {
        const e = (s.km || s.desnivell)
          ? Math.round(((s.km || 0) + (s.desnivell || 0) / 100) * 10) / 10 : null;
        return Object.assign({}, s, { kmEsforc: e, llarga: e !== null && e >= 12 });
      });
    const sumaCamp = (c) => dins.reduce((t, s) => t + (s[c] || 0), 0);
    const kmE = Math.round(sumaCamp('kmEsforc') * 10) / 10;
    let mesLlarga = null;
    dins.forEach((s) => {
      if (s.kmEsforc !== null && (!mesLlarga || s.kmEsforc > mesLlarga.kmEsforc)) mesLlarga = s;
    });
    return {
      dilluns: dl, fins,
      sessions: dins.length,
      trail: dins.filter((s) => s.mena === 'trail').length,
      forca: dins.filter((s) => s.mena === 'forca').length,
      altres: dins.filter((s) => s.mena === 'altre').length,
      km: Math.round(sumaCamp('km') * 10) / 10,
      desnivell: sumaCamp('desnivell'),
      minuts: sumaCamp('minuts'),
      kmEsforc: kmE,
      llargues: dins.filter((s) => s.llarga).length,
      mesLlarga, llista: dins, dura: kmE >= 60
    };
  };

  const ENT_PASSOS = { '2026-07-20': { dilluns: '2026-07-20', total: 68420, mitjana: 9774, font: 'captura', id: 'pas_1' },
                       '2026-07-27': { dilluns: '2026-07-27', total: 81250, mitjana: 11607, font: 'captura', id: 'pas_2' } };

  const entPantalla = (desde) => {
    const dl = dillunsDe(desde || AVUI);
    const corba = [];
    let cur = dl;
    for (let i = 0; i < 12; i++) {
      const s = entSetmana(cur);
      corba.unshift({ dilluns: cur, kmEsforc: s.kmEsforc, sessions: s.sessions,
                      desnivell: s.desnivell, passos: ENT_PASSOS[cur] ? ENT_PASSOS[cur].total : null });
      cur = suma(cur, -7);
    }
    const ara = entSetmana(dl);
    ara.passos = ENT_PASSOS[dl] || null;
    return { avui: AVUI, dilluns: dl, setmana: ara, corba,
             total: entSessions().length,
             llindars: { llarga: 12, setmanaDura: 60 } };
  };

  // ------------------------------------------------------------------ inici
  const nucliInici = () => ({
    avui: AVUI,
    moduls: [
      { id: 'seguiment', nom: 'Seguiment FitFat', icona: 'seguiment', ordre: 25, teVista: true },
      { id: 'entrenaments', nom: 'Entrenaments', icona: 'entrenaments', ordre: 26, teVista: true }
    ],
    targetes: [
      { modul: 'seguiment', icona: 'seguiment', etiqueta: 'Control setmanal', valor: 'pendent', urgent: true, accio: 'seguiment' },
      { modul: 'entrenaments', icona: 'entrenaments', etiqueta: 'Entrenaments', valor: '28,4 km-e', urgent: false, accio: 'entrenaments' }
    ],
    ia: { disponible: false }
  });

  return { nucliInici, segPantalla, entPantalla, entSetmana };
}
