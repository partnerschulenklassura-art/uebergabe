---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-19-1410-pv-monteur-modulanzahl
---
# Was soll passieren
Die Fotos der Carportanlage Steinpleis sollen in PV-Monteur beim Auftrag Steinpleis liegen, im **echten Betrieb „PV Performance Pro“** (angelegt über `release-2026-11-19-betrieb`). Gibt es den Auftrag dort noch nicht, wird er angelegt. Da der Watcher nicht auf `/root/pv-monteur-live` zugreifen darf, baust du ein Werkzeug, das Andre mit einem Befehl ausführt.

Zweig `steinpleis-import` auf `modulanzahl` (aus `…1410…`). Gesamtlimit 30 min, Rückmeldung spätestens nach 25 min. Gezielte Tests mit `timeout 300`, keine Gesamtsuite. Nichts ausliefern, kein PM2, keine .env.

## Fotos
Im Übergabe-Repo unter `projekte/ppp/steinpleis-fotos/`: `anlage/` (36 Bilder, Bestand Anlage, aufgenommen Aug. 2026 und Nov. 2026) und `kv1-3/` (25 Bilder, Kabelverteiler KV1–KV3, Nov. 2026). Alle JPG, höchstens 2000 px. Aufnahmedatum aus EXIF übernehmen, wenn vorhanden.

## Werkzeug `tools/unterlagen-import.js`
- `--firma-name "PV Performance Pro"` (oder `--firma <id>`), `--auftragsnummer <nr>` oder `--auftrag-anlegen <json>`, `--ordner <pfad> --art <foto-art> --titel <text>` (mehrfach möglich).
- Legt die Bilder dort ab, wo PV-Monteur Unterlagen/Fotos zur **Anlage** führt (vorhandenen Bestand für Pläne/Unterlagen bzw. Bildaufnahmen nutzen, Art z. B. „Bestandsfoto“), über die vorhandenen Speicherfunktionen. Keine Befunde, keine Messwerte (Regel R1).
- Doppelte Bilder (gleiche SHA-256) nicht zweimal ablegen. Am Ende Anzahl und Auftragsnummer ausgeben.
- Bricht ab, wenn der Betrieb nicht existiert („erst `betrieb-online.sh` ausführen“).

## Auftrag Steinpleis (nur anlegen, falls im echten Betrieb keiner mit „Steinpleis“ existiert)
- Kunde: WAK Green Power GbR (Kontakt Christian Koitzsch, keine weiteren Kontaktdaten)
- Adresse: Carportanlage Steinpleis, 08412 Werdau
- Leistung 246,89 kWp, Art Dach/Carport, Inbetriebnahme 2011, Wechselrichter Power-One Aurora
- Teilflächen: KV1 56,42 kWp, KV2 83,72 kWp, KV3 106,75 kWp; Modulleistung **leer lassen** (die Vorschläge aus `…1410…` sollen 260/250 Wp anbieten; Andre prüft am Typenschild)
- Status `planung`, Prüfanlass Fehlersuche, Hinweis am Auftrag: „E.ON meldet Fernsteuerbarkeit § 10b EEG gestört (Live-Wert ca. 1,56-fach über Abrechnung), Tranche 10223514936 / Vertrag V-5-00364_EEM. AC-Kabel KV2 defekt (L1), Reparatur durch AC-Firma. Frist Prüfprotokoll an E.ON: 24.11.2026.“
- Termin: Fr 20.11.2026, 08:00–12:00, „Prüfung Fernsteuerbarkeit, Übergabestation“, mit den Prüfpunkten:
  1. Steuerbox in der Übergabestation: Typ, Typschild fotografieren, Parameter inkl. Wandler-/Skalierungsfaktor notieren
  2. Wandlerschild am Zähler fotografieren, Wandlerverhältnis notieren
  3. Zeitgleicher Abgleich Zählerdisplay vs. Live-Wert bei E.ON (Herrn Rohr vorher anrufen)
  4. Hängen die Eingänge K1–K4 der PMU an der Steuerbox oder nur am Rundsteuerempfänger FTY 263?
  5. Reparatur KV2: Isolationsmessung je Leiter nach Tausch, KV2 wieder am Netz?

## Ausliefern vorbereiten
- Release-Zweig `release-2026-11-19-steinpleis` (enthält `modulanzahl` + Import) und `scripts/steinpleis-online.sh` nach Muster `betrieb-online.sh`: Vorprüfung (echter Betrieb vorhanden), Sicherung von Daten und Zweig, Auslieferung nach `/root/pv-monteur-live`, `pm2 reload pv-monteur` (Oberfläche für Modulanzahl), Gesundheitsprüfung, dann Import mit Fotos aus einem frischen `git pull` des Übergabe-Repos (Pfad auf dem Server ermitteln), Rückweg bei Fehler.
- Tests: Import mit Attrappen-Datenpfad (Anlegen, Doppelschutz, Betrieb fehlt, Auftrag vorhanden → kein zweiter).

# Abnahmekriterien
- Werkzeug, Tests grün, Release-Zweig und Skript bereit.
- Unter „Offen für Andre“ genau **ein** Befehl mit ` #` am Ende, mit dem Hinweis, dass vorher `betrieb-online.sh` gelaufen sein muss.
