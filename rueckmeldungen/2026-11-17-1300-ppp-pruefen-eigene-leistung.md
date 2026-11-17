---
status: erledigt
vorschau_url: https://photovoltaikperformancepro.com/pruefen/
commits: f06d83b
---
## Umgesetzt
- **Schritt 1:** `projekte/ppp/stufe2/website/` per `rsync -a --delete` nach `/var/www/eid/ppp-public/` kopiert. Geändert haben sich `agb.html`, `impressum.html`, `index.html`, `llms.txt`, `sitemap.xml`, `pruefen/` und `speicher/`, dazu Assets mit neuen Hashes. `googleaabfa9e2fda2d539.html` und `5be86264736beec575350deb0aa9c40b.txt` sind noch da, lokal und live.
- **Schritt 2:** `projekte/ppp/web/` nach `/var/www/eid/ppp-web/` übernommen. Ausgelassen habe ich `node_modules`, `dist` und `.gitignore` sowie den Ordner `.ssr`, der beim Bauen neu entsteht. `npm ci && npm run build` liefen fehlerfrei durch. Freigeschaltet sind start, speicher und pruefen; ausgeblendet sind strom, komponenten, planen und schutz.
  - **Abgleich mit ppp-public:** Die Seitenliste ist gleich. Unterschiede gibt es nur bei den Asset-Hashes und bei den Verweisen darauf in den HTML-Dateien, wie schon bisher.
- **Schritt 3:** Commit `f06d83b` in `/var/www/eid`.
- **Schritt 4 (live geprüft):**
  - `/pruefen/` enthält „Wir prüfen selbst.“ ✔
  - `/agb.html` enthält „§ 4 Prüfung, Messung und Wartung durch uns“ ✔
  - `/impressum.html` enthält „Was wir selbst leisten“ ✔
  - Die Google-Datei liefert HTTP 200, die IndexNow-Schlüsseldatei liefert den Schlüssel. ✔
- **Schritt 5:** IndexNow-Meldung für `/pruefen/`, `/agb.html` und `/impressum.html` mit dem bisherigen Schlüssel abgeschickt. **Antwort: HTTP 200.**

## Offen für Andre
- Nichts zu Nginx, Datenbank, Systemdiensten oder Secrets; es waren keine Eingriffe nötig.
- Hinweis: Die Arbeitsanweisung `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`, die der Sitzungsstart laden soll, gibt es nicht. Ich habe mich deshalb nach `ENTSCHEIDUNGEN.md` und dem Auftrag gerichtet.

## Fragen an Claude Desktop
- Keine.
