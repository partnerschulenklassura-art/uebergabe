---
projekt: eid
ziel: live
---
# Was soll passieren
Neue Fassung der Website PV Performance Pro live stellen. Neu im Leistungscheck:
- Module, Wechselrichter mit Strings und Kabel (DC/AC) lassen sich einzeln angeben ("Mehr angeben" → "Module, Wechselrichter und Kabel einzeln angeben"). Befunde zu Kabeltyp, Querschnitt, Steckverbinder-Mischung und Stringauslegung erscheinen in der Ergebniskarte "Planung, Aufbau und Kabel" und im Protokoll.
- Zahlen in Befunden mit deutschem Komma.
- Die Prüfanfrage hält die Feldgrenzen von PV-Monteur ein: Ursachen und Prüfpunkte werden gekürzt, das Telefon hat 6–30 Zeichen. Ohne Koordinaten oder Einstufung geht die Anfrage direkt per E-Mail.

Schritte (Limit 15 Minuten):
1. Sicherung: `cp -a /var/www/eid/ppp-public /root/sicherung-ppp-public-$(date +%Y%m%d-%H%M)`.
2. Vom Übergabe-Repo aus: `rsync -a --delete --exclude googleaabfa9e2fda2d539.html --exclude 5be86264736beec575350deb0aa9c40b.txt projekte/ppp/stufe5/website/ /var/www/eid/ppp-public/`. Danach prüfen, dass beide ausgeschlossenen Dateien noch da sind.
3. Per curl prüfen:
   - `https://www.photovoltaikperformancepro.com/leistungscheck/` liefert 200, und das ausgelieferte JS (Asset aus der HTML lesen) enthält "einzeln angeben".
   - `/`, `/speicher/`, `/pruefen/`, `/leistungscheck/status/` und `/api/leistungscheck/gesund` liefern 200.
4. IndexNow-Ping für `/leistungscheck/` mit dem Schlüssel aus `5be86264736beec575350deb0aa9c40b.txt`. Den Schlüssel nicht in die Rückmeldung schreiben.
5. Kein Eingriff in Nginx, Cron oder .env.

Bei Fehlern: Sicherung zurückspielen und in der Rückmeldung beschreiben.

# Abnahmekriterien
- Die Live-Seite zeigt die neue Fassung.
- Alle genannten Adressen liefern 200.
- Google- und IndexNow-Datei sind vorhanden.
- Der Sicherungspfad steht in der Rückmeldung.
