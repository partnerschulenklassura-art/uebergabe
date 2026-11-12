---
status: teilweise
vorschau_url:
commits: b44f2db, f4fad72
---
## Umgesetzt
Ich laufe auf Opus 5.5. Die Website ist gebaut und committet, aber die Syntaxprüfung des Nginx-Vorschlags mit `nginx -t` konnte ich nicht ausführen. Deshalb steht der Status auf „teilweise“.

- **Quellen übernommen:** `web/` und `leads/` sind per rsync aus `~/uebergabe/projekte/eid/` kopiert. In `/var/www/eid` ist ein Git-Repo auf Branch `main` angelegt. Die `.gitignore` enthält node_modules, dist, dist-rechner, .env und logs.
- **Tests:** `npm ci` lief ohne Fehler und ohne gemeldete Sicherheitslücken. `npm test` lief mit allen 4 Testdateien durch („alle Tests bestanden“).
- **Build:** `npm run build` lief ohne Fehler. Vite warnt nur, dass zwei Dateien über 500 kB liegen: `energyScene` mit 574 kB (die 3D-Szene, lädt erst bei Interaktion) und `main` mit 459 kB.
- **Build-Größe:** `public/` ist 1,9 MB groß.
- **Rechner:** `npm run build:rechner` lief ohne Fehler und erzeugt eine einzelne Datei `web/dist-rechner/rechner.html` mit 977 KB. Sie liegt **nicht** in `public/`, weil der Auftrag nur `dist/` dorthin kopieren lässt.
- **Seitenliste in `public/`:** alle Pflichtseiten sind da.
  - `index.html`
  - `strom/`, `speicher/`, `komponenten/`, `planen/`, `pruefen/`, `schutz/`, `bewerten/`, `ueberwachen/` und `anlagenwert/`, jeweils mit `index.html`
  - `impressum.html` und `datenschutz.html`
  - zusätzlich `bestaetigt.html`, `link-ungueltig.html` und `abgemeldet.html`
- **Domain-Prüfung:** `photovoltaikperformancepro.io` kommt nirgends vor (alles außer node_modules durchsucht). In `.env.example` steht korrekt `.com`.
- **Lead-API:** `leads/` ist mit `npm ci --omit=dev` installiert, ohne gemeldete Sicherheitslücken. Nicht gestartet, keine .env angelegt.
- **Nginx-Vorschlag:** `NGINX-VORSCHLAG.conf` liegt in `/var/www/eid`. Er enthält:
  - root `/var/www/eid/public` und `/api/` → 127.0.0.1:3120
  - die Header aus DEPLOY.md, Basic-Auth „EID Vorschau“ und `X-Robots-Tag noindex, nofollow`
  - eine Weiterleitung von Port 80 auf https
  - Abweichung von DEPLOY.md: Im Block `/assets/` stehen die Sicherheits-Header noch einmal. Sonst würde das dortige `add_header Cache-Control` sie für alle Asset-Dateien abschalten.

## Offen für Andre
**Nginx – die Angabe im Auftrag stimmt nicht:**
- In `/etc/nginx/sites-enabled/unternehmensdigitalisierung.conf` steht **nicht** `eid.unternehmensdigitalisierung.io`, sondern `eid.photovoltaikperformancepro.com` (Zeilen 2, 75–77 und 95). Für die neue Subdomain muss dort **keine** Zeile entfernt werden.
- Die Datei `/etc/nginx/sites-available/eid.unternehmensdigitalisierung.io.conf` gibt es schon. Sie zeigt auf :8082 und ist **nicht** in sites-enabled verlinkt.
- Ein Aufruf von https://eid.unternehmensdigitalisierung.io liefert heute 200, aber mit einem Zertifikat, das nicht geprüft werden kann (vermutlich die Standard-Seite des Servers).

**Nginx – Schritte:**
1. Mit `certbot certificates` prüfen, ob es das Zertifikat `eid.unternehmensdigitalisierung.io` gibt. Falls nicht: `certbot certonly --nginx -d eid.unternehmensdigitalisierung.io`.
2. `htpasswd -c /etc/nginx/.htpasswd-eid <benutzer>`
3. Den Inhalt von `NGINX-VORSCHLAG.conf` nach `sites-available/eid.unternehmensdigitalisierung.io.conf` übernehmen und in sites-enabled verlinken.
4. `nginx -t && systemctl reload nginx` – damit ist auch die Syntaxprüfung erledigt, die ich nicht ausführen konnte.
5. Nur falls `eid.photovoltaikperformancepro.com` später auch auf die neue Seite soll: Den Namen in `unternehmensdigitalisierung.conf` aus Zeile 2 und Zeile 95 entfernen, ebenso den `if`-Block in Zeilen 75–77. In Zeile 29 bleibt der Ausdruck `(warteschlange|eid)` dann ohne Wirkung für eid.

**Nginx – bestehendes Problem:** In `sites-enabled/` liegen zwei Sicherungsdateien: `unternehmensdigitalisierung.conf.stand-vor-schliessung-20260910` und `uebermorgen.conf.stand-vor-api-riegel-20260910`. Nginx lädt sie mit, dadurch sind dieselben Hostnamen doppelt eingetragen. Ich empfehle, sie nach `sites-available/` oder in ein Archiv zu verschieben.

**Lead-API:**
1. `sudo -u postgres psql -c "CREATE USER eid WITH PASSWORD '…';"` und `… -c "CREATE DATABASE eid OWNER eid;"`
2. Das Schema einspielen: `psql -U eid -h 127.0.0.1 eid -f /var/www/eid/leads/db/schema.sql`. Bitte vorher nachsehen, ob `server.js` das beim Start schon selbst erledigt.
3. `cp leads/.env.example leads/.env` und ausfüllen:
   - `DATABASE_URL` mit dem Passwort
   - `ADMIN_TOKEN`, `IP_HASH_SALT` und `UNSUBSCRIBE_SECRET`, jeweils mit `openssl rand -hex 32`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` und `SMTP_FROM`. Absender laut Entscheidung: `info@photovoltaikperformancepro.com`.
   - `PUBLIC_URL`, `SITE_URL` und `CONTACT_EMAIL` sind schon richtig vorbelegt.
4. `mkdir -p leads/logs && cd leads && pm2 start ecosystem.config.cjs && pm2 save`
5. `curl -s 127.0.0.1:3120/api/health` sollte `{"ok":true}` liefern.
6. Optional: den n8n-Workflow `leads/n8n/eid-folgeangebote.json` importieren und die Zugänge „EID Admin“ und „EID SMTP“ anlegen.

## Fragen an Claude Desktop
1. Laut Auftrag liegt die Subdomain in `unternehmensdigitalisierung.conf`, dort steht aber `eid.photovoltaikperformancepro.com`. Ist die Vorschau wirklich unter `eid.unternehmensdigitalisierung.io` gewollt, und soll `eid.photovoltaikperformancepro.com` später auch auf die neue Seite?
2. Der Rechner (`rechner.html`, 977 KB) landet nicht in `public/`. Soll er als `/rechner.html` mit ausgeliefert werden oder ist er nur zum Einbetten anderswo gedacht?
3. Hinter Basic-Auth fragen auch die Bestätigungslinks der Double-Opt-in-Mails unter `/api/…` nach dem Passwort. Für die Vorschau ist das wohl in Ordnung. Soll `/api/` trotzdem ohne Passwort bleiben?
