---
status: teilweise
vorschau_url:
commits: keine (der Ordner ist kein Git-Repo, außerdem war laut Auftrag nichts zu committen)
---
## Umgesetzt
Ich habe nur gelesen und keine Datei verändert. Punkt 3 (PM2) und Punkt 4 (/var/www/pvpp) konnte ich nicht prüfen, weil die Rechte für `pm2` und für Ordner außerhalb dieses Verzeichnisses fehlen. Die Arbeitsanweisung, die die Prime-Routine lesen will (`/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`), gibt es auf diesem Rechner nicht. Ich habe deshalb nach ENTSCHEIDUNGEN.md gearbeitet.

1. **Git:** Der Ordner ist **kein Git-Repo**. Es gibt also keine Commits und keinen Diff. Alle Dateien im Hauptordner sind vom 08.05.2026, `workflow/` vom 02.06.2026.
2. **Domains:** Laut aktueller Nginx-Konfiguration liefert **keine Domain** diesen Ordner aus.
   - Laut README war das früher `landing.photovoltaikperformancepro.com` über `sites-enabled/landing.pvpp.conf`. Diese Datei liegt nicht mehr in `sites-enabled`.
   - `photovoltaikperformancepro` kommt nur in `unternehmensdigitalisierung.conf` vor (Zeile 2): `server_name unternehmensdigitalisierung.io turnaround.… warteschlange.… eid.photovoltaikperformancepro.com`.
   - Dort gilt `location / { proxy_pass http://127.0.0.1:8082; }`, also ein Container. Laut Kommentar ist dessen Root für eid.* und warteschlange.* `/usr/share/nginx/html/eid-warteschlange`.
   - **eid.* und warteschlange.* liefern seit 10.09.2026 absichtlich eine 503-Seite „Warteschlange geschlossen“** (Zeilen 28–31).
3. **Statisch oder Node:** Die Seite ist statisch: `index.html`, `styles.css` und `script.js`, ohne Build-Schritt.
   - Dazu gibt es einen Node-Dienst in `workflow/`: Express, `server.js`, `POST /api/waitlist` und `/health`, nur auf localhost.
   - Laut `ecosystem.config.js` gehört er zum PM2-Prozess **`pvpp-landing`**.
   - Der Port ist **3802**. Das README nennt 3801, das ist falsch; 3801 belegt TranscriptAI.
   - `eid-webhook` kommt in diesem Ordner nicht vor. Ob `pvpp-landing` läuft, konnte ich nicht prüfen.
4. **Unterschied zu /var/www/pvpp:** Konnte ich nicht vergleichen. Sicher ist: Dieser Ordner ist die alte **Landing-/Wartelisten-Seite** (landing.*), nicht die EID-Seite. Die aktuelle EID-Seite liegt im Container hinter :8082 (`eid-warteschlange`) und ist derzeit geschlossen. Welche Rolle /var/www/pvpp spielt, ist offen.
5. **Vorschau:** Es gibt keine preview-Subdomain und keinen Vorschau-Unterordner.
   - Vorschlag: eine eigene Subdomain `vorschau.photovoltaikperformancepro.com` mit eigenem Server-Block, `root` auf einen Vorschau-Ordner (z. B. `/var/www/photovoltaikperformancepro-vorschau`) und Zertifikat über certbot.
   - Dazu Basic-Auth und `X-Robots-Tag: noindex`, damit die Vorschau nicht in Suchmaschinen landet.
   - Die Vorschau-Subdomain darf nicht unter die 503-Sperre für eid.* und warteschlange.* fallen.
   - Vorher den Ordner per `git init` versionieren.
6. **Seiten:**
   - Startseite `index.html`: Landingpage mit Formular für die Warteliste.
   - `impressum.html` und `datenschutz.html`.
   - Dazu `robots.txt`, `sitemap.xml`, `assets/favicon.svg` und `workflow/email-preview.html` (Vorlage für die Auto-Reply-Mail).
   - Seiten für **Monitoring oder einen Rechner gibt es hier nicht.**

## Offen für Andre
- **Sicherungsdateien in `sites-enabled`:** `unternehmensdigitalisierung.conf.stand-vor-schliessung-20260910` und `uebermorgen.conf.stand-vor-api-riegel-20260910` liegen direkt in `sites-enabled`. Wenn dort alles eingebunden wird (`include sites-enabled/*`), gibt es doppelte `server_name`-Einträge, und die Sperre könnte unterlaufen werden. Die Sicherungen sollten nach `sites-available` oder in ein Backup-Verzeichnis.
- **Vorschau-Subdomain:** Nginx-Block, DNS-Eintrag und Zertifikat einrichten (siehe Punkt 5).
- **PM2-Status:** Bitte `pm2 list` prüfen. Läuft `pvpp-landing` noch, obwohl keine Domain mehr auf ihn zeigt? Gibt es `eid-webhook`?
- **Secrets im Webordner:** `workflow/google-credentials.json` und das SMTP-Passwort in `ecosystem.config.js` liegen hier. Das ist ungefährlich, solange kein Nginx-Root auf diesen Ordner zeigt. Wird er je wieder direkt als Root ausgeliefert, wären sie öffentlich.
- **Absender in `datenschutz.html`:** Dort steht `management@solarsecure.pro`. Das widerspricht ENTSCHEIDUNGEN.md, nach der Energie/Solar-Mails über `info@photovoltaikperformancepro.com` laufen sollen.
- **Rechte:** Damit ich Punkt 3 und 4 beantworten kann, brauche ich Freigaben für `pm2 list` und Lesezugriff auf `/var/www/pvpp`.

## Fragen an Claude Desktop
- Soll die neue EID-Seite auf diesem Ordner aufbauen (alte Landing), auf /var/www/pvpp oder auf dem Container-Inhalt `eid-warteschlange` hinter :8082?
- Darf ich den Ordner beim nächsten Auftrag mit `git init` versionieren? Ohne Repo kann ich die Regel „nach jedem lauffähigen Stand committen“ nicht einhalten.
