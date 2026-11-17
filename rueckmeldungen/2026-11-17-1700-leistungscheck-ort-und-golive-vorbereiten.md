---
status: erledigt
vorschau_url:
commits: 410677d, 6858579, 467f7f9
---
## Umgesetzt
- **`GET /api/leistungscheck/ort?q=…`** ist gebaut (`ppp-api/src/nominatim.js`, Route in `src/app.js`).
  - **Was an Nominatim geht:** nur PLZ und Ort. Mit fünfstelliger PLZ werden PLZ und die folgenden Wörter bis Komma oder Ende geschickt. Steht danach noch ein Straßenname, wird er abgeschnitten („08412 Werdau Hauptstraße 1“ → „08412 Werdau“). Ohne PLZ fallen der Teil vor dem ersten Komma, Hausnummern und Straßennamen weg, erkannt an Endungen wie -straße oder -weg. Endungen wie -berg und -hof zählen bewusst nicht als Straße, sonst würden „Heidelberg“ oder „Hof“ verloren gehen.
  - **Nominatim-Regeln:** User-Agent wie vorgegeben, Zeitlimit 10 s, Warteschlange mit höchstens 1 Anfrage pro Sekunde.
  - **Antwort:** `{ lat, lon, name }`, lat/lon auf 0,01° gerundet, name = Ort, Landkreis. Dazu kommen die Felder `quelle` und `zwischengespeichert`.
  - **Zwischenspeicher:** 365 Tage je normalisierter Anfrage. Der Schlüssel ist ein Hash von PLZ + Ort, im Speicher steht keine Straße.
  - **Fehler:** Nicht gefunden → 404 `{ fehler: "Ort nicht gefunden" }`, wird nicht gespeichert. Leere Eingabe oder nur eine Straße → 400. Nominatim überlastet → 503, keine Antwort → 504.
- **Antwortformate gegen `leistungscheck-dienst.js` geprüft:**
  - `referenz` und `wetter` passen. Bei `wetter` hat `monat` die Form „JJJJ-MM“, wie `wetterFaktor()` es liest. Fehler kommen überall als JSON mit `fehler`.
  - **Abweichung bei `umgebung`:** Der Dienst lieferte die Liste nur als `treffer`. Die Seite liest aber `quellen` und hätte deshalb immer eine leere Liste bekommen. Ich habe es im Dienst angeglichen: `quellen` ist jetzt dieselbe Liste `[{art, abstand, …}]`, `treffer` bleibt zusätzlich erhalten.
- **Tests:** `npm test` in ppp-api ist grün, 70/70, ohne Netz. Neu ist `test/ort.test.js`. Er prüft die Extraktion, dass keine Straße in der URL oder im Speicher landet, User-Agent, 404, 400, 503, 504, den Zwischenspeicher, den 1-s-Abstand und das Format von `umgebung`.
- **Echter Probeaufruf** mit `timeout 30 node tools/probe-ort.js "Hauptstraße 1, 08412 Werdau"`:
  An Nominatim ging `08412 Werdau`. Antwort nach 318 ms: `HTTP 200 {"lat":50.73,"lon":12.35,"name":"Werdau, Zwickau",…}`.
  Dafür gibt es jetzt `npm run probe:ort`.
- **ppp-web:** aus `projekte/ppp/web/` aktualisiert, ohne Löschen, weil die Übergabe-Fassung lokal nichts entfernt. `npm ci`, `npm test` und `npm run build` liefen erfolgreich. `dist/leistungscheck/index.html` ist entstanden. `dist/` hat dieselbe Seiten- und Asset-Liste wie `stufe3/website/`, alle HTML-Dateien sind bis auf die Asset-Hashes gleich.
- **`leistungscheck-online.sh`** ist gegen den Server geprüft:
  - Passend: PM2-Name `ppp-api`, Port 3140 (frei, `ppp-api` läuft noch nicht in PM2), `/api/leistungscheck/gesund`, `npm run probe:wetter`.
  - Die Nginx-Datei `sites-available/ppp` enthält genau ein `  location / {` (Zeile 9) und liefert aus `/var/www/eid/ppp-public` aus. Davor sitzt kein Proxy, `trust proxy 1` passt also. Den Einschub habe ich im Speicher nachgestellt, er landet richtig zwischen `/assets/` und `/`.
  - Die korrigierte Fassung liegt in `/var/www/eid/ppp-stufe3/leistungscheck-online.sh`, weil ich im Übergabe-Repo nichts ändern darf. Die Korrekturen:
    - Vor `rsync --delete` wird geprüft, dass die Website-Quelle die nötigen Dateien enthält. Ein leerer Pfad hätte sonst die Seite gelöscht.
    - Die Gesundheitsprüfung versucht es bis zu 10 Mal und meldet einen Fehler klar. Vorher brach das Skript wegen `set -e` stumm ab.
    - Schlägt `nginx -t` fehl, wird die Sicherung zurückgespielt und das Skript bricht ab. Vorher wäre eine kaputte Nginx-Datei liegen geblieben.
    - Das Skript verlangt genau ein `  location / {`.
    - Der Commit in ppp-public erfasst nur ppp-public.
    - `/usr/sbin` steht im PATH, und es kommt eine Probe für `umgebung` dazu.
  - **Nicht ausgeführt.** Auch `bash -n` wurde nicht freigegeben, die Syntax des Skripts ist also ungeprüft.
- Dienst nicht gestartet, kein PM2, keine Änderung an Nginx.

## Offen für Andre
- **Kann das Skript ohne weitere Änderung laufen?** Die korrigierte Fassung ja: `bash /var/www/eid/ppp-stufe3/leistungscheck-online.sh` als root. Sie startet PM2 `ppp-api`, ändert `/etc/nginx/sites-available/ppp` mit Sicherung unter `/root/` und lädt Nginx neu. Das ist ein Eingriff an Nginx und Systemdiensten, nur nach deiner Freigabe. Die Vorlage im Übergabe-Repo läuft auf diesem Server im Normalfall auch durch, nur ohne die Schutzschritte oben.
- Ich empfehle, die Vorlage im Übergabe-Repo durch die korrigierte Fassung zu ersetzen (Claude Desktop).
- Die Datenschutzerklärung aus der Übergabe muss mit ausgeliefert werden. Das passiert in Schritt 3 des Skripts, `ppp-public/datenschutz.html` ist bisher noch alt.

## Fragen an Claude Desktop
1. **Ohne PLZ mit Komma fällt nach Vorgabe der Teil vor dem ersten Komma weg.** Aus „Werdau, Sachsen“ wird so „Sachsen“, und der Mittelpunkt von Sachsen wird als Standort genommen. Ich habe das so gelassen, weil der Datenschutz Vorrang hat. Soll die Seite stattdessen eine PLZ verlangen, oder soll der Teil vor dem Komma bleiben, wenn er weder Ziffer noch Straßenendung enthält?
2. **Für den Namen „Ort, Landkreis“ habe ich `addressdetails=1` an die Nominatim-URL angehängt.** Ohne diesen Parameter liefert Nominatim keinen Landkreis. Nominatim schreibt den Kreis als „Zwickau“, nicht „Landkreis Zwickau“. Passt das so?
3. **Die Warteschlange gilt je Prozess.** Mit einer PM2-Instanz ist das richtig. Läuft der Dienst später mit mehreren Instanzen, braucht die Grenze von 1 Anfrage pro Sekunde eine gemeinsame Sperre.
