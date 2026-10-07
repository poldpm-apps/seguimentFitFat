---
name: El cos — el pols de les setmanes
description: Cada control setmanal és una carena; dotze setmanes apilades són el pols del cos, i la d'ara, davant i fosca, és el veredicte.
colors:
  camp: "#e8eef0"
  camp-alt: "#f3f6f7"
  blanc: "#fbfcfc"
  tinta: "#0d191e"
  tinta-2: "#3d5560"
  tinta-3: "#5b717a"
  t1-vell: "#bcced4"
  t2: "#7ab5c1"
  t3: "#1c8496"
  t4-ara: "#054a57"
  fil: "#9fb4bb"
  fil-fort: "#0d191e"
  ocre: "#85580f"
  ocre-fons: "#f4ead7"
typography:
  veredicte:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  titol:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  xifra:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
  cos:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  gravat:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.14em"
  entrada:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
rounded:
  cap: "0px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "24px"
  e6: "32px"
  e7: "48px"
components:
  boto-primari:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.blanc}"
    rounded: "{rounded.cap}"
    height: "44px"
    padding: "0 16px"
  boto:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.cap}"
    height: "44px"
    padding: "0 16px"
  boto-perill:
    backgroundColor: "{colors.ocre}"
    textColor: "#ffffff"
    rounded: "{rounded.cap}"
    height: "44px"
  entrada:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.tinta}"
    typography: "{typography.entrada}"
    rounded: "{rounded.cap}"
    height: "48px"
    padding: "10px 12px"
  tria-triat:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.blanc}"
    height: "44px"
  fila-triada:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.tinta}"
  brindis:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.blanc}"
    height: "48px"
---

# El cos — el pols de les setmanes

## Overview

Un catàleg imprès sobre el camp pàl·lid de la icona. La idea que ho governa tot
és la de la icona —cap, coll i espatlles— i la de la pila de carenes del
seguiment: **el que és vell és clar i va al darrere; el que és d'ara és fosc i
va al davant.** Ve del catàleg de Factory Records (Saville, *Unknown
Pleasures*): molt camp sense imprimir, filets prims, números de catàleg en
versaletes, una sola imatge que mana.

És una eina d'una sola persona que es fa servir amb una mà, al mòbil, el
diumenge a les sis del matí. Per això: el veredicte i les quatre xifres
primer, tocs de 44 px, el botó de desar sempre a mà, i res que s'hagi
d'interpretar per saber com ha anat la setmana. Un sol tema, el clar (la
paleta és la de la icona, que a en Pol li agrada molt).

Es refusa: el tauler de fitness amb anells, targetes i ratxes; el mapa
topogràfic de JEFE (corbes de nivell, quadrícula UTM, panells foscos); el
dorsal de Nutrició.

## Colors

- **El camp** `#e8eef0` és el fons de tot i el de la icona. `#f3f6f7` és on es
  posa el dit (hover, premut) i `#fbfcfc`, el que està triat i els camps on
  s'escriu.
- **La tinta** `#0d191e` és el text i els botons primaris. `#3d5560` el
  secundari (6,7:1) i `#5b717a` el que menys diu (4,6:1).
- **La rampa del temps**, de vell a ara: `#bcced4` → `#7ab5c1` → `#1c8496` →
  `#054a57`. És l'únic sistema de color de les dades: carenes, filets de les
  dotze setmanes, punts de les gràfiques. La setmana d'ara sempre en `#054a57`.
- **L'ocre** `#85580f` (fons `#f4ead7`) vol dir «hi ha alguna cosa a corregir o
  a vigilar»: el veredicte «Hi ha coses a corregir», els errors, una fila dubtosa
  d'una captura i el botó del que no es pot desfer. Sempre amb text al costat.
- Res més: cap degradat, cap color fora d'aquesta família.

## Typography

Una sola família, **Hanken Grotesk** (OFL, allotjada a `fonts/`, variable
400–600), sempre amb xifres tabulars perquè els números s'alineïn com en un
registre.

- **Veredicte** 38/600, la frase que has vingut a llegir.
- **Títol de pantalla** 30/600.
- **Xifres** 44/500 per a les quatre del control (pes, cintura, força, trail:
  totes iguals); 60/500 per a la càrrega d'entrenaments; 24/600 per a les dades
  de segona fila.
- **Gravat** 12/600, versaletes amb 0,14em d'espai: etiquetes, capçaleres de
  secció i números de catàleg (`CTRL 041`). És l'únic lloc on es fa servir
  majúscula.
- **Cos** 16/400 a 1,45; **menut** 14 per a explicacions i protocols;
  **entrades** 17 (perquè l'iPhone no s'apropi sol).

## Layout

- Mòbil primer, columna única de màxim 680 px centrada, marge de 16 px.
- L'estructura la fan els filets i l'alineació, **no les caixes**: cada secció
  s'obre amb un filet fort (`#0d191e`) i un `seccio-cap` amb el títol en gravat
  a l'esquerra i un comentari a la dreta; les files se separen amb filet prim
  (`#9fb4bb`).
- Quatre xifres en graella de 2×2 al mòbil i 4 en línia a partir de 420 px,
  separades per filets verticals.
- Les gràfiques SVG (carenes i dotze setmanes) tenen un màxim de 480 px perquè
  la lletra del dibuix no s'escali a l'escriptori.
- Una sola escala d'espai: 4 · 8 · 12 · 16 · 24 · 32 · 48 px.

## Elevation & Depth

Pla. No hi ha ombres. L'única profunditat és la de la pila de carenes (cada una
amb un farciment del color del camp que tapa les del darrere) i la del full que
puja des de baix, separat per una cortina de tinta al 44 %.

## Shapes

Cantonades rectes a tot arreu: botons, camps, fulls, imatges. Traços d'icona
d'1,6 px amb puntes arrodonides. Els únics cercles són els punts de les
gràfiques.

## Components

- **Capçalera**: fletxa d'enrere (44×44), la marca petita amb «EL COS» en gravat
  i el botó primari a la dreta (`Control`, `Captura`); a sota, el títol i la
  fase o la setmana.
- **Botons**: rectangulars amb filet de tinta; el primari ple de tinta; el de
  perill ple d'ocre; `scale(.97)` en prémer; mentre espera, una ratlla corre per
  dins i el text s'amaga.
- **La pila de carenes** (`.pols`): una per control, els dotze últims, dibuixada
  amb els km-esforç de cada dia (dl → dg) que dona el servidor dels
  entrenaments. Plana si no hi ha dades: mai cap cim inventat. La triada,
  2,4 px; la d'ara, 1,4 px fosca; les velles, 1 px en rampa. El número de la
  triada va al peu, no a sobre del dibuix.
- **Xifra** (`.xifra`): gravat, número gros, unitat petita i una línia de sota
  (el canvi o l'objectiu de la fase).
- **Fila de control** (`.fila-c`): número de catàleg i data, veredicte (ocre si
  cal corregir) i pes; la triada, fons blanc i filet inferior `#054a57`.
- **Full** (modal): puja des de baix al mòbil i surt al mig a l'escriptori;
  capçalera enganxada; el botó de desar enganxat a peu (`.desa-fix`); errors al
  costat del camp en ocre; Escape tanca, el focus no s'escapa i torna on era.
- **Triar una de tres** (`.tria-fila`): una regla amb tres trams; el triat ple de
  tinta.
- **Fotos**: sempre amagades en entrar; «N FOTOS · AMAGADES» i «Ensenya-les»; la
  lectura de la IA va abans de les imatges.
- **Brindis**: barra de tinta a baix; ocre si és un error.

## Do's and Don'ts

- **Fes** que el que és vell sigui clar i el que és d'ara, fosc.
- **Fes** servir filets i alineació per separar; un filet fort obre cada secció.
- **Fes** que les quatre xifres del control pesin igual; el trail no és secundari.
- **Fes** servir el número de catàleg (`CTRL nnn`) com a nom d'un control.
- **No** inventis dades als dibuixos: si no n'hi ha, la línia és plana.
- **No** facis servir targetes arrodonides, ombres, degradats, anells ni ratxes.
- **No** facis servir l'ocre per decorar: només per al que s'ha de corregir o vigilar.
- **No** hi tornis a posar res del mapa topogràfic de JEFE.
