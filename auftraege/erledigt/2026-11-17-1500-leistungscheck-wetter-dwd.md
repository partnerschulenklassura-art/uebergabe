---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Antworten auf die Fragen aus `2026-11-17-1440-…-fortsetzen` und der nächste Baustein für `/var/www/eid/ppp-api/`. Weiterhin NICHT starten, kein PM2, kein Nginx.

1. Radius 2 750 m um die Rasterzelle, Auswertung 2 km um den Standort: **so lassen**, gut gelöst.
2. Overpass: auf **`out tags bb;`** umstellen und den Abstand zum Begrenzungsrechteck rechnen (Anlage im Rechteck = 0 m). Tests anpassen.
3. **Ja, Endpunkt `GET /api/leistungscheck/wetter?lat&lon&von=JJJJ-MM&bis=JJJJ-MM` bauen** mit den DWD-Monatsrastern Globalstrahlung (`grids_germany/monthly/radiation_global`, opendata.dwd.de, Quelle „Deutscher Wetterdienst“ mitliefern).
   - Je Monat der Rasterwert am Standort (Koordinatenumrechnung in das Rastersystem sauber dokumentieren) und das langjährige Mittel desselben Monats aus den DWD-Rastern (Mittel über die verfügbaren Jahre, mindestens 2005–2023, damit es zu PVGIS-SARAH3 passt).
   - Antwort: `{ monate: [{ monat, kwhM2, mittelKwhM2, faktor }], zeitraumFaktor, quelle, abgerufen }`. `zeitraumFaktor` = Summe Ist / Summe Mittel über den Zeitraum; der Rechenkern nutzt ihn als `wetter.zeitraumFaktor`.
   - Rasterdateien zwischenspeichern (sie ändern sich nicht), höchstens die nötigen Monate laden, Zeitlimit je Download 30 s.
4. Tests ohne Netz mit einer kleinen aufgezeichneten Rasterdatei. Ein echter Probeaufruf Werdau für die letzten 12 abgeschlossenen Monate, hart begrenzt (`timeout 120`).

# Abnahmekriterien
- `npm test` grün, Commit vorhanden, Dienst nicht gestartet.
- Rückmeldung: Werdau-Faktoren der letzten 12 Monate, Größe des Zwischenspeichers, ergänzte „Offen für Andre“-Liste (falls sich an PM2/Nginx etwas ändert).
