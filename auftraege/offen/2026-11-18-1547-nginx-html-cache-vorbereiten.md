---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Auf www.photovoltaikperformancepro.com bekommen HTML-Seiten keinen `Cache-Control`-Kopf; Browser zeigen nach einem Update teils die alte Fassung. Ziel: HTML (`/`, `/…/`, `*.html`) mit `Cache-Control: no-cache`, gehashte Dateien unter `/assets/` mit `Cache-Control: public, max-age=31536000, immutable`.

Nur **lesen** und ein Skript vorbereiten, Nginx **nicht** ändern:
1. Die zuständige Server-Konfiguration finden (`grep -rl ppp-public /etc/nginx`), vorhandene `add_header`-Zeilen (CSP usw.) beachten – in Nginx überschreibt ein `add_header` in einer `location` alle aus dem `server`-Block, daher müssen die Sicherheitsköpfe in jeder geänderten location erhalten bleiben (ggf. per `include`).
2. Skript `projekte/ppp/stufe5/html-cache.sh` schreiben: Sicherung der Datei, Änderung, `nginx -t`, bei Fehler Sicherung zurück, sonst `systemctl reload nginx`, danach per curl prüfen: Cache-Control auf `/leistungscheck/` und auf einer Datei unter `/assets/`, und dass CSP und die übrigen Sicherheitsköpfe auf beiden noch da sind. Am Ende „Fertig.“ oder klare Fehlermeldung. Das Skript darf `/api/` nicht berühren.
3. Skript im Übergabe-Repo committen, die geplante Änderung als Diff in die Rückmeldung.

Limit 15 Minuten.

# Abnahmekriterien
- Skript liegt bereit, Diff und aktuelle Köpfe stehen in der Rückmeldung.
