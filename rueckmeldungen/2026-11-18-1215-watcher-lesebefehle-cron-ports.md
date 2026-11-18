---
status: erledigt
vorschau_url:
commits: keine (in `/var/www/eid` hat sich nichts geändert)
---
## Umgesetzt

Ich habe nur gelesen und nichts geändert. Die Befunde stammen aus `server/watcher.sh`, der Crontab-Datei, dem Reminder-Log, `docker ps`, `ss -ltnp`, der Mosquitto-Konfiguration und dem Certbot-Log. Die Befehle unten habe ich nicht ausgeführt.

1. **Watcher-Rechte:** Sie stehen allein in `/root/uebergabe/server/watcher.sh`, Zeile 48, im Schalter `--allowedTools` von `claude -p`. Die Freigaben in `/root/.claude/settings.local.json` gelten nur für Sitzungen, die in `/root` laufen, nicht für den Watcher in `/var/www/eid`. Deshalb waren `tmux`, `crontab -l` usw. gesperrt.
2. **`library_reminder.py`:** Das Skript liegt in `/opt/uebermorgen-linkedin/`, aber der Cron-Eintrag `0 6 * * 1 /usr/bin/python3 library_reminder.py …` läuft im Ordner `/root`. Deshalb steht in `logs/reminder.log` 18 Mal `can't open file '/root/library_reminder.py'`. Der Wecker ist also noch nie gelaufen. In `/var/mail` gibt es keine Mails.
3. **Ports:** Kein Container veröffentlicht einen Port auf 0.0.0.0, alle Docker-Ports hängen an 127.0.0.1. Auf 1883 und 8083 lauscht Mosquitto direkt auf dem Server, nicht in Docker. Es lauscht auf allen Adressen und lässt Verbindungen ohne Anmeldung zu (`allow_anonymous true`), ist aber durch ufw abgeschirmt, weil 1883 und 8083 dort nicht freigegeben sind. **Auf 8080 und 8883 lauscht nichts**, beide Freigaben in ufw sind also überflüssig.
4. **Zertifikate:** Die automatische Erneuerung läuft über den systemd-Timer `certbot.timer`; der Eintrag in `/etc/cron.d/certbot` greift unter systemd absichtlich nicht. Das Log zeigt etwa zwei Läufe pro Tag (zuletzt 18.11. 06:27), jeweils mit „no renewal failures“. Die Erneuerung setzt 30 Tage vor Ablauf ein, für den 02.01.2027 also ab etwa 03.12.2026. Nginx wird dabei von Certbot selbst neu geladen. Ein Befehl ist nicht nötig. `systemctl is-enabled certbot.timer` durfte ich nicht ausführen; die regelmäßigen Läufe im Log sprechen aber dafür, dass der Timer aktiv ist.

## Offen für Andre

- **1 Watcher** – ⚠️ **ÄNDERT `watcher.sh` UND PUSHT INS ÜBERGABE-REPO.** Ausführen, wenn gerade kein Auftrag läuft:
  ```
  cd /root/uebergabe && git pull -q --rebase && cp server/watcher.sh /root/watcher.sh.vor-lesebefehle-$(date +%Y%m%d) && sed -i 's#Bash(curl:\*)"#Bash(curl:*),Bash(tmux ls),Bash(tmux ls:*),Bash(tmux list-panes:*),Bash(tmux capture-pane -p:*),Bash(ps:*),Bash(df:*),Bash(free:*),Bash(du:*),Bash(ss -ltnp),Bash(crontab -l),Bash(nginx -t),Bash(certbot certificates),Bash(systemctl list-timers:*),Bash(systemctl status:*),Bash(docker ps:*),Bash(ufw status:*),Bash(journalctl --no-pager -n:*)" --disallowedTools "Bash(journalctl *--vacuum*),Bash(journalctl *--rotate*),Bash(journalctl *--flush*),Bash(journalctl *--sync*),Bash(journalctl *relinquish*),Bash(journalctl *--setup-keys*),Bash(journalctl *--update-catalog*)"#' server/watcher.sh && bash -n server/watcher.sh && git commit -qm "Watcher: reine Lesebefehle erlauben" server/watcher.sh && git push -q && git show --stat HEAD | tail -2
  ```
  - **Was er ändert:** Er erlaubt genau die 16 Lesebefehle aus dem Auftrag. Die alte Fassung wird vorher als `/root/watcher.sh.vor-lesebefehle-JJJJMMTT` gesichert.
  - **Absicherung:** `crontab -l`, `nginx -t`, `certbot certificates` und `ss -ltnp` sind nur genau in dieser Form erlaubt, also ohne Zusätze. `ss -ltnp` ist so eng gefasst, weil `ss -K` Verbindungen trennen kann. Für `journalctl` sperrt `--disallowedTools` die Optionen, die schreiben oder löschen, etwa `--vacuum` und `--rotate`.
  - **Warum committen und pushen:** Ohne Commit würde `git pull --rebase` im Watcher an der geänderten Datei scheitern, und der Watcher bliebe stehen.
  - **Noch nicht getestet:** Ich durfte die Ersetzung nicht einmal probeweise laufen lassen. Bitte nach dem Befehl die Ausgabe von `git show HEAD` ansehen: Erwartet wird eine geänderte Zeile 48. Falls etwas schiefgeht, mit `cp /root/watcher.sh.vor-lesebefehle-* /root/uebergabe/server/watcher.sh` zurück.

- **2 Cron** – ⚠️ **ÄNDERT DIE CRONTAB** (nur die Zeile mit `library_reminder.py`):
  ```
  crontab -l > /root/crontab.vor-library-$(date +%Y%m%d) && crontab -l | sed 's#^0 6 \* \* 1 /usr/bin/python3 library_reminder.py #0 6 * * 1 cd /opt/uebermorgen-linkedin \&\& /usr/bin/python3 library_reminder.py #' | crontab - && crontab -l | grep library_reminder
  ```
  - **Was er ändert:** Vor den Aufruf kommt `cd /opt/uebermorgen-linkedin &&`. Das Log bleibt `/opt/uebermorgen-linkedin/logs/reminder.log`.
  - **Hinweis:** Am Montag, 23.11., läuft der Wecker zum ersten Mal wirklich. Ist der Vorrat einer Marke knapp, verschickt er dann eine Mail.

- **3 Port 8080** – ⚠️ **ÄNDERT DIE FIREWALL** (schließt einen Port, auf dem nichts lauscht):
  ```
  ufw delete allow 8080/tcp && ufw status
  ```
  - **Was er ändert:** Er entfernt die Freigabe für 8080, für IPv4 und IPv6. Meldet ufw „Could not delete non-existent rule“, ist die Regel ohne `/tcp` angelegt; dann `ufw delete allow 8080` verwenden.

- **3 Mosquitto (nur Hinweis, kein Befehl):** Mosquitto lauscht auf allen Adressen und lässt Verbindungen ohne Anmeldung zu. Nach außen schützt allein die Firewall. Mosquitto auf `listener 1883 127.0.0.1` bzw. `listener 8083 127.0.0.1` zu binden, wäre ein Eingriff in einen Systemdienst. Das geht nur, wenn die Skripte und das Nginx-Dashboard sich lokal verbinden; das habe ich nicht geprüft.

- **Nebenbefund:** Den OSM-Eintrag vom 3. jedes Monats um 02:30 hat Andre bereits in die Crontab eingetragen (installiert 18.11. 11:13).

## Fragen an Claude Desktop

- Auf **8883** lauscht ebenfalls nichts; Mosquitto hat keinen TLS-Listener. Soll die Freigabe genauso geschlossen werden (`ufw delete allow 8883/tcp`), oder ist MQTT über TLS geplant?
- `watcher.sh` liegt im Übergabe-Repo. Soll die Änderung aus Punkt 1 künftig lieber Claude Desktop direkt im Repo machen, statt dass Andre sie auf dem Server per `sed` einspielt?
