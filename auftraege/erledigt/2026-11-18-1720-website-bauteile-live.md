---
projekt: eid
ziel: live
---
# Was soll passieren
Andre hat `komponenten-online.sh` erfolgreich ausgeführt (PV-Monteur auf `release-2026-11-18-komp`, ppp-api mit `PVM_LC_KOMPONENTEN=1`). Jetzt die Website ausrollen, die die Bauteile im Prüfauftrag mitschickt.

Limit 10 Minuten. Wie beim Auftrag `2026-11-18-1500-…`:
1. Sicherung `/var/www/eid/ppp-public` nach `/root/sicherung-ppp-public-<Zeit>` (rsync -a).
2. `rsync -a --delete --exclude googleaabfa9e2fda2d539.html --exclude 5be86264736beec575350deb0aa9c40b.txt projekte/ppp/stufe5/website/ /var/www/eid/ppp-public/`, danach beide Dateien vorhanden.
3. curl: `/leistungscheck/` 200 mit `Cache-Control: no-cache`; im ausgelieferten Leistungscheck-JS kommt `steckverbinder_gemischt` vor; `/`, `/speicher/`, `/pruefen/`, `/leistungscheck/status/`, `/api/leistungscheck/gesund` 200.
4. Kein Testauftrag anlegen (Andre testet selbst), kein Nginx, keine .env. Commit in `/var/www/eid`.

Bei Fehler Sicherung zurück.

# Abnahmekriterien
- Neue Fassung live, Prüfpunkte aus 3 erfüllt, Sicherungspfad in der Rückmeldung.
