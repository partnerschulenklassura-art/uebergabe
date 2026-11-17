---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Der Leistungscheck ist live (Andre hat `leistungscheck-online.sh` am 17.11.2026 ausgeführt). Live-Test: Ort, PVGIS und DWD laufen. **Umgebung scheitert immer** (504 nach 25 s, beide Overpass-Server). Die Seite rechnet dann ohne Umgebung.

1. IndexNow melden (Schlüssel wie bisher): `https://www.photovoltaikperformancepro.com/leistungscheck/`, `/datenschutz.html`, `/`. HTTP-Code melden.
2. Overpass von diesem Server aus diagnostizieren, nur lesen, kurz (je Aufruf `timeout 30`): `curl -sv` gegen `https://overpass-api.de/api/status` und `https://overpass.kumi.systems/api/status`. Ist die Server-IP gesperrt oder gedrosselt (429, „rate limited“)? Antwortet eine Mini-Abfrage (`node(1);out;`)?
3. Unabhängig vom Ergebnis eine **lokale Quelle** bauen, damit die Umgebung nicht von fremden Servern abhängt:
   - Geofabrik-Auszüge für Sachsen und Thüringen (`download.geofabrik.de/europe/germany/sachsen-latest.osm.pbf`, `thueringen-latest.osm.pbf`), einmal herunterladen, mit `osmium tags-filter` auf die Merkmale aus dem Overpass-Auftrag reduzieren und in eine kleine Datei je Art umwandeln (z. B. GeoJSON oder eine SQLite-Tabelle mit Begrenzungsrechteck). Größe nach dem Filtern melden.
   - `umgebung` fragt zuerst lokal ab. Liegt der Standort außerhalb der Auszüge, wird wie bisher Overpass gefragt.
   - Ein Aktualisierungsskript für monatlich (nicht einrichten, nur bereitlegen; Cron ist Sache von Andre).
   - Falls `osmium` fehlt: melden, welches Paket nötig ist (Systemänderung = Offen für Andre), und bis dahin mit einem Node-Paket arbeiten, das PBF lesen kann, sofern ohne Systemänderung möglich.
4. Tests ohne Netz. Probe Werdau (50.73, 12.35) aus der lokalen Quelle mit Ergebnisliste.
5. Dienst neu laden ist erlaubt, wenn nur Code in `/var/www/eid/ppp-api` geändert wurde: `pm2 reload ppp-api` (Andre hat den Dienst freigegeben). Kein Nginx.

# Abnahmekriterien
- IndexNow-Code, Overpass-Diagnose, lokale Umgebung für Sachsen und Thüringen mit Werdau-Ergebnis, `npm test` grün, Commit, Dienst nach Reload gesund.
