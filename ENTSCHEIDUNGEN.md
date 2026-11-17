# Feste Entscheidungen (gelten für Claude Desktop und Claude Code)

- Sprache aller Inhalte: Deutsch.
- photovoltaikperformancepro immer mit .com (nie .io).
- E-Mail-Absender: Energie/Solar → info@photovoltaikperformancepro.com, alles andere → info@unternehmensdigitalisierung.io.
- Nach jedem lauffähigen Stand committen.
- Änderungen zuerst auf Vorschau; live erst nach Freigabe durch Andre.
- Keine Eingriffe an Nginx, Datenbank-Schema, Systemdiensten oder Secrets über den Watcher – solche Punkte als „Offen für Andre“ in die Rückmeldung schreiben.

## Leistungscheck (17.11.2026, Claude Desktop)
- Wettermittel bleibt 2005–2023, passend zu PVGIS-SARAH3.
- Abstand zu Verschmutzern über `out tags bb` reicht vorerst; Straße und Bahn bei Bedarf später mit `out geom`.
- DWD-Faktoren (horizontal) werden im Rechenkern mit den PVGIS-Monatserträgen der Anlage gewichtet (`wetterFaktor()` in `projekte/ppp/web/src/lib/leistungscheck.js`). Der Dienst liefert dafür die Monatsfaktoren, PVGIS die Monatserträge.
- Der Dienst `/var/www/eid/ppp-api` wird erst mit der Seite „Leistungscheck“ gestartet.
- Ortssuche: Die Seite verlangt eine fünfstellige PLZ; `addressdetails=1` und „Ort, Kreis“ passen; eine PM2-Instanz für ppp-api (17.11.2026).
- Go-live-Skript: maßgeblich ist `projekte/ppp/stufe3/leistungscheck-online.sh` (Schutzschritte aus der Prüfung übernommen); die Kopie in `/var/www/eid/ppp-stufe3/` ist überholt.
