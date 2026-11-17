---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Der Leistungscheck (Rechenkern `projekte/ppp/web/src/lib/leistungscheck.js`, Konzept https://claude.ai/artifact/WYXq2JdFo97xHWckGoQ8QA) braucht zwei Daten vom Server, weil PVGIS und Overpass im Browser nicht direkt abrufbar sind bzw. zwischengespeichert werden sollen. Baue dafür einen kleinen Dienst in `/var/www/eid/ppp-api/` (Node/Express wie üblich), mit Tests. NICHT starten, kein PM2, kein Nginx – das macht Andre nach Freigabe.

PVGIS ist in SolarNavi schon angebunden (solarnavi-api, Port 3800). Den dortigen Aufruf bitte nur LESEN und die bewährte Logik übernehmen (Parameter, Fehlerbehandlung, Zeitlimits), nicht an SolarNavi ändern.

1. `GET /api/leistungscheck/referenz?lat&lon&azimut&neigung&aufgestaendert`
   - PVGIS PVcalc mit peakpower=1, loss=0, angle=neigung, aspect=azimut (PVGIS: 0 = Süd, −90 = Ost, wie im Rechenkern), mountingplace=free bei aufgeständert, sonst building.
   - Antwort: `{ referenzKwhKwp (E_y), monate: [E_m ×12], quelle, datenbank, abgerufen }`.
   - Zwischenspeicher je gerundetem Parametersatz (lat/lon auf 0,01°, Winkel auf 1°) für 90 Tage, als JSON-Datei.
2. `GET /api/leistungscheck/umgebung?lat&lon`
   - Overpass-Abfrage im Umkreis von 2 km. Zuordnung auf die Arten des Rechenkerns (`VERSCHMUTZER` in leistungscheck.js): tierhaltung (landuse=farmyard, building=cowshed/stable/barn, man_made=silo), acker (landuse=farmland), steinbruch (landuse=quarry, man_made=works mit cement/gravel), industrie (landuse=industrial, man_made=chimney), bahn (railway=rail), strasse (highway=motorway|trunk|primary), baustelle (landuse=construction), wald (landuse=forest, natural=wood), voegel (natural=water, man_made=silo).
   - Antwort: `[{ art, abstand (m, kürzester zur Anlage), name?, osm_id }]`, je Art nur der nächste Treffer. Zwischenspeicher 180 Tage. Quellenangabe © OpenStreetMap-Mitwirkende mitliefern.
3. Grenzen: eigene Aufrufbegrenzung (z. B. 30/min je IP), Zeitlimit 20 s, saubere Fehlermeldung auf Deutsch. Keine personenbezogenen Daten speichern.
4. Tests mit aufgezeichneten Antworten (keine Live-Aufrufe im Test), dazu EIN echter Probeaufruf für Werdau (50.73, 12.38, Süd, 30°) und dessen Ergebnis in der Rückmeldung.
5. Zusätzlich nur recherchieren und berichten: Woher bekommen wir die Einstrahlung für einen konkreten zurückliegenden Zeitraum (letzte 12 Monate)? PVGIS-Zeitreihen enden derzeit vor 2024. Optionen bewerten: DWD Open Data (Globalstrahlung, Monatsraster), Open-Meteo (Lizenz für gewerbliche Nutzung?), andere. Empfehlung mit Kosten.

# Abnahmekriterien
- Code und Tests in `/var/www/eid/ppp-api/`, `npm test` grün, Commit vorhanden, Dienst NICHT gestartet.
- Rückmeldung: Ergebnis des Probeaufrufs Werdau, Empfehlung Wetterdaten Zeitraum, und unter „Offen für Andre“ die genauen Befehle für PM2-Start und den Nginx-Eintrag `location /api/leistungscheck/` für photovoltaikperformancepro.com.
