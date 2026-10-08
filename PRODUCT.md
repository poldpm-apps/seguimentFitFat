# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Una sola persona: en Pol del Pozo, mestre de 2n de primària a Vic, que corre per
muntanya (trail) i fa força. L'app és seva i de ningú més. La fa servir **gairebé
sempre des del mòbil**: el diumenge al matí, en dejú i abans d'esmorzar, per fer
el control setmanal; i durant la setmana, per apuntar una sortida o passar la
captura de Strava. L'escriptori, de tant en tant.

## Product Purpose

El cos i el que hi fa, en una sola app amb dues pantalles. El **control setmanal**
mesura el cos (pes, cintura, força, trail, energia, son, gana, dieta, fotos); els
**entrenaments** són el que l'explica (km-esforç, desnivell, sessions, passos).
El control llegeix la càrrega de la setmana dels entrenaments: per això van junts.

Surt dels apartats de Seguiment FitFat i d'Entrenaments de JEFE i ha de fer
exactament el mateix. Èxit: fer el control del diumenge en un minut, entendre
d'un cop d'ull si la setmana ha anat bé, i que les fotos les llegeixi algú que en
sàpiga en comptes de fer-les servir de galeria.

## Positioning

No és una app de fitness amb anells i ratxes. És el quadern d'una persona que
mesura el cos a poc a poc i l'explica amb el desnivell que hi ha posat. La xifra
que ho resumeix tot és el **km-esforç** (km + desnivell ÷ 100), i el veredicte de
la setmana surt de regles fixes, no d'una IA.

## Operating Context

- El control és **un cop per setmana, el diumenge a les 6:00** (el dia viu al full
  `SeguimentPla`, `control.dia`). Hi ha un avís al mòbil aquell matí.
- Les mesures es fan amb protocol: pes en dejú després del lavabo; cintura al
  melic, dret i relaxat; fotos al mateix lloc, amb la mateixa llum i la mateixa
  roba. El protocol surt al costat de cada camp.
- Les sessions arriben sobretot per **captura de Strava**: Gemini la llegeix i torna
  una proposta que s'ha de confirmar; les files dubtoses van marcades.
- Les dades viuen en un full de càlcul de Google propi; les fotos, en una carpeta
  privada del seu Drive. El servidor és Apps Script; la pantalla la serveix GitHub
  Pages a `poldpm.github.io/seguimentFitFat`, instal·lable al mòbil.

## Capabilities and Constraints

- **Seguiment**: control setmanal (pes, cintura amb opció «no és de fiar», força,
  trail, llargues, energia, son, gana, dieta, notes); veredicte i avisos de regles;
  quatre xifres de primera (pes, cintura, força, trail); la càrrega de la setmana
  del control; gràfiques de pes i cintura; comentari de l'entrenador (IA, amb els
  vuit últims controls, la fase i el pla); fotos frontal/perfil/esquena al Drive,
  **amagades per defecte**, amb la lectura de la IA comparant la més antiga amb
  l'actual de cada angle; històric de controls.
- **Entrenaments**: setmana amb navegació, km-esforç, sessions, km, desnivell,
  temps; passos setmanals; gràfica de dotze setmanes; llista de sessions; apuntar a
  mà (mena, títol, km, desnivell, minuts, kcal, pulsacions, notes); importar
  captura (Strava, app de força, passos) que no escriu fins que es confirma.
- La resposta de la IA es pot tallar: es reintenta i, si encara es talla, la
  pantalla ho diu. No es desa mai una lectura a mitges.
- Res de funcions noves respecte de JEFE sense que ell ho aprovi. Ell no paga res.
- Català a tota la interfície.

## Brand Commitments

- Nom: **El cos**.
- Icona: **cap, coll i espatlles** — una carena que és un bust, amb les carenes de
  setmanes anteriors al darrere. La forma és fixa.
- **Els colors de l'icona li agraden molt** i es queden: fons gris pàl·lid
  `#e8eef0`, la rampa de turquesa de clar (el que és vell) a fosc (el d'ara)
  `#bcced4 · #7ab5c1 · #1c8496 · #054a57`, i la tinta `#0d191e`. La paleta de
  l'app en surt; el que no li agrada de JEFE és la resta del món visual.
- El disseny és **totalment independent** del de JEFE (que no li agrada) i del de
  Nutrició («el dorsal»).

## Evidence on Hand

- Dades reals: el full «JEFE — Assistent» (pestanyes Seguiment, SeguimentPla,
  Entrenaments, EntrenamentsPassos) i la carpeta «JEFE · Seguiment físic» del Drive.
  Mai al repositori, que és públic.
- Al mirall (`npm run mirall`) hi ha dades inventades; no s'han d'assemblar a les
  seves.

## Product Principles

1. El que ha vingut a saber, primer: el veredicte de la setmana i la càrrega.
2. Les mesures valen si es fan igual cada vegada: el protocol va al costat del camp.
3. Res s'escriu sense que ell ho vegi i ho accepti (captures, fotos, esborrats).
4. Les fotos són per llegir el canvi, no per mirar-se: amagades fins que les demana.
5. Una xifra a mitges o inventada és pitjor que un forat.

## Accessibility & Inclusion

Es fa servir amb una mà, a primera hora i sovint amb poca llum: tocs grans,
contrast alt, text llegible a 375 px, i respecte pel moviment reduït.
