---
projekt: eid
ziel: vorschau
bezug: 2026-11-18-1215-watcher-lesebefehle-cron-ports
---
# Was soll passieren

Sicherheitscheck von srv1171441. Anlass ist die Linux-Kernel-Lücke **CVE-2026-98432**: Sie steckt in der Verarbeitung eingehender IPv4-TCP-Verbindungen und kann zum Absturz oder zur Ausführung von Code führen. Der Server ist betroffen, weil er offene TCP-Ports hat.

**Nur lesen, nichts ändern.** Alles, was etwas ändert (Firewall, SSH, Updates, Neustart), schreibst du als fertigen, geprüften Befehl unter „Offen für Andre“, mit dem gewohnten ⚠️-Hinweis, was der Befehl ändert.

## 1. Firewall und offene Ports
- `ufw status verbose` und `ss -ltnp` auswerten.
- Ziel: Von außen sind nur **22, 80 und 443** offen. Alles andere (3800, 3801, 3810, 3811, 3821, 3900, 3140, 3150, 5678, 5432, 1883, 8083 usw.) ist nur über Nginx bzw. lokal erreichbar.
- Prüfen, ob die Standardregel für eingehende Verbindungen `deny` ist.
- Für 22, 80 und 443 jeweils angeben, ob die Freigabe auch für IPv6 gilt.
- Die überflüssigen Freigaben 8080 und 8883 (laut Rückmeldung vom 18.11. lauscht dort nichts): Sind sie noch da? Wenn ja, den Löschbefehl liefern.
- Jede weitere Freigabe außer 22, 80 und 443 auflisten, mit Prozess und Zweck. Löschbefehl nur, wenn sicher nichts davon abhängt.

## 2. SSH
- `/etc/ssh/sshd_config` und `/etc/ssh/sshd_config.d/*` lesen: Wie stehen `PermitRootLogin`, `PasswordAuthentication` und `KbdInteractiveAuthentication`?
- Prüfen, ob `/root/.ssh/authorized_keys` existiert und mindestens einen Schlüssel enthält. Nur Anzahl und Schlüsseltyp angeben, keinen Schlüsselinhalt.
- **Wichtig:** Einen Befehl zum Abschalten des Passwort-Logins nur liefern, wenn ein Schlüssel vorhanden ist. Andre muss vorher in einem zweiten Terminal testen, dass der Schlüssel-Login klappt. Den Testschritt bitte ausdrücklich dazuschreiben, damit er sich nicht aussperrt. Ist kein Schlüssel da, nur den Hinweis geben, wie er einen einrichtet.
- Ist fail2ban installiert und aktiv? (`systemctl status fail2ban`)

## 3. Kernel und Updates
- Laufende Kernel-Version (`cat /proc/version`) und Distribution (`cat /etc/os-release`).
- Gibt es `/var/run/reboot-required`? Wenn ja, `/var/run/reboot-required.pkgs` mit ausgeben.
- Per `curl` beim Sicherheitsdienst der Distribution nachsehen, ob es für **CVE-2026-98432** schon einen gefixten Kernel gibt, und mit welcher Paketversion. Ubuntu: `https://ubuntu.com/security/CVE-2026-98432`. Debian: `https://security-tracker.debian.org/tracker/CVE-2026-98432`.
- Läuft `unattended-upgrades`? (`systemctl status unattended-upgrades`)
- Befehl für Andre: Updates einspielen und neu starten. Vorher sicherstellen, dass alles nach dem Neustart wieder hochkommt:
  - `pm2 save`
  - PM2-Autostart prüfen (`systemctl status pm2-root`)
  - Läuft der Watcher-Timer nach dem Neustart wieder an?
  - Kommen die Docker-Container wieder hoch (Restart-Policy)?
- Erwartete Ausfallzeit angeben.

# Abnahmekriterien
- Ampel-Tabelle wie beim Servercheck vom 18.11. mit den Punkten Firewall, Ports, SSH, fail2ban, Kernel/CVE, automatische Updates, Neustart-Bereitschaft.
- Unter „Offen für Andre“ die Befehle in der Reihenfolge, in der er sie ausführen soll. Jeder Befehl mit Prüfschritt danach und Rückweg, falls etwas schiefgeht.
- Nichts geändert, nichts neu gestartet.
