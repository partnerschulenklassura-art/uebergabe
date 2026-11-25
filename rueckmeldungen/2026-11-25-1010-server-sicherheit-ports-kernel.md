---
status: erledigt
vorschau_url:
commits: keine (in `/var/www/eid` hat sich nichts geändert; die zwei schon vorher geänderten Cockpit-Skripte habe ich nicht angefasst)
---
## Umgesetzt

Ich habe nur gelesen und nichts geändert oder neu gestartet. Drei Befehle durfte dieser Lauf nicht ausführen: `ufw status`, `sshd -T` und `apt list --upgradable`. `ufw` findet der Watcher nicht, weil `/usr/sbin` nicht in seinem PATH steht. Die Firewall habe ich deshalb aus `/etc/ufw/user.rules`, `user6.rules`, `ufw.conf` und `/etc/default/ufw` gelesen, SSH aus den Konfigurationsdateien.

**Wichtigstes Ergebnis:** Der Server ist gegen CVE-2026-98432 schon geschützt. Laut ubuntu.com ist die Lücke (Einstufung *critical*, CVSS 9.8) für 24.04 im Paket `linux` ab **6.8.0-149.149** behoben. Hier läuft **6.8.0-151-generic** (gebaut am 11.11.), gestartet beim Neustart am 24.11. um 17:48 UTC. Eine Datei `/var/run/reboot-required` gibt es nicht.

| Punkt | Ampel | Befund |
|---|---|---|
| Firewall | 🟢 | ufw ist eingeschaltet (`ENABLED=yes`). Eingehend gilt **DROP**, für IPv4 und IPv6 (`IPV6=yes`). **8080 und 8883 sind nicht mehr freigegeben.** Vorbehalt: Ich habe die Konfigurationsdateien gelesen, nicht die tatsächlich geladenen Regeln. |
| Ports | 🟢 | Von außen sind nur **22, 80 und 443** offen, jeweils für **IPv4 und IPv6**. Weitere Freigaben: 3800 (solarnavi), 3801 (transcript-api), 3811 (eid-webhook) und 3900 (amity), aber **nur aus dem Docker-Netz 172.19.0.0/16**. Die Regel für 3801 trägt den Kommentar „docker -> transcript-api“. Darauf greifen Container zu, deshalb kein Löschbefehl. 3810, 3821, 1883 und 8083 lauschen auf allen Adressen, haben aber keine Freigabe und sind damit gesperrt. Alle Docker-Ports (5678, 5433, 8081, 8082, 9000 usw.) sowie 3140, 3150 und 3001 hängen an 127.0.0.1. Auf 5432 lauscht nichts. |
| SSH | 🟡 | Die Einstellungen sind gut: `01-kein-passwort.conf` vom 24.11. wird zuerst gelesen und gewinnt. Damit gelten `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin prohibit-password` und `MaxAuthTries 3`. Die späteren Zeilen `PasswordAuthentication yes` (50-cloud-init) und `PermitRootLogin yes` (Zeile 130) wirken nicht. In `authorized_keys` stehen **3 Schlüssel vom Typ ssh-ed25519**, einer davon mit `restrict,port-forwarding`. Gelb wegen des Logins vom 21.11., siehe unten. |
| fail2ban | 🟢 | Aktiv seit 24.11. um 20:05, enabled, Jail `sshd` (Sperre 1 h nach 5 Fehlversuchen in 10 min, nftables). Ausgenommen ist 76.13.142.206. |
| Kernel/CVE | 🟢 | Ubuntu 24.04.5 LTS, Kernel 6.8.0-151 ≥ gefixte Version 149.149. Ein Neustart ist dafür nicht nötig. |
| Automatische Updates | 🟢 | `unattended-upgrades` ist aktiv. Paketliste und Sicherheitsupdates werden täglich geholt, zuletzt `apt-daily-upgrade` heute um 06:56. Einen automatischen Neustart gibt es nicht (nicht eingestellt). |
| Neustart-Bereitschaft | 🟢 | `pm2-root` ist enabled, `dump.pm2` enthält 15 Apps einschließlich cockpit. Der Watcher-Timer ist enabled (`OnBootSec=1min`), und Linger für root ist an. Alle laufenden Container haben `always` oder `unless-stopped`. Nur `kommunal_app` hat `no` und ist seit 6 Monaten beendet. Der Neustart am 24.11. hat das bestätigt: Alles läuft seit 15 h. |

**⚠️ Sicherheitsbefund (der Grund für Gelb bei SSH):** Laut `auth.log.1` gab es am 21.11. um 23:03:54 und 23:04:10 UTC zwei **erfolgreiche Passwort-Logins als root** von 89.247.160.241. Jede Sitzung dauerte etwa 1 Sekunde, und davor gab es keinen einzigen Fehlversuch. Das sieht nach einem Skript aus, das das Passwort **kannte**, also nicht nach Durchprobieren. Seit dem 24.11. gab es nur noch Schlüssel-Logins: von 169.254.0.1 (Hostinger-Browserterminal, RSA) und von 76.13.142.206 (ED25519, `SHA256:fT7+8FDY…`). Diese Adresse steht auch in der Ausnahmeliste von fail2ban.

## Offen für Andre

In dieser Reihenfolge:

**1 Nur lesen: wirksame Einstellungen gegenprüfen**
```
sshd -T | grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication) ' ; ufw status verbose
```
- **Erwartet:** `permitrootlogin without-password` (so schreibt `sshd -T` den Wert `prohibit-password`), `passwordauthentication no`, `kbdinteractiveauthentication no`. Bei ufw: `Default: deny (incoming)`, dazu 22, 80 und 443 jeweils auch mit „(v6)“ sowie 3800, 3801, 3811 und 3900 nur von 172.19.0.0/16.

**2 Nur lesen: Schlüssel zuordnen**
```
ssh-keygen -lf /root/.ssh/authorized_keys
```
- Zeigt nur die Fingerabdrücke und Kommentare. Jeden der 3 Schlüssel einem eigenen Gerät oder Dienst zuordnen. Einen unbekannten Schlüssel in `authorized_keys` löschen, vorher die Datei sichern: `cp /root/.ssh/authorized_keys /root/authorized_keys.bak`.

**3 ⚠️ ÄNDERT DAS ROOT-PASSWORT** (wegen des Logins vom 21.11.; nötig, falls Andre das nicht selbst war)
```
passwd root
```
- **Prüfschritt:** Der SSH-Login per Schlüssel geht weiterhin, weil Passwörter über SSH ohnehin abgeschaltet sind. Danach testen, ob das Hostinger-Browserterminal noch funktioniert.
- **Rückweg:** Das Root-Passwort lässt sich jederzeit im Hostinger-Panel neu setzen.
- **Weiter prüfen:** Was um 23:03/23:04 ausgeführt wurde, steht in keinem Log. Zu prüfen wären `crontab -l`, `ls -la --time-style=full-iso /etc/systemd/system /etc/cron.d` und `last -F | head -30`, jeweils auf Änderungen um den 21.11. um 23:04.

**4 Den Passwort-Login abschalten: nicht nötig.** Er ist seit dem 24.11. schon aus, und es sind Schlüssel vorhanden.

**5 Optional, ⚠️ SPIELT UPDATES EIN UND STARTET DEN SERVER NEU.** Für die CVE ist das **nicht nötig**. Nur ausführen, wenn gerade kein Watcher-Auftrag läuft.
```
pm2 ls && pm2 save && systemctl is-enabled pm2-root && loginctl show-user root -p Linger && systemctl --user is-enabled uebergabe-watcher.timer
apt update && apt full-upgrade -y
ls /var/run/reboot-required && cat /var/run/reboot-required.pkgs && reboot
```
- **Vor dem `pm2 save`:** In `pm2 ls` müssen alle 15 Apps auf `online` stehen, sonst wird ein lückenhafter Stand gesichert. Erwartet wird außerdem `enabled`, `Linger=yes` und `enabled`.
- **Der Neustart erfolgt nur, wenn die Updates ihn verlangen.**
- **Erwartete Ausfallzeit:** etwa 1–2 Minuten bis SSH und Nginx wieder da sind. Beim letzten Mal ging der SSH-Login 19 s nach dem Systemstart. Bis alle Container „healthy“ sind und der Watcher wieder läuft, dauert es etwa 3–5 Minuten.
- **Prüfschritt danach:**
  ```
  uname -r; pm2 ls; docker ps --format '{{.Names}}\t{{.Status}}'; systemctl --user list-timers uebergabe-watcher.timer; ufw status | head -5; curl -s -o /dev/null -w '%{http_code}\n' https://www.photovoltaikperformancepro.com/
  ```
  Erwartet: 15 Apps online, 12 Container „Up“ (`kommunal_app` bleibt beendet), der Timer aktiv, ufw „active“ und HTTP-Code 200.
- **Rückweg:**
  - PM2-Apps fehlen: `pm2 resurrect`.
  - Ein Container fehlt: `docker start <Name>`.
  - Der neue Kernel startet nicht: Im Hostinger-VPS-Panel die Konsole öffnen, im GRUB-Menü „Advanced options“ den Kernel 6.8.0-151 wählen und danach `apt-mark hold` auf das neue Kernelpaket setzen.

**Hinweise:**
- Ich habe `/tmp/cve-ubuntu.html` angelegt, das ist die abgerufene CVE-Seite. Sie kann gelöscht werden.
- Mosquitto lässt weiterhin Verbindungen ohne Anmeldung zu (`allow_anonymous`) und ist nur durch die Firewall geschützt, wie schon am 18.11. festgestellt.

## Fragen an Claude Desktop

- Wer steckt hinter 89.247.160.241 (Passwort-Login am 21.11.) und hinter 76.13.142.206 (Schlüssel-Login seit 24.11., in fail2ban freigestellt)? Falls 89.247.160.241 nicht Andre bzw. eines seiner Skripte war, sollte daraus ein eigener Auftrag zur Spurensuche werden.
- Der Watcher darf `ufw status` aufrufen, findet `ufw` aber nicht, weil `/usr/sbin` nicht in seinem PATH steht. Soll `watcher.sh` den PATH ergänzen, oder soll die Freigabe auf `/usr/sbin/ufw status` lauten? Dasselbe gilt für `sshd -T` und `apt list --upgradable`, die für solche Checks nützlich wären.
