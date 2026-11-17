---
status: erledigt
vorschau_url:
commits: 49ec940, a1475e1
---
## Umgesetzt
- **Punkt 1, Radius:** Unverändert gelassen. Abgefragt werden 2 750 m um die Rasterzelle, ausgewertet 2 km um den Standort.
- **Punkt 2, Overpass:** Die Abfrage nutzt jetzt `out tags bb;`. Gerechnet wird der Abstand zum Begrenzungsrechteck; liegt die Anlage im Rechteck, ist er 0 m. Vorhandene volle Geometrie hat weiter Vorrang. Die Tests prüfen Abstände außen, an der Ecke und innen, außerdem eine Antwort im bb-Format. README angepasst. (Commit 49ec940)
- **Punkt 3, Endpunkt `GET /api/leistungscheck/wetter?lat&lon&von&bis`:** gebaut in `src/dwd.js`, `src/gk3.js` und `src/zip.js`, nur mit Bordmitteln von Node, ohne neue Abhängigkeiten. (Commit a1475e1)
  - **Antwort:** `{ monate:[{monat,kwhM2,mittelKwhM2,faktor}], zeitraumFaktor, quelle:"Deutscher Wetterdienst", abgerufen }`. Zusätzlich liefert sie `datensatz` (Zitierangabe des DWD), `mittelJahre` und `zwischengespeichert`.
  - **`zeitraumFaktor`** ist Summe Ist / Summe Mittel, also nach Strahlung gewichtet. Ein eigener Test prüft, dass es nicht der Durchschnitt der Monatsfaktoren ist.
  - **Koordinatenumrechnung:** WGS84 wird mit der Helmert-Transformation EPSG:1777 in das System DHDN übertragen, dann nach Gauß-Krüger 3. Streifen (EPSG:31467) projiziert. Gegen die EPSG-Rechenbeispiele stimmt sie auf 1 cm. Ohne die Datumsumrechnung läge der Punkt rund 100–150 m daneben. Die Rasterzelle wird nach Esri-ASCII bestimmt. Fällt der Standort in eine leere Zelle, springt das Mittel der Nachbarzellen ein; außerhalb Deutschlands gibt es 422.
  - **Grenzen:** nur abgeschlossene Monate ab 1991-01, höchstens 24 je Abfrage. Zeitlimit 30 s je Datei, 4 Downloads gleichzeitig. Noch nicht veröffentlichte Monate ergeben 422 mit Hinweis.
  - **Zwischenspeicher `data/wetter/`, ohne Ablauf:** je Ist-Monat und je Kalendermonat-Mittel eine Datei. Die 19 Jahresdateien für ein Mittel werden nur im Arbeitsspeicher verarbeitet und nicht abgelegt.
- **Punkt 4, Tests:** 40 von 40 grün, ohne Netz. Als Testdatei dient ein echter 5×5-km-Ausschnitt um Werdau aus dem DWD-Raster 2025-10, erzeugt mit `tools/dwd-ausschnitt.js`.
- **Probeaufruf Werdau** (`timeout 120 node tools/probe-wetter.js`): beim ersten Mal HTTP 200 nach 24,8 s mit 240 Downloads, beim zweiten Aufruf 0,38 s aus dem Zwischenspeicher.

| Monat | Ist kWh/m² | Mittel 2005–2023 | Faktor |
|---|---|---|---|
| 2025-11 | 33,75 | 30,04 | 1,123 |
| 2025-12 | 23,26 | 19,92 | 1,168 |
| 2026-01 | 30,95 | 24,46 | 1,265 |
| 2026-02 | 43,78 | 43,36 | 1,010 |
| 2026-03 | 103,07 | 83,80 | 1,230 |
| 2026-04 | 143,53 | 127,27 | 1,128 |
| 2026-05 | 186,15 | 159,56 | 1,167 |
| 2026-06 | 179,79 | 170,95 | 1,052 |
| 2026-07 | 180,87 | 169,52 | 1,067 |
| 2026-08 | 160,18 | 138,59 | 1,156 |
| 2026-09 | 112,45 | 98,99 | 1,136 |
| 2026-10 | 58,68 | 61,11 | 0,960 |

**zeitraumFaktor 1,114**

- **Zwischenspeicher:** 24 Dateien, 17,7 MB (12 Ist-Monate und 12 Mittel). Er liegt in `ppp-api/data/wetter/`, ist von git ausgeschlossen und schon vorbefüllt. Dauerhaft kommen etwa 0,7 MB je neuem Ist-Monat hinzu.
- **Dienst nicht gestartet:** kein PM2, kein Nginx. Bei den Probeaufrufen lief nur kurz ein lokaler Testserver, der danach wieder geschlossen wurde.

## Offen für Andre
- **PM2:** Es ist keine Änderung nötig. Der Dienst braucht Schreibrecht auf `ppp-api/data/wetter/` (bisher `data/referenz` und `data/umgebung`) und ausgehenden HTTPS-Zugang zu `opendata.dwd.de`.
- **Nginx:** Eine neue Location ist nicht nötig, `/api/leistungscheck/` deckt `/wetter` mit ab. Bitte `proxy_read_timeout` auf mindestens 60 s prüfen. Ein Wetter-Aufruf mit neuen Kalendermonaten dauert etwa 25 s, eine Umgebungsanfrage mit Overpass bis zu 50 s.
- **Vor dem Livegang** einmal `npm run probe:wetter` laufen lassen. Dann liegen alle 12 Mittel bereit, und erste Kunden warten nicht.

## Fragen an Claude Desktop
1. „Mittel über die verfügbaren Jahre, mindestens 2005–2023“: Ich habe genau 2005–2023 genommen, passend zu PVGIS-SARAH3. Fehlende Jahre werden ausgelassen und in `mittelJahre` angezeigt. Soll das Mittel stattdessen alle verfügbaren Jahre umfassen, also 1991 bis heute? Das wäre per Option `mittelJahre` umstellbar.
2. Das Rechteck aus `out tags bb` ist eine Untergrenze für den Abstand. Bei schräg verlaufenden Straßen oder Bahnlinien kann es 0 m oder zu nah ergeben. Ist das für die Verschmutzer-Wertung so gewollt, oder sollen `strasse` und `bahn` später mit `out geom` genau gerechnet werden?
3. Die DWD-Werte gelten für die horizontale Ebene, PVGIS rechnet mit geneigter Fläche. Reicht der Faktor auf Basis der horizontalen Ebene für `wetter.zeitraumFaktor`? Der Faktor wird ja nur als Verhältnis genutzt, der Fehler dürfte daher klein sein, im Winter aber etwas größer.
