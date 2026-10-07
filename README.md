# El cos

El control setmanal del cos i els entrenaments que l'expliquen. Surt dels
apartats de **Seguiment FitFat** i d'**Entrenaments** de JEFE i fa exactament
el mateix: dues pantalles, una sola app, perquè el control setmanal llegeix la
càrrega de la setmana dels entrenaments.

- **L'app:** <https://poldpm.github.io/cos/>
- **Les dades:** un full de càlcul propi, «El cos», al teu Drive.
- **Les fotos:** a la carpeta «JEFE · Seguiment físic» del teu Drive, la de
  sempre. El full només en guarda l'identificador.
- **El servidor:** un projecte d'Apps Script propi.

## Com està fet

```
apps-script/   el codi. Apps Script el serveix i GitHub Pages en publica la pantalla
eines/         comprovar, provar, construir, desplegar i el mirall
index.html     la pantalla publicada. LA GENERA `npm run construeix`: no l'editis
```

El nucli (`00_` a `65_`) és el de JEFE, copiat. El frontal té un disseny propi, «el pols de les setmanes»: vegeu `DESIGN.md`.
Els fitxers propis són `40_Mod_Seguiment.gs`, `vista_seguiment.html`,
`40_Mod_Entrenaments.gs` i `vista_entrenaments.html`.

## Les ordres

```bash
npm run comprova     # comprovacions i proves; ha de dir «Tot correcte»
npm run mirall       # la pantalla amb dades inventades, per mirar-la en local
npm run puja         # comprova, prova, construeix, puja a Apps Script i desplega
git push             # publica la PANTALLA a GitHub Pages
```

`npm run puja` actualitza el servidor; la pantalla la serveix GitHub Pages i
**sense `git push` segueixes veient la d'abans.**

## La primera vegada (a l'editor d'Apps Script)

1. Executa **`instala()`**. Crea el full «El cos», s'hi porta les pestanyes
   `Seguiment`, `SeguimentPla`, `Entrenaments` i `EntrenamentsPassos` del full
   de JEFE —les **copia**, el de JEFE no es toca—, i també els ajustos de la IA
   del seu `_Config`. Instal·la els automatismes i escriu la clau d'accés al
   registre. Copia-la.
2. A *Configuració del projecte → Propietats de l'script*, afegeix
   `CLAU_IA` i `FIREBASE_COMPTE` amb els mateixos valors que al projecte de
   JEFE.
3. Executa **`provaFotos()`**: diu si es veuen les fotos velles i et demana el
   permís de Drive. Després, **`provaAvisos()`** i **`provaEntrenaments()`**.
4. Obre l'app, enganxa-hi l'adreça del desplegament (acaba en `/exec`) i la
   clau, i prem **Activa els avisos**.

## Els automatismes

| Quan | Què |
|---|---|
| el dia del control (diumenge), cap a les 6:00 | l'avís del control setmanal, si encara no l'has fet |
| cada 3 hores | els senyals |
| cada 10 minuts | prepara les pantalles perquè s'obrin ràpid |
| cada dia a les 3 | manteniment: registre i estructura del full |

El dia del control viu en un sol lloc: `control.dia` al full `SeguimentPla`
(1 és dilluns, 7 diumenge). Canviar-lo mou l'avís sense tornar a instal·lar res.

## Les propietats de l'script

Mai al codi ni al repositori.

| Propietat | Per a què |
|---|---|
| `ID_FULL` | el full de càlcul; la posa `configura()` |
| `CLAU_ACCES` | la clau de la pantalla; la posa `generaClauAcces()` |
| `CLAU_IA` | Gemini: la lectura de les fotos, l'entrenador i les captures de Strava |
| `FIREBASE_COMPTE` | els avisos al mòbil |

## Instal·lar-la al mòbil

- **Android necessita icones PNG** (a Nutrició, amb només SVG, la instal·lació
  es quedava a mitges). El manifest porta PNG de 192 i 512 i una de
  retallable, abans dels SVG; una prova ho vigila.
- **L'`"id"` del manifest és `/cos/` i no es canvia mai.** Canviar-lo vol dir
  que, per a Chrome, és una altra app.
