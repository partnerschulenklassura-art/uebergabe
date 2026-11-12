---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Die neue EID-Website (Energie-Institut Deutschland) liegt fertig in `~/uebergabe/projekte/eid/`:
- `web/`  – React 19 + Vite Multi-Page-Site (Start, Strom, Speicher, Komponenten, Planen, Prüfen, Schutz, Bewerten, Überwachen, Anlagenwert, Rechner). Details: `web/DEPLOY.md`.
- `leads/` – Lead-API (Express 5 + PostgreSQL, Port 127.0.0.1:3120). Details: `leads/README.md`.

Bitte in `/var/www/eid` einrichten und bauen – **ohne Nginx, Datenbank oder neue PM2-Prozesse anzufassen**:

1. `/var/www/eid/web` und `/var/www/eid/leads` aus `~/uebergabe/projekte/eid/` per `rsync -a --delete --exclude node_modules` befüllen.
2. In `/var/www/eid` ein Git-Repo anlegen (`git init`, `.gitignore` mit node_modules, dist, dist-rechner, .env, logs) und den Stand committen.
3. `web/`: `npm ci`, vorhandene Tests (`npm test`, falls definiert) und `npm run build` sowie `npm run build:rechner`. Build-Ergebnis nach `/var/www/eid/public` kopieren (`rsync -a --delete web/dist/ public/`).
4. `leads/`: `npm ci --omit=dev`. Nicht starten, keine .env anlegen.
5. Prüfen: Enthält `public/` alle Seiten (index.html plus je Unterordner eine index.html, impressum.html, datenschutz.html)? Gibt es irgendwo noch `photovoltaikperformancepro.io` (muss .com sein)?
6. Den fertigen Nginx-Server-Block für `eid.unternehmensdigitalisierung.io` als Vorschlag in `/var/www/eid/NGINX-VORSCHLAG.conf` schreiben: root `/var/www/eid/public`, `/api/` → 127.0.0.1:3120, Header wie in `web/DEPLOY.md`, zusätzlich **Basic-Auth** (`auth_basic "EID Vorschau"; auth_basic_user_file /etc/nginx/.htpasswd-eid;`) und `add_header X-Robots-Tag "noindex, nofollow" always;`. Beachte: Diese Subdomain steht heute in `/etc/nginx/sites-enabled/unternehmensdigitalisierung.conf` (Container :8082, 503-Sperre) – nenne genau, welche Zeile dort für den Umzug entfernt werden muss. Nur lesen, nichts ändern.
7. Ebenso die nötigen Schritte für die Lead-API (DB anlegen, .env-Felder, pm2 start) als Liste für Andre.

# Abnahmekriterien
- `/var/www/eid/public/index.html` existiert, Build fehlerfrei, Commit vorhanden.
- `NGINX-VORSCHLAG.conf` vorhanden und mit `nginx -t`-tauglicher Syntax (nicht einbinden!).
- Rückmeldung nennt Build-Größe, Seitenliste, Commit-Hash und die Schritte für Andre.
