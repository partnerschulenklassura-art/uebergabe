# Schnittstelle Leistungscheck ⇄ PV-Monteur (Vertrag, Fassung 1, 18.11.2026)

Beteiligte: **ppp-api** (`/var/www/eid/ppp-api`, Port 3140, „Leistungscheck“) und **PV-Monteur** (`/root/pv-monteur`, live `/root/pv-monteur-live`, Port 3821). ppp-api ruft PV-Monteur **intern** über `http://127.0.0.1:3821` auf. Der Browser spricht nie direkt mit PV-Monteur.

## Entscheidungen (Antworten auf die Fragen aus der Bestandsaufnahme)
1. **Mandant:** Schlüssel je Betrieb, wie vorgeschlagen. Vorerst gibt es genau einen: für Andres eigenen Betrieb (Prüfung und Wartung durch PV Performance Pro). Partnerbetriebe bekommen später eigene Schlüssel; die Zuteilung wählt dann ppp-api.
2. **Leistungscheck = ppp-api**, Aufruf intern über 127.0.0.1:3821.
3. **Rückgabe ohne Messwerte:** nur Status, Befunde (Katalogangaben), Urteil je Messpunkt (ohne Zahlenwert), `abdruck` und `verifikationskennung`. Messwerte bleiben in PV-Monteur und im PDF.
4. Feldnamen und Status unten sind verbindlich.

## Schlüssel
- Format `pvm_lc_<praefix8>_<geheim32>`; PV-Monteur speichert nur Präfix und SHA-256 des ganzen Schlüssels im Bestand `schnittstellenschluessel` (firma_id, praefix, hash, aktiv, gesperrt_am, letzte_nutzung, erstellt_von).
- Ausstellen durch die Leitung (einmal anzeigen). Für den Start zusätzlich ein Kommandozeilen-Werkzeug `node tools/schluessel-ausstellen.js --firma <id>` (gibt den Schlüssel einmal aus).
- ppp-api liest ihn aus der Umgebungsvariable `PVM_LC_SCHLUESSEL` (`.env`, nicht im Repo).
- Schalter in PV-Monteur: `PVM_LEISTUNGSCHECK=an` (Vorgabe aus → alle Endpunkte 404).

## 1. Prüfauftrag anlegen
`POST /api/v1/leistungscheck/pruefauftraege` — Kopf `Authorization: Bearer pvm_lc_…`, `Content-Type: application/json`, Rumpf höchstens 32 KB.

```json
{
  "fremdnummer": "LC-20261118-AB12",
  "eigentuemer": { "name": "…", "telefon": "…", "email": "…" },
  "anlage": {
    "adresse": "Straße Nr, PLZ Ort", "lat": 50.73, "lon": 12.35,
    "art": "dach|frei", "kwp": 30, "inbetriebnahme_jahr": 2012,
    "teilflaechen": [{ "azimut": 0, "neigung": 30, "kwp": 30 }]
  },
  "einschaetzung": {
    "stufe": "gut|auffaellig|schlecht", "performance": 0.76,
    "soll_kwh": 32860, "ist_kwh": 25000,
    "zerlegung": { "alterung": 1500, "planung": 0, "ac": 2088, "rest": 5772 },
    "ursachen": ["AC-Seite", "Wechselrichter", "Ausgefallener String"],
    "pruefpunkte": [{ "ursache": "AC-Seite", "pruefung": "Isolationswiderstand je Leiter, …" }],
    "protokoll_pruefsumme": "<sha256 hex>"
  },
  "wunschtermin": "freier Text, optional",
  "einwilligung": { "datenschutz": true, "zeitpunkt": "2026-11-18T12:00:00Z", "fassung": "ppp-datenschutz-2026-11-17" }
}
```

- PV-Monteur legt `auftraege` an: kunde=eigentuemer.name, adresse, lat/lng, leistung_kwp, teilflaechen, `fremdnummer`, `fremdnummer_stelle='leistungscheck'`, status `planung`, Prüfanlass `fehlersuche` (bzw. passender Wert aus `enums.js`).
- Die Einschätzung kommt **nur** als gekennzeichneter Anlass-Hinweis (`anlass_hinweis` mit `herkunft: 'leistungscheck'`, Text + Zerlegung + Prüfpunkte), nie in messwerte, Grenzwerte oder befunde (Regel R1). Kontaktdaten des Eigentümers in die vorhandenen Felder.
- Gleiche `fremdnummer` noch einmal → dieselbe Antwort (200), kein zweiter Auftrag.
- Die Leitung des Betriebs bekommt eine E-Mail „Neuer Prüfauftrag aus dem Leistungscheck“ mit Auftragsnummer (vorhandenes nodemailer).
- Antwort `201`:
```json
{ "auftragsnummer": "PV-2026-0042", "fremdnummer": "LC-20261118-AB12", "status": "angelegt",
  "eigentuemer_liefert": ["Zugang zur Anlage …", "Datenblätter, Stringplan, IBS-Protokoll …", "Zählerstände oder Abrechnungen der letzten zwölf Monate …", "Terminvorschlag und Zustimmung zur Abschaltung …"] }
```
  `eigentuemer_liefert` erzeugt PV-Monteur aus Anlass und Prüfpunkten (feste Textbausteine, keine KI).
- Fehler: 400 (Feld + Grund), 401 (Schlüssel), 404 (Schalter aus), 413, 429, 500 – immer `{ "fehler": "…" }`.

## 2. Status abfragen
`GET /api/v1/leistungscheck/pruefauftraege/:fremdnummer` — gleicher Schlüssel, nur Aufträge der eigenen Firma.

```json
{
  "fremdnummer": "…", "auftragsnummer": "…",
  "status": "angelegt|terminiert|in_pruefung|abgeschlossen|neue_fassung",
  "termin": "2026-11-25T08:00:00+01:00 | null",
  "fassung": 1, "abdruck": "<sha256>", "verifikationskennung": "…",
  "befunde": [{ "befund_id": "…", "label": "…", "schwere": "hoch", "sicherheitsklasse": "erheblich", "massnahme": "…", "ebene": "AC" }],
  "urteile": [{ "messpunkt_id": "…", "urteil": "in_ordnung|befund|gefahr|nicht_bewertbar" }]
}
```
Status auf dem Server abgeleitet: angelegt → terminiert (Termin vorhanden) → in_pruefung (Protokoll offen) → abgeschlossen (Protokoll abgeschlossen) → neue_fassung. Befunde/Urteile/abdruck nur aus der neuesten abgeschlossenen Fassung.

## 3. Hinweis an ppp-api (Webhook)
Nach erfolgreichem Schreiben bei: Termin gesetzt, Protokoll abgeschlossen, neue Fassung.
`POST http://127.0.0.1:3140/api/leistungscheck/pvm-hinweis`, Kopf `PVM-Signatur: t=<unix>,v1=<hex HMAC-SHA256(t + "." + rumpf, PVM_LC_WEBHOOK_GEHEIMNIS)>`, Rumpf
`{ "ereignis": "terminiert|abgeschlossen|neue_fassung", "fremdnummer": "…", "auftragsnummer": "…", "fassung": 1, "abdruck": "…", "zeitpunkt": "…" }`.
Warteschlange, bis zu 5 Wiederholungen, keine Weiterleitungen, Toleranz 5 Minuten. Geheimnis in beiden `.env` als `PVM_LC_WEBHOOK_GEHEIMNIS`; Ziel-URL in PV-Monteur als `PVM_LC_WEBHOOK_URL`.

## 4. ppp-api nach außen (für die Website)
- `POST /api/leistungscheck/pruefauftrag` – Rumpf wie oben ohne Schlüssel, plus Honeypot-Feld `website` (muss leer sein). Prüft Pflichtfelder, Einwilligung, Größe, 5 Anfragen pro Stunde je IP. Leitet an PV-Monteur weiter. Antwort `{ auftragsnummer, fremdnummer, eigentuemer_liefert, statuslink }`, `statuslink` = `/leistungscheck/status/?n=<fremdnummer>&t=<token>`.
- `GET /api/leistungscheck/pruefauftrag/:fremdnummer?t=<token>` – fragt PV-Monteur und gibt Status, Termin, Befunde und Urteile zurück.
- `POST /api/leistungscheck/pvm-hinweis` – prüft die Signatur, merkt sich den letzten Status.
- ppp-api speichert je Auftrag nur `fremdnummer`, SHA-256 des Tokens (bis 5), SHA-256 der Protokoll-Prüfsumme (zur Unterscheidung echter Wiederholung von erratener Nummer; gleiche Nummer + andere Prüfsumme → 409), letzten Status und Zeitpunkte (`data/pruefauftraege.json`). **Keine Namen, keine Kontaktdaten, keine Adresse** – die liegen nur in PV-Monteur.

## Ergänzungen 18.11.2026
- Honeypot ausgefüllt → 400 mit klarer Meldung (keine Schein-Bestätigung).
- Website weicht bei 404, 409 und 503 auf den E-Mail-Weg aus.
- Ein Fehler beim Mailversand an die Leitung darf das Anlegen des Prüfauftrags nicht verhindern (Auftrag anlegen, Mail in die Warteschlange bzw. Fehler protokollieren, Antwort 201).
- Keine eigene Vorschau-Instanz; getestet wird mit Tests und nach dem Livegang mit einem Testauftrag LC-TEST-….

## 5. Ergänzung Fassung 2 (18.11.2026): Bauteile als Vorschlag
Im Rumpf von `POST …/pruefauftraege` (und in ppp-api `POST /api/leistungscheck/pruefauftrag`) darf zusätzlich **optional** ein Block `komponenten` stehen. Fehlt er, ändert sich nichts (abwärtskompatibel).

```json
"komponenten": {
  "herkunft": "eigentuemer",
  "module": [{ "hersteller": "…", "modell": "…", "typ": "mono|poly|duenn|unbekannt", "wp": 250, "anzahl": 120,
               "uoc": 37.8, "vmpp": 30.5, "impp": 8.2, "tk_uoc": -0.31 }],
  "wechselrichter": [{ "hersteller": "…", "modell": "…", "kw_ac": 20, "anzahl": 1, "umax_dc": 1000, "mpp_min": 200, "mpp_max": 800,
                       "strings": [{ "modul_index": 0, "module_je_string": 20, "anzahl": 3 }] }],
  "kabel": [{ "seite": "dc|ac", "bezeichnung": "…", "querschnitt_mm2": 4, "laenge_m": 25, "leiter": "cu|al",
              "kabeltyp": "solar|nym|nyy|h07rn|sonstig|unbekannt" }],
  "steckverbinder_gemischt": true
}
```
Grenzen: je Liste höchstens 20 Einträge, `strings` höchstens 20 je Gerät, Texte höchstens 80 Zeichen (bereinigt wie die übrigen Texte), Zahlen: wp 1–1000, anzahl 1–100 000, uoc/vmpp 1–200, impp 0,1–30, tk_uoc −1…0, kw_ac 0,1–10 000, umax_dc 50–2000, mpp 0–2000 (mpp_min < mpp_max), module_je_string 1–100, querschnitt_mm2 0,5–1000, laenge_m 0,1–5000. Alle Zahlenfelder optional. Unbekannte Schlüssel → 400 mit `feld`.

**Regel R1 gilt weiter:** PV-Monteur legt den Block **nur** als `komponenten_vorschlag` am Auftrag ab, mit `herkunft: 'leistungscheck-eigentuemer'`, Zeitpunkt und `ungeprueft: true`. Er geht **nicht** automatisch in Anlagen-Stammdaten, Stringpläne, Messwerte, Grenzwerte oder Befunde. In der Auftragsansicht erscheint er als „Angaben des Eigentümers (ungeprüft)“; übernehmen kann ihn nur ein Mensch (spätere Ausbaustufe, nicht Teil dieser Fassung).

Die Befunde der Website (z. B. „NYM-Leitung auf der DC-Seite“) kommen **nicht** als `befunde`, sondern wie bisher nur als Text in `einschaetzung.ursachen`/`pruefpunkte`.
