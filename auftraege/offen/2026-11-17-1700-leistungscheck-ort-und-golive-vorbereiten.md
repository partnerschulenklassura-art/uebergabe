---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Die Seite „Leistungscheck“ ist gebaut (`projekte/ppp/web/src/pages/Leistungscheck.jsx`, Abruf in `src/lib/leistungscheck-dienst.js`). Sie ruft vier Endpunkte unter `/api/leistungscheck/` auf. `referenz`, `wetter` und `umgebung` gibt es schon in `/var/www/eid/ppp-api`. Es fehlt **`ort`**. Weiterhin NICHT starten, kein PM2, kein Nginx.

1. `GET /api/leistungscheck/ort?q=<Freitext>` in `ppp-api` bauen:
   - Aus dem Freitext NUR Postleitzahl und Ort an Nominatim schicken (Regex auf fünfstellige PLZ plus folgendes Wort/Wörter bis Komma oder Ende). Ohne PLZ: den Text ohne Hausnummer und ohne Straßenteil vor dem ersten Komma. Straße nie weitergeben (so steht es in der Datenschutzerklärung).
   - Nominatim `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=de&limit=1&q=…`, User-Agent `PVPerformancePro-Leistungscheck/1.0 (info@photovoltaikperformancepro.com)`, höchstens 1 Anfrage pro Sekunde (Warteschlange), Zeitlimit 10 s.
   - Antwort `{ lat, lon, name }` (lat/lon auf 0,01° gerundet, name = Ort, Landkreis). Zwischenspeicher 365 Tage je normalisierter Anfrage. Nicht gefunden: 404 mit `{ fehler: "Ort nicht gefunden" }`.
   - Antwortformat der anderen Endpunkte prüfen gegen `leistungscheck-dienst.js`: `referenz` → `{ referenzKwhKwp, monate[12] }`, `wetter` → `{ monate:[{monat,faktor}], zeitraumFaktor }`, `umgebung` → Array `[{art, abstand}]` (oder `{quellen:[…]}`), Fehler → JSON mit `fehler`. Passt etwas nicht, im Dienst angleichen, nicht in der Seite.
2. Tests ohne Netz; ein echter Probeaufruf „Hauptstraße 1, 08412 Werdau“ (hart begrenzt, `timeout 30`).
3. `projekte/ppp/web/` nach `/var/www/eid/ppp-web/` aktualisieren, `npm ci && npm test && npm run build`, prüfen, dass `dist/leistungscheck/index.html` entsteht und `dist/` zu `projekte/ppp/stufe3/website/` passt (gleiche Seitenliste).
4. `projekte/ppp/stufe3/leistungscheck-online.sh` lesen und prüfen, ob es zum Server passt (PM2-Name `ppp-api` im ecosystem, Port 3140, `/api/leistungscheck/gesund`, `npm run probe:wetter`, Aufbau von `/etc/nginx/sites-available/ppp` mit genau einem `  location / {`). Abweichungen im Skript korrigieren und committen. NICHT ausführen.

# Abnahmekriterien
- `ort` gebaut, `npm test` grün in ppp-api, Commit vorhanden, Dienst nicht gestartet.
- Build in ppp-web erfolgreich mit Seite `leistungscheck`.
- Rückmeldung: Probeaufruf `ort`, ob `leistungscheck-online.sh` ohne weitere Änderung laufen kann.
