---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Gesamtprüfung nach den Arbeiten vom 15.–17.11.2026 (PV Performance Pro, Leistungscheck). Auf dem Server laufen drei tmux-Sitzungen; Andre will sicher sein, dass nichts hängt, nichts doppelt läuft und nichts nach einem Befehl stehen geblieben ist. **Nur lesen und berichten.** Nichts beenden, nichts löschen, nichts neu starten. Jeder Befehl mit `timeout 20`. Kein `pgrep -f` mit dem eigenen Suchbegriff (findet sich selbst), stattdessen `ps -eo pid,ppid,etime,stat,pcpu,pmem,cmd --sort=-etime`.

1. **tmux:** `tmux ls` und je Sitzung `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_pid} #{pane_current_command} #{pane_current_path}'`. Je Fenster die letzten 15 Zeilen (`tmux capture-pane -p -t … -S -15`): wartet etwas auf Eingabe (Passwort, y/n, Pager, `crontab -e`-Editor), hängt ein Befehl, steht eine Fehlermeldung da?
2. **Hängende oder verwaiste Prozesse:** Prozesse, die länger als 30 Minuten laufen und zu curl, wget, node-Skripten, npm, git, osmium, sqlite, rsync, certbot, sleep-/while-Schleifen gehören. Besonders: übrig gebliebene Downloads (Geofabrik), Wartschleifen aus früheren Claude-Code-Läufen, Zombies (`stat` Z).
3. **PM2:** `pm2 jlist` zusammengefasst je Prozess (Name, Status, Neustarts, Uptime, Speicher, Arbeitsordner). Erwartet: `ppp-api` online auf Port 3140, PV-Monteur aus `/root/pv-monteur-live`, solarnavi-api, die übrigen wie vorher. Auffällig: viele Neustarts, `errored`, doppelte Namen, zwei Prozesse auf demselben Port. `pm2 logs ppp-api --lines 30 --nostream` auf Fehler prüfen.
4. **Ports:** `ss -ltnp` – wer lauscht worauf, gibt es Doppelbelegung oder Dienste, die nur auf 0.0.0.0 offen sind, obwohl sie hinter Nginx gehören?
5. **Nginx und HTTPS:** `nginx -t`; Inhalt von `/etc/nginx/sites-available/ppp` (nur die location-Blöcke); live mit `curl -s -o /dev/null -w "%{http_code} %{time_total}\n" --max-time 20`: `https://www.photovoltaikperformancepro.com/`, `/speicher/`, `/pruefen/`, `/leistungscheck/`, `/strom/` (soll 404), `/googleaabfa9e2fda2d539.html`, `/api/leistungscheck/gesund`, `/api/leistungscheck/ort?q=08412%20Werdau`, `/api/leistungscheck/umgebung?lat=50.73&lon=12.35`. Ablaufdatum des Zertifikats (`certbot certificates`). kritis.- und turnaround.photovoltaikperformancepro.com erreichbar?
6. **Speicher und Platz:** `df -h /`, `free -h`, größte Dateien unter `/tmp` und `/var/www/eid/ppp-api/data` (`du -sh`), Größe der PM2-Logs (`du -sh ~/.pm2/logs`). Liegen die Testdateien `/tmp/umgebung-3.sqlite`, `/tmp/umgebung-4.sqlite`, `/tmp/umg-voll.sqlite` und alte `umg_*.json` noch da?
7. **Cron:** `crontab -l` – ist die OSM-Aktualisierung eingetragen? Gibt es Einträge doppelt?
8. **Git-Stand:** In `/var/www/eid` und `/root/pv-monteur-live` uncommittete Änderungen (`git status --short | head`)?
9. **Watcher:** Läuft der Übergabe-Watcher genau einmal, letzter erfolgreicher Lauf, hängt ein Auftrag?
10. Antwort auf die offene Frage aus `2026-11-17-1900-…`: **Ja**, `vereinfache()` auch im Overpass-Rückfall anwenden (10 m). Das ist die einzige erlaubte Änderung in diesem Auftrag: Code, Test, Commit, `pm2 reload ppp-api`, danach `/api/leistungscheck/gesund` prüfen.

# Abnahmekriterien
- Rückmeldung als Ampel-Tabelle (grün / gelb / rot) je Punkt 1–9 mit einem Satz Befund.
- Unter „Offen für Andre“ für jeden gelben oder roten Punkt **genau einen** fertigen Befehl zum Kopieren, mit Angabe, in welcher tmux-Sitzung er laufen soll und was er bewirkt. Befehle, die etwas beenden oder löschen, deutlich kennzeichnen.
- Punkt 10 erledigt, Tests grün.
