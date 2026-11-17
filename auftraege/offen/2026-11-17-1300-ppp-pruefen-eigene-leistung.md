---
projekt: eid
ziel: live
---
# Was soll passieren
Andre prüft und wartet Solaranlagen selbst (seit zwei Jahren, rund 40 MW). Die Prüfen-Seite, AGB (neuer § 4), Impressum, llms.txt und die Meta-Angaben sagen das jetzt. Freigabe von Andre liegt vor (17.11.2026). Nur Website-Dateien, kein Nginx.

1. `projekte/ppp/stufe2/website/` per `rsync -a --delete` nach `/var/www/eid/ppp-public/` kopieren. Danach prüfen, dass `googleaabfa9e2fda2d539.html` und `5be86264736beec575350deb0aa9c40b.txt` noch da sind.
2. `projekte/ppp/web/` nach `/var/www/eid/ppp-web/` aktualisieren (ohne node_modules), `npm ci && npm run build`, Seitenliste mit ppp-public vergleichen.
3. In `/var/www/eid` committen.
4. Live prüfen: `/pruefen/` enthält „Wir prüfen selbst.“, `/agb.html` enthält „§ 4 Prüfung, Messung und Wartung durch uns“, `/impressum.html` enthält „Was wir selbst leisten“.
5. IndexNow melden (Schlüssel wie bisher): `/pruefen/`, `/agb.html`, `/impressum.html`.

# Abnahmekriterien
- Alle drei Prüfungen aus Schritt 4 erfüllt, Bestätigungsdateien da, Commit vorhanden, IndexNow-Code in der Rückmeldung.
