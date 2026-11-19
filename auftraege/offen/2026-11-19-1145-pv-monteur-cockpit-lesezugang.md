---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-18-1240-pv-monteur-schnittstelle-leistungscheck
---
# Was soll passieren
Andre bekommt ein eigenes **Tagescockpit** (Auftrag `2026-11-19-1146-cockpit-stufe1`, Projekt eid). Das Cockpit braucht aus PV-Monteur einen **reinen Lesezugang** auf die Tagesarbeit. In PV-Monteur wird dafür nichts an Daten geändert.

Bitte im Repo `/root/pv-monteur` auf einem neuen Zweig `cockpit-lesezugang` umsetzen. **Nicht** in `/root/pv-monteur-live` ausrollen, PM2 nicht neu starten.

## 1. Schlüssel
- Gleicher Mechanismus wie beim Leistungscheck (Bestand `schnittstellenschluessel`, nur Präfix und SHA-256). Neu ist ein Feld `art`: `leistungscheck` (bestehende Schlüssel ohne Feld gelten als diese Art) oder `cockpit`.
- Format `pvm_ck_<praefix8>_<geheim32>`. Ein Cockpit-Schlüssel darf **nur** die Cockpit-Endpunkte lesen, ein Leistungscheck-Schlüssel diese **nicht**.
- `node tools/schluessel-ausstellen.js --firma <id> --art cockpit` gibt den Schlüssel einmal aus.
- Schalter `PVM_COCKPIT=an` (Vorgabe aus → alle Cockpit-Endpunkte 404).

## 2. Endpunkte (nur GET, Kopf `Authorization: Bearer pvm_ck_…`)
Nur Daten der Firma des Schlüssels. Antwort immer JSON, Fehler als `{ "fehler": "…" }`.

`GET /api/v1/cockpit/zeitraum?von=JJJJ-MM-TT&bis=JJJJ-MM-TT` (höchstens 62 Tage):
```json
{
  "termine": [{ "id": "…", "titel": "…", "datum": "…", "beginn": "…", "ende": "…", "status": "offen|abgearbeitet|abgesagt",
               "auftragsnummer": "PV-2026-0031", "kunde": "…", "ort": "PLZ Ort", "monteur": "…" }],
  "auftraege_termin": [ /* Aufträge mit Feld termin/beginn im Zeitraum, gleiche Kurzform */ ]
}
```

`GET /api/v1/cockpit/offen`:
```json
{
  "ohne_termin": [{ "auftragsnummer": "…", "kunde": "…", "ort": "…", "status": "…", "erstellt_am": "…", "fremdnummer_stelle": "leistungscheck|…" }],
  "folgemessungen": [{ "id": "…", "auftragsnummer": "…", "verfahren": "…", "frist": "…", "zustand": "offen|verfristet" }],
  "tickets": [{ "id": "…", "auftragsnummer": "…", "status": "offen|in_arbeit", "schwere": "kritisch|hoch|mittel|niedrig", "titel": "…" }],
  "naechste_pruefungen": [{ "auftragsnummer": "…", "kunde": "…", "naechste_pruefung": "…" }]
}
```
- `ohne_termin`: Aufträge, die nicht `fertig` sind und keinen offenen Termin haben.
- `naechste_pruefungen`: aus abgeschlossenen Protokollen (`naechste_pruefung`) innerhalb der nächsten 120 Tage.
- **Keine Messwerte, keine Befundfotos, keine Kontaktdaten** (Telefon, E-Mail) in den Antworten. Name des Kunden und PLZ/Ort reichen; die Akte öffnet Andre in PV-Monteur selbst. Jede Zeile bekommt dafür `link`: die URL der Auftragsseite in PV-Monteur.
- 60 Aufrufe pro Minute je Schlüssel.

## 3. Tests
- Tests für Schlüsselart (Cockpit-Schlüssel auf Leistungscheck-Endpunkt → 401 und umgekehrt), Mandantentrennung, Schalter aus → 404, Zeitraum > 62 Tage → 400, keine Kontaktdaten in der Antwort.
- Die betroffenen Teile der Testsuite laufen lassen (`npm run test:teil …`), Ergebnis in die Rückmeldung.

## 4. Für Andre vorbereiten (nicht selbst ausführen)
- Ein Skript `scripts/cockpit-online.sh`, das wie beim Leistungscheck mit Sicherung ausrollt: Zweig nach `/root/pv-monteur-live`, `PVM_COCKPIT=an` in die `.env`, Schlüssel ausstellen und **nur** in `/var/www/eid/cockpit/.env` als `PVM_COCKPIT_SCHLUESSEL` schreiben (nicht auf dem Bildschirm ausgeben), `pm2 reload pv-monteur --update-env`, Gesundheitsprüfung, Rückweg bei Fehler.
- In der Rückmeldung den **einen** Befehl für Andre nennen (mit ` #` am Ende).

# Abnahmekriterien
- Zweig `cockpit-lesezugang` mit Endpunkten, Schlüsselart und Tests; Tests grün.
- Live-PV-Monteur unverändert.
- Skript `scripts/cockpit-online.sh` liegt bereit, Befehl für Andre steht in der Rückmeldung.
