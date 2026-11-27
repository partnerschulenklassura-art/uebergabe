---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-27-1345-pv-monteur-kunde-iws
---
# Was soll passieren
Fortsetzung von `…1345…` (Lauf ist abgebrochen, weil er auf die Gesamtsuite gewartet hat). **Nicht auf die Gesamtsuite warten** – die startet Andre selbst im Hintergrund. Limit 25 Minuten, nur gezielte Tests mit `timeout 300`.

Alle Vorgaben aus `…1345…` gelten weiter (IWS GmbH, genau 1 Zugang für `d.christof@iwsgmbh.com`, kostenlos, ohne Laufzeitende, darf Aufträge anlegen **und** prüfen, **keine** automatische Mail an ihn, Kennwort über „Kennwort vergessen“). Zusätzlich:
- **Sauber ohne Testdaten:** Der neue Betrieb startet leer – keine Demo-Aufträge, -Anlagen, -Kunden, -Messmittel. Prüfe per Test, dass er nichts aus „Solarwartung Kubitz“ oder „PV Performance Pro“ sieht (Mandantentrennung) und dass beim Anlegen keine Beispieldaten erzeugt werden.
- Arbeite im Arbeitsbaum `.wt-kundenbetrieb` auf Zweig `kundenbetrieb` (dort liegen schon Werkzeug, AK-59-Fix und ggf. die App-Icons aus `…1420…`).
- Release-Zweig `release-2026-11-27-iws` aus `kundenbetrieb` anlegen.
- **Ein Befehl für Andre** (als root, ` #` am Ende), der: sichert (Daten + Zweig), auf `release-2026-11-27-iws` umstellt, falls Servercode geändert ist (z. B. Manifest/Icons) `pm2 reload pv-monteur` mit Gesundheitsprüfung macht, dann den Betrieb IWS GmbH anlegt (ohne Mail), am Ende nur firma_id, Sitzplätze und Anmeldeadresse ausgibt; Rückweg bei Fehler. Gibt es die E-Mail schon: Abbruch mit Hinweis, nichts doppelt.
- In der Rückmeldung: Befehl, Tests, ob pm2-Neuladen nötig ist.
