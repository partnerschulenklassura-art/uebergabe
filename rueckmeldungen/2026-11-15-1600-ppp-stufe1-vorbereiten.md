---
status: erledigt
vorschau_url:
commits: daff3f5, 9229dd6
---
## Umgesetzt
- **Schritt 1:** `stufe1/website/` liegt per `rsync -a --delete` in `/var/www/eid/ppp-public/`. Dazu gehören `index.html`, `speicher/index.html`, Impressum, Datenschutz, AGB, Software- und Partnerbedingungen, `sitemap.xml` und `llms.txt`. Commit `daff3f5`.
- **Schritt 2:** `projekte/ppp/web/` liegt ohne `node_modules` in `/var/www/eid/ppp-web/`. `npm ci && npm run build` läuft durch. Ausgabe des Builds: „freigeschaltet: start, speicher | ausgeblendet: strom, komponenten, planen, pruefen, schutz“.
  - `diff -rq dist ppp-public`: Es sind dieselben Seiten. Weder `strom/` noch `komponenten/`, `planen/`, `pruefen/` oder `schutz/` sind dabei.
  - Die beiden HTML-Seiten unterscheiden sich nur in den Dateinamen-Hashes von `main-*.js` und `main-*.css`, der Rest ist gleich. Der Hash ändert sich bei jedem Build, das ist harmlos.
  - Quellstand committet in `9229dd6`. `dist/` und `node_modules` sind per `.gitignore` ausgeschlossen.
- **Schritt 3: Was heute auf der Domain läuft:**
  - `nginx -T` und `dig` brauchten hier eine Freigabe, die ich nicht hatte. Stattdessen habe ich die Dateien unter `/etc/nginx` direkt gelesen und die Ziel-IP über `curl` ermittelt.
  - **photovoltaikperformancepro.com:** wird über `/etc/nginx/sites-enabled/apex.pvpp.conf` bedient, einen Symlink auf `sites-available/apex.pvpp.conf`. Root ist `/var/www/pvpp/apex`, Zertifikat `live/photovoltaikperformancepro.com` (nur für die Hauptdomain).
    - Die Datei bedient nur diese eine Domain (Zeilen 2 und 38).
    - Ausgeliefert wird die Seite **„PV-Turnaround-Analyse | Von Insolvenz auf 10 Mio €“**, zuletzt geändert am 11.05.2026. `curl -sI` liefert über HTTPS 200, über HTTP 301.
  - **www.photovoltaikperformancepro.com:** steht in keiner Nginx-Datei und landet beim Standard-Server.
    - HTTP liefert 404.
    - HTTPS scheitert mit falschem Zertifikat (`CN=amity.unternehmensdigitalisierung.io`).
  - **DNS:** Beide Namen zeigen auf 72.62.53.87, also auf diesen Server. Für `certbot` passt das.
  - `unternehmensdigitalisierung.conf` enthält nur `eid.`, `warteschlange.` und `turnaround.`, nicht die Hauptdomain. Diese Datei und `kritis.pvpp.conf` habe ich nicht angefasst, dort muss auch nichts entfernt werden.
- **Schritt 4: `online.sh`:** `bash -n` ist ohne Fehler. `rsync` und `certbot` sind vorhanden (`/usr/bin`), die Pfade stimmen. Nicht ausgeführt.
  - Die Inhaltsrichtlinie (CSP) im Skript verträgt sich mit den Seiten: keine Inline-Skripte außer `ld+json`, keine externen Quellen.

## Offen für Andre
**`online.sh` kann nicht ohne Änderung laufen.**

1. **Die Konfliktprüfung übersieht `apex.pvpp.conf`.** Das Skript sucht mit `grep -rl`, und `grep -r` folgt Symlinks beim Durchsuchen von Ordnern nicht (GNU grep 3.11). Die Datei in `sites-enabled` ist aber ein Symlink. Ohne Änderung passiert Folgendes:
   - Es wird nichts gesichert.
   - Das Skript stoppt nicht, sondern legt `ppp` mit demselben `server_name` an. `nginx -t` warnt dann nur („conflicting server name … ignored“).
   - Die Hauptdomain liefert weiter die Turnaround-Seite aus. Nur `www` bekäme die neue Seite.

   Vorher eines davon tun:
   - **Entweder** `apex.pvpp.conf` sichern und den Symlink `/etc/nginx/sites-enabled/apex.pvpp.conf` löschen. Es geht um die ganze Datei, nicht einzelne Zeilen, weil sie nur die Hauptdomain bedient. Die Datei in `sites-available` bleibt als Kopie liegen.
   - **oder** im Skript `grep -rl`/`grep -rh` an allen drei Stellen durch `grep -Rl`/`grep -Rh` ersetzen. Dann sichert es die Datei und stoppt korrekt mit Hinweis.
2. **Das Zertifikat wird wahrscheinlich nicht erweitert.** Es gibt schon ein Zertifikat nur für die Hauptdomain. Mit `--non-interactive` erweitert `certbot` es nach meiner Kenntnis ohne `--expand` nicht um `www`. Das habe ich nicht ausprobiert. Das Skript bricht dann nicht ab, sondern meldet nur „Zertifikat fehlgeschlagen“, und `www` bliebe ohne HTTPS. Vorschlag: `--expand` in die `certbot`-Zeile aufnehmen.
3. **Die Turnaround-Seite verschwindet von der Hauptdomain.** Sie liegt in `/var/www/pvpp/apex`. Bitte bestätigen, dass sie dort nicht mehr gebraucht wird; unter `turnaround.photovoltaikperformancepro.com` läuft sie separat über den Container.
4. **Kleinigkeit:** Im Skript setzt `location /assets/` eigene `add_header`. Damit gelten für Dateien unter `/assets/` die CSP- und nosniff-Header des Servers nicht. Das ist unkritisch, kann aber beim Umstellen mit korrigiert werden.
5. **Keine Vorschau-URL:** Für `ppp-public` gibt es keinen Vorschau-Eintrag in Nginx. Das wäre ein Nginx-Eingriff, deshalb habe ich ihn nicht angelegt.

## Fragen an Claude Desktop
- Soll `online.sh` in der Übergabe auf `grep -R` und `certbot --expand` korrigiert werden? Ich durfte dort nichts ändern.
- Soll die Turnaround-Analyse nach der Umstellung irgendwo anders erreichbar bleiben, zum Beispiel unter `/turnaround/` oder nur über die Subdomain?
- Die Arbeitsanweisung, die der Prime-Skill lädt (`/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`), existiert nicht. Ich habe nur mit `ENTSCHEIDUNGEN.md` gearbeitet. Bitte den Pfad im Skill prüfen.
