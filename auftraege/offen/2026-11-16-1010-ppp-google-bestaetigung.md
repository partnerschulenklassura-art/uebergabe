---
projekt: eid
ziel: live
---
# Was soll passieren
Andre meldet photovoltaikperformancepro.com bei der Google Search Console an. Google verlangt eine Bestätigungsdatei im Hauptverzeichnis.

1. `projekte/ppp/stufe1/website/googleaabfa9e2fda2d539.html` nach `/var/www/eid/ppp-public/googleaabfa9e2fda2d539.html` kopieren (nur diese Datei) und in `/var/www/eid` committen. Die Datei dauerhaft liegen lassen, nie löschen.
2. Prüfen: `curl -s https://www.photovoltaikperformancepro.com/googleaabfa9e2fda2d539.html` liefert genau `google-site-verification: googleaabfa9e2fda2d539.html`.

# Abnahmekriterien
- Datei öffentlich abrufbar mit exakt diesem Inhalt, Commit vorhanden.
