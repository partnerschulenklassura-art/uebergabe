---
projekt: eid
ziel: live
---
# Was soll passieren
Andre hat Stufe 2 freigegeben (16.11.2026): Die Seite „Prüfen“ wird zusätzlich freigeschaltet. Nur Website-Dateien, kein Eingriff in Nginx.

1. `projekte/ppp/stufe2/website/` per `rsync -a --delete` nach `/var/www/eid/ppp-public/` kopieren. Die Dateien `googleaabfa9e2fda2d539.html` und `5be86264736beec575350deb0aa9c40b.txt` sind im neuen Stand enthalten; nach dem Kopieren prüfen, dass beide noch da sind.
2. `projekte/ppp/web/` nach `/var/www/eid/ppp-web/` aktualisieren (ohne node_modules), `npm ci && npm run build`, und vergleichen: dieselben Seiten wie in `ppp-public/` (index, speicher/, pruefen/, Rechtstexte, sitemap.xml mit pruefen). Kein strom/, komponenten/, planen/, schutz/.
3. In `/var/www/eid` committen.
4. Live prüfen mit curl: `https://www.photovoltaikperformancepro.com/pruefen/` = 200, `/strom/` = 404, die Google-Datei und die IndexNow-Datei = 200.
5. IndexNow benachrichtigen (Schlüssel `5be86264736beec575350deb0aa9c40b`, keyLocation wie beim letzten Mal), urlList: `https://www.photovoltaikperformancepro.com/pruefen/` und `https://www.photovoltaikperformancepro.com/`.

# Abnahmekriterien
- /pruefen/ live mit 200, Bestätigungsdateien unverändert erreichbar, Commit vorhanden, HTTP-Code von IndexNow in der Rückmeldung.
