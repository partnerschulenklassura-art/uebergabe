Alle drei Overpass-Änderungen aus dem Auftrag sind umgesetzt und committet, die Tests sind grün. Der PVGIS-Probeaufruf für Werdau hat geklappt. Overpass hat bei zwei Probeläufen von diesem Server aus nicht innerhalb der Zeit geantwortet. Den Auftrag melde ich deshalb als „teilweise“ (Begründung im Statusblock).

---
status: teilweise (Code und Tests fertig, aber die Werdau-Umgebung aus Overpass konnte nicht abgerufen werden)
vorschau_url:
commits: d1a5585 (neu); vorhanden waren schon 716b476, d2a300e
---
## Umgesetzt
- **Stand geprüft:** Der Dienst lag schon in `/var/www/eid/ppp-api/` und war in 716b476 und d2a300e committet; die 20 vorhandenen Tests waren grün. Nichts wurde doppelt gebaut, nur ergänzt.
- **Overpass robuster gemacht** (`src/overpass.js`, `src/app.js`):
  - Jeder Server hat jetzt sein eigenes Zeitlimit von 25 s. Versucht wird zuerst overpass-api.de, dann overpass.kumi.systems.
  - Zum zweiten Server geht es bei Überlast (429/5xx), Netzfehler oder Zeitüberschreitung. Bei einer echten Ablehnung bricht der Abruf sofort ab.
  - Die Abfrage ist ein einziger Union-Block mit `[out:json][timeout:25]` und `out center tags;`. Die bisherige volle Geometrie (`out tags geom qt`) ist entfernt.
  - Für die Anfrage ans Frontend heißt das: Sie kann im schlechtesten Fall bis zu 50 s dauern.
  - Folge von `out center`: Bei Flächen und Linien wird der Abstand zum Mittelpunkt gerechnet, nicht zum Rand. Steht eine Anlage am Rand eines großen Waldes, erscheint der Wald also „weiter weg“, als er ist. Das steht so im README.
- **Tests:** `npm test` ist grün mit 22 von 22, ohne Netz. Neu getestet werden: beide Server hängen (504, beide nacheinander versucht), der erste hängt und der zweite liefert, und eine Antwort im Format `out center tags` wird richtig ausgewertet.
- **Probeaufrufe Werdau** (50.73, 12.38), hart begrenzt mit `timeout 65`, nichts läuft im Hintergrund weiter:
  - **PVGIS (Süd, 30°, Dachmontage, 1 kWp, 0 % Verluste):** **1189,11 kWh/kWp im Jahr**, Datenbank PVGIS-SARAH3, Jahre 2005–2023. Monatswerte von Januar bis Dezember: 38,7 · 61,8 · 98,9 · 131,8 · 146,1 · 145,5 · 146,8 · 133,7 · 111,3 · 83,8 · 51,1 · 39,6 kWh/kWp. Antwortzeit 364 ms.
  - Der allererste PVGIS-Versuch scheiterte nach 110 ms mit „fetch failed“. Der gleiche Abruf per curl ging direkt danach, der zweite Lauf auch. Das war also ein vorübergehender Netzfehler.
  - **Overpass:** Fehler 504, „hat nicht innerhalb von 25 Sekunden geantwortet“.
    - Lauf 1: beide Server haben das Zeitlimit überschritten, gesamt 50 s.
    - Lauf 2: gesamt 25 s. Ein Server antwortete nach meiner Deutung schnell mit einem Fehler, der andere lief ins Zeitlimit. Welcher welcher war, habe ich nicht protokolliert.
    - Damit bleibt `overpass-werdau-synthetisch.json` eine von Hand nachgebaute Testdatei, keine echte Antwort.
- **Wetterdaten der letzten 12 Monate, Empfehlung** (aus meinem Wissensstand, in dieser Sitzung nicht online nachgeprüft):
  - Zum Hintergrund: PVGIS-SARAH3 reicht nur bis 2023 und deckt die letzten 12 Monate also nicht ab.
  - **DWD Open Data, Climate Data Center (empfohlen für Deutschland):** Es gibt monatliche Raster der Globalstrahlung für Deutschland (`grids_germany/monthly/radiation_global`, etwa 1 km Auflösung). Die Nutzung ist kostenlos und auch kommerziell erlaubt, es genügt der Hinweis „Quelle: Deutscher Wetterdienst“ (GeoNutzV). Der Dienst würde die Rasterzelle des Standorts lesen und den Monatswert ins Verhältnis zum PVGIS-Mittel des Monats setzen. Damit ließe sich der Soll-Ertrag wetterbereinigt rechnen. Die Monatsdateien erscheinen nach meinem Wissen erst einige Tage nach Monatsende.
  - **Copernicus CAMS Radiation Service (Ersatz und für Standorte außerhalb Deutschlands):** satellitengestützte Zeitreihen je Punkt, nur wenige Tage alt. Kostenlos nach Registrierung, kommerzielle Nutzung nach Copernicus-Lizenz erlaubt. Braucht allerdings ein Konto mit API-Schlüssel.
  - **Open-Meteo:** Die kostenlose API ist nur für nicht-kommerzielle Nutzung freigegeben. Für photovoltaikperformancepro.com bräuchte es ein bezahltes Abo oder einen eigenen Open-Meteo-Server. Für den Anfang nicht empfohlen.
- Der Dienst ist nicht gestartet, PM2 und Nginx habe ich nicht angefasst.

## Offen für Andre
- **Overpass von Hand nachprüfen** (in Ruhe, dauert bis zu 50 s):
  `cd /var/www/eid/ppp-api && timeout 65 node tools/probe.js 50.73 12.38 0 30`
  Wenn Overpass antwortet, kann man mit `--aufzeichnen` eine echte Testdatei ablegen. Vorsicht: Das überschreibt auch `test/fixtures/pvgis-werdau.json`.
- **PM2-Start:**
  ```
  cd /var/www/eid/ppp-api
  npm install --omit=dev
  mkdir -p data
  pm2 start ecosystem.config.cjs
  pm2 save
  curl -s http://127.0.0.1:3140/api/leistungscheck/gesund
  ```
- **Nginx-Eintrag** im `server`-Block für photovoltaikperformancepro.com (HTTPS):
  ```nginx
  location /api/leistungscheck/ {
      proxy_pass http://127.0.0.1:3140;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_read_timeout 60s;   # Overpass: bis 2 × 25 s
      proxy_send_timeout 60s;
  }
  ```
  Danach: `nginx -t && systemctl reload nginx`
  - `proxy_pass` bitte ohne abschließenden `/`, damit der Pfad `/api/leistungscheck/...` erhalten bleibt.
  - Die App vertraut genau einem Proxy (`trust proxy 1`), damit die Begrenzung auf 30 Aufrufe je IP und Minute die echte Besucher-IP sieht.
- **Wetterdaten:** Wenn CAMS genutzt werden soll, muss jemand ein Copernicus-Konto anlegen und den API-Schlüssel hinterlegen. Das ist ein Secret, daher nicht von mir.

## Fragen an Claude Desktop
1. **Radius:** Gefordert waren 2 km. Abgefragt wird bewusst mit 2 750 m um den Mittelpunkt der 0,01°-Rasterzelle, ausgewertet wird aber mit 2 km um den genauen Standort. Grund ist der Datenschutz: Der genaue Standort geht nicht an Overpass. Bleibt das so?
2. **`out center` statt Geometrie:** Ist der gröbere Abstand zum Mittelpunkt in Ordnung? Die Alternative `out tags bb;` ist ähnlich schlank und rechnet zum Begrenzungsrechteck. Dabei würde eine Anlage im Wald korrekt mit 0 m erkannt.
3. **Wetterdaten:** Soll ich als Nächstes einen Endpunkt `/api/leistungscheck/wetter` mit den DWD-Monatsrastern bauen (Verhältnis der letzten 12 Monate zum PVGIS-Mittel)?
