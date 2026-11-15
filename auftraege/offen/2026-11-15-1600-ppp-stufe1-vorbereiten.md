---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Andre will photovoltaikperformancepro.com in Stufen online bringen. Stufe 1 = nur Startseite und Speicher-Seite, plus Impressum, Datenschutz, AGB, Software- und Partnerbedingungen. Freigabe von Andre für Stufe 1 liegt vor (15.11.2026). Nginx und Zertifikat stellt Andre selbst um, mit `projekte/ppp/stufe1/online.sh`.

Neue Quelle der Wahrheit für die Website ist `projekte/ppp/web/` (Marke „PV Performance Pro – Energie-Netzwerk“, Fotodiorama, Rechtstexte, Vorab-Rendern). Der alte Stand `projekte/eid/web/` bleibt liegen: Die Seiten Bewerten, Überwachen und Anlagenwert werden in einer späteren Stufe übernommen. Nichts davon löschen.

1. `projekte/ppp/stufe1/website/` per `rsync -a --delete` nach `/var/www/eid/ppp-public/` kopieren und in `/var/www/eid` committen.
2. Zur Kontrolle `projekte/ppp/web/` nach `/var/www/eid/ppp-web/` kopieren (ohne node_modules), dort `npm ci && npm run build` und prüfen, dass `dist/` dieselben Seiten enthält wie `ppp-public/` (index.html, speicher/, Rechtstexte, sitemap.xml, llms.txt; KEIN strom/, komponenten/, planen/, pruefen/, schutz/).
3. Nur lesen: Was liefert heute `photovoltaikperformancepro.com` und `www.photovoltaikperformancepro.com` aus? (`nginx -T` nach dem Namen durchsuchen, Datei und Zeilen nennen; `dig +short` für beide Namen; `curl -sI` für beide). Steht der Name in einer Datei, die auch andere Seiten bedient, genau die Zeilen nennen, die Andre für Stufe 1 entfernen muss. kritis.photovoltaikperformancepro.com und eid.photovoltaikperformancepro.com nicht anfassen.
4. `bash -n projekte/ppp/stufe1/online.sh` und prüfen, ob das Skript zum Server passt (Pfade, rsync, certbot vorhanden). NICHT ausführen.

# Abnahmekriterien
- `/var/www/eid/ppp-public/index.html` und `/var/www/eid/ppp-public/speicher/index.html` existieren, Commit vorhanden.
- Rückmeldung nennt: was heute auf der Domain läuft, wohin DNS zeigt, und ob `online.sh` ohne Änderung laufen kann. Falls nicht: genau, was Andre vorher ändern muss.
