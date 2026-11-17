---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Fortsetzung von `2026-11-17-1430-leistungscheck-wetter-umgebung` (lief in einen Timeout, während der Overpass-Probeaufruf wartete). Den Auftrag von dort bitte zu Ende bringen, aber zeitlich begrenzt:

1. Zuerst Stand prüfen: Was liegt schon in `/var/www/eid/ppp-api/`, laufen die Tests, gibt es einen Commit? Fehlendes ergänzen, nichts doppelt bauen.
2. Overpass robust machen: Zeitlimit je Anfrage 25 s, zwei Server nacheinander (overpass-api.de, dann overpass.kumi.systems), Abfrage schlank halten (nur `out center tags;`, Umkreis 2 km, ein einziger Union-Block statt vieler Einzelanfragen).
3. Probeaufrufe Werdau (50.73, 12.38) höchstens je 60 s insgesamt warten, NICHT im Hintergrund weiterlaufen lassen. Klappt Overpass nicht, das so melden und weitermachen.
4. PVGIS-Probeaufruf Werdau (Süd, 30°) und Ergebnis melden.
5. Die Recherche zu Wetterdaten für die letzten 12 Monate (DWD, Open-Meteo-Lizenz, andere) kurz mit Empfehlung.
6. Dienst NICHT starten, kein PM2, kein Nginx.

# Abnahmekriterien
- Code und Tests in `/var/www/eid/ppp-api/`, `npm test` grün, Commit vorhanden.
- Rückmeldung mit Werdau-Ergebnissen (oder klarer Fehlermeldung), Wetterdaten-Empfehlung und unter „Offen für Andre“ die genauen Befehle für PM2-Start und den Nginx-Eintrag `location /api/leistungscheck/` für photovoltaikperformancepro.com.
