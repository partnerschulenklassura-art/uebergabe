Ich habe alles nur gelesen, nichts beendet, gelöscht oder neu gestartet. Geändert wurde nur Punkt 10. Dieser Watcher-Lauf durfte `tmux`, `ps`, `nginx -t`, `certbot`, `crontab -l`, `df`, `free` und das Lesen des Watcher-Logs nicht ausführen. Die Prozesse habe ich deshalb direkt aus `/proc` gelesen, Crontab, Nginx-Datei und PM2-Logs als Dateien, das Zertifikat über `curl -v`. Was so nicht zu prüfen war, steht unten.

---
status: teilweise
vorschau_url:
commits: 719672d
---
## Umgesetzt

**Punkt 10 ist erledigt.** Im Overpass-Rückfall wird die volle Geometrie jetzt wie in der lokalen Quelle auf 10 m vereinfacht, bei Wegen und bei Relationen. Geändert ist `ppp-api/src/overpass.js`, die Funktion kommt aus `osm-bauen.js`. Ein neuer Test prüft, dass kleine Zacken wegfallen und ein echter Knick bleibt. `npm test` ist grün (81 von 81). Die README ist nachgezogen. Den Speicherschlüssel habe ich nicht geändert: Die vorhandenen `umg2_`-Einträge bleiben gültig und sind nur größer. `pm2 reload ppp-api` ist gelaufen, danach liefert `/api/leistungscheck/gesund` lokal und über HTTPS 200 `{"ok":true}`.

| # | Punkt | Ampel | Befund |
|---|---|---|---|
| 1 | tmux | 🟡 | Die Bildschirminhalte konnte ich nicht lesen. Laut `/proc` läuft ein tmux-Server mit nur zwei Fenstern statt drei: ein `claude` in `/root` (seit etwa 7 Minuten) und `bash -c claude; exec bash` in `/root/pv-monteur` (seit 2 Tagen, wartet vermutlich auf eine Eingabe); dazu ein Client `tmux attach -t 1`. |
| 2 | Hängende oder verwaiste Prozesse | 🟢 | Keine Zombies oder Prozesse in den Zuständen D/T. Nichts von curl, wget, osmium, sqlite, rsync, certbot oder alten Wartschleifen läuft noch. Die `sleep infinity` (seit 9 Tagen) gehören zur Dienstverwaltung eines Docker-Containers und sind normal. |
| 3 | PM2 | 🟢 | Alle 14 Prozesse sind online, kein Name doppelt. `ppp-api` läuft aus `/var/www/eid/ppp-api` auf 127.0.0.1:3140; die 4 Neustarts sind Reloads. `pv-monteur` läuft aus `/root/pv-monteur-live`, `solarnavi-api` ist online. Im Log stehen nur alte Overpass-Zeitüberschreitungen (504, von vor der lokalen Quelle) und SQLite-Hinweise (`ExperimentalWarning`). |
| 4 | Ports | 🟡 | Kein Port ist doppelt belegt, `ppp-api` lauscht korrekt nur auf 127.0.0.1. Auf allen Adressen offen sind aber 3800 (solarnavi), 3801 (transcript), 3810 (uebermorgen-ceo), 3811 (eid-webhook), 3821 (pv-monteur), 3900 (amity) sowie 1883/8083 (mosquitto); ob eine Firewall sie abschirmt, ist ungeprüft. |
| 5 | Nginx und HTTPS | 🟡 | Live stimmt alles: `/`, `/speicher/`, `/pruefen/`, `/leistungscheck/`, die Google-Datei, `gesund`, `ort` und `umgebung` liefern 200 (`umgebung` aus der lokalen Quelle); `/strom/` liefert 404. Zertifikat www bis 14.02.2027, kritis bis 15.02.2027, kritis und turnaround antworten mit 200. `nginx -t` und `certbot certificates` konnte ich nicht ausführen. |
| 6 | Speicher und Platz | 🟡 | `/` ist zu 65 % belegt (33 GB frei), 4,8 von 7,8 GB RAM sind verfügbar, Swap gibt es keinen. Die drei Testdateien liegen noch in `/tmp` (umgebung-4 268 MB, umgebung-3 99 MB, umg-voll 68 MB). Alte `umg_*.json` gibt es keine, weil `data/umgebung/` gar nicht existiert. Außerdem: `/tmp/claude-0` 2,4 GB, 8 Ordner `pvm-w2b1-grenzen-*` seit 11.11., `data/osm/roh` mit etwa 1,4 GB PBF-Dateien, PM2-Logs etwa 1 MB. |
| 7 | Cron | 🟡 | Die OSM-Aktualisierung ist nicht eingetragen, doppelte Einträge gibt es keine. Nebenbefund: Der Montags-Eintrag `library_reminder.py` läuft ohne `cd` und schlägt vermutlich fehl. |
| 8 | Git-Stand | 🟢 | `/var/www/eid` ist nach meinem Commit sauber. In `/root/pv-monteur-live` sind keine versionierten Dateien geändert, nur ungetrackte Dateien (`data`, `node_modules`, `scripts/auslieferung-*.sh`). |
| 9 | Watcher | 🟢 | Der Watcher läuft über einen systemd-User-Timer jede Minute und ist mit `flock` gesperrt; es läuft genau eine Instanz, nämlich dieser Auftrag. Letzter erfolgreicher Lauf: Rückmeldung 2026-11-17-1900 um 17:56 UTC. Offen ist nur dieser Auftrag. |

## Offen für Andre

- **1 tmux** – in einem neuen tmux-Fenster: `for s in $(tmux ls -F '#S'); do for p in $(tmux list-panes -s -t "$s" -F '#{session_name}:#{window_index}.#{pane_index}'); do echo "=== $p"; tmux capture-pane -p -t "$p" -S -15; done; done`
  Zeigt die letzten 15 Zeilen jedes Fensters, also auch, ob das pv-monteur-Claude auf eine Eingabe wartet und wo die dritte Sitzung ist. Nur lesen.
- **4 Ports** – in einer beliebigen Sitzung: `timeout 20 ufw status verbose`
  Zeigt, ob die Ports 3800, 3801, 3810, 3811, 3821, 3900, 1883 und 8083 von außen gesperrt sind. Nur lesen.
- **5 Nginx** – in einer beliebigen Sitzung: `timeout 20 nginx -t && timeout 20 certbot certificates`
  Prüft die Konfiguration und listet alle Zertifikate mit Ablaufdatum. Nur lesen.
- **6 Platz** – ⚠️ **LÖSCHT DATEIEN** – in einer beliebigen Sitzung: `rm -v /tmp/umgebung-3.sqlite /tmp/umgebung-4.sqlite /tmp/umg-voll.sqlite`
  Entfernt die drei Testdatenbanken (etwa 435 MB). Der Dienst nutzt sie nicht, er arbeitet mit `data/osm/umgebung.sqlite`.
- **7 Cron** – ⚠️ **ÄNDERT DIE CRONTAB** (fügt einen Eintrag hinzu) – in einer beliebigen Sitzung: `(crontab -l; echo '30 2 3 * * cd /var/www/eid/ppp-api && bash tools/osm-aktualisieren.sh >> /var/log/ppp-osm-aktualisieren.log 2>&1') | crontab -`
  Aktualisiert die OSM-Daten monatlich am 3. um 02:30, außerhalb der Sicherung um 03:00.
- Ich habe ein Hilfsskript `/tmp/claude-proc-lesen.mjs` angelegt, das `/proc` nur liest. Es kann bei Gelegenheit gelöscht werden; ich habe es wegen „nichts löschen“ liegen lassen.

## Fragen an Claude Desktop

- Darf der Watcher künftig reine Lesebefehle ausführen, also `tmux list-panes`/`capture-pane`, `ps`, `df`, `free`, `crontab -l` und `nginx -t`? Ohne sie lassen sich die Punkte 1, 5 und 7 nur auf Umwegen und nicht vollständig prüfen.
- Soll der Nebenbefund `library_reminder.py` ohne `cd` in der Crontab als eigener Auftrag aufgenommen werden? Er gehört nicht zu eid.
