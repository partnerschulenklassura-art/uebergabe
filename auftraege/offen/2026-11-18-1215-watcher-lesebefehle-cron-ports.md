---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Andre hat beide Fragen aus `2026-11-18-1145-servercheck-ppp` mit **Ja** beantwortet. Außerdem hat er `ufw status`, `nginx -t` und `certbot certificates` selbst ausgeführt: Firewall aktiv (eingehend standardmäßig gesperrt, offen: 22, 80/443, 8883, 8080; 3800/3801/3811/3900 nur aus 172.19.0.0/16), Nginx-Prüfung ok, alle Zertifikate mindestens 45 Tage gültig.

Wieder nur lesen und vorbereiten, nichts ändern außer Dateien im Übergabe-Repo-Arbeitsbereich ist nicht erlaubt; fertige Befehle für Andre liefern.

1. **Lesebefehle für den Watcher freigeben (Frage 1 = ja):** Finde heraus, wo die Rechte des Watchers festgelegt sind (Claude-Code-Einstellungen des Watcher-Laufs, z. B. `settings.json`/`allowedTools`, Startskript des systemd-User-Timers). Liefere unter „Offen für Andre“ **einen** Befehl, der genau diese reinen Lesebefehle erlaubt: `tmux ls`, `tmux list-panes`, `tmux capture-pane -p`, `ps`, `df`, `free`, `du`, `ss -ltnp`, `crontab -l`, `nginx -t`, `certbot certificates`, `systemctl list-timers`, `systemctl status` (ohne start/stop/restart), `docker ps`, `ufw status`, `journalctl --no-pager -n`. Keine Schreib-, Lösch- oder Neustartbefehle. Mit Sicherung der alten Einstellung.
2. **`library_reminder.py` (Frage 2 = ja):** Eintrag in der Crontab, Ort des Skripts, warum er fehlschlägt (Log oder Mail in `/var/mail`, falls vorhanden). Liefere **einen** fertigen Befehl, der nur diese Zeile in der Crontab korrigiert (mit `cd` in den richtigen Ordner und Log-Datei), mit Sicherung `crontab -l > /root/crontab.vor-library-$(date +%Y%m%d)`.
3. **Ports, die trotz Firewall offen sein könnten:** Docker veröffentlicht Ports an ufw vorbei. Prüfe mit den Dateien unter `/proc/net/tcp*` bzw. Docker-Konfiguration (`docker ps` falls erlaubt, sonst `docker-compose.yml`/Container-Konfiguration lesen), ob 1883, 8083, 8883, 8080 von einem Container auf 0.0.0.0 veröffentlicht werden und was dahinter läuft. Ist 8080 überhaupt belegt? Wenn nicht: Befehl zum Schließen vorbereiten (`ufw delete allow 8080/tcp`), deutlich gekennzeichnet.
4. **Zertifikate:** Gibt es eine automatische Erneuerung (certbot-Timer oder Cron)? Die meisten laufen am 02.01.2027 ab.

# Abnahmekriterien
- Für 1 bis 4 je Befund in einem Satz und, wo nötig, genau ein Befehl für Andre mit Angabe, was er ändert. Nichts selbst geändert.
