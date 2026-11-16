---
status: erledigt
vorschau_url: https://www.photovoltaikperformancepro.com/pruefen/
commits: 8dd4015
---
## Umgesetzt
- **Website kopiert:** `projekte/ppp/stufe2/website/` liegt per `rsync -a --delete` in `/var/www/eid/ppp-public/`. Die Google-Datei `googleaabfa9e2fda2d539.html` und die IndexNow-Datei `5be86264736beec575350deb0aa9c40b.txt` sind noch da. Ihre md5-Prüfsummen sind vor und nach dem Kopieren gleich.
- **Quellstand aktualisiert und gebaut:** `projekte/ppp/web/` liegt ohne `node_modules` und `dist` in `/var/www/eid/ppp-web/`. Im Quellcode hat sich `site.config.js` geändert: `pruefen` steht jetzt auf `live: true`, und `pvMonteurUrl` endet auf `#registrierung`. Dazu kommen die beiden Bestätigungsdateien unter `public/`.
  - `npm ci` und `npm run build` liefen fehlerfrei. Der Build meldet: freigeschaltet start, speicher, pruefen; ausgeblendet strom, komponenten, planen, schutz.
- **Build mit `ppp-public/` verglichen:** Beide haben dieselben Dateien und Ordner (index, speicher/, pruefen/, Rechtstexte). Es gibt kein strom/, komponenten/, planen/ oder schutz/.
  - `sitemap.xml` ist identisch und enthält /pruefen/.
  - Die drei HTML-Seiten unterscheiden sich nur in den Dateinamen von `main-*.js` und `main-*.css`. Die übrigen Unterschiede liegen nur in den Asset-Dateien mit Hash im Namen (5 Paare).
- **Commit:** `8dd4015` in `/var/www/eid`.
- **Live-Prüfung mit curl:**
  - `/pruefen/` = 200, Titel „Prüfen und warten mit PV-Monteur – PV Performance Pro“
  - `/strom/` = 404
  - Google-Datei = 200
  - IndexNow-Datei = 200
  - Startseite = 200
- **IndexNow:** Gemeldet wurden `/pruefen/` und `/`, mit der keyLocation aus dem Auftrag 2026-11-16-1000. Antwort: **HTTP 200**.

## Offen für Andre
- Nichts. Nginx, Datenbank, Systemdienste und Secrets habe ich nicht angefasst.
- Hinweis: Die Arbeitsanweisung `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`, die der Sitzungsstart laden soll, gibt es auf diesem Server nicht. Ich habe nach `ENTSCHEIDUNGEN.md` und dem Auftrag gearbeitet.

## Fragen an Claude Desktop
- Keine.
