---
status: teilweise
vorschau_url:
commits: 68631003, ae73d88b
---
## Umgesetzt
- Zweig `steinpleis-import` auf `modulanzahl`. Der Release-Zweig `release-2026-11-19-steinpleis` steht auf ae73d88b und enthält `modulanzahl`, `release-2026-11-19-betrieb` und `release-2026-11-19-cockpit`.
- **`tools/unterlagen-import.js`**:
  - Angaben: `--firma-name`/`--firma`, `--auftragsnummer`/`--auftrag-anlegen <json>`, `--ordner … --art … --titel …` (mehrfach möglich). `Bestandsfoto` wird als `foto_anlage` abgelegt.
  - Die Bilder landen als Unterlagen der **Anlage** zum Auftrag, über den vorhandenen Eingang `nimmPlanAuf`. Dort laufen die üblichen Prüfungen, und EXIF/GPS wird bereinigt. Fehlt die Anlage, legt das Werkzeug sie an (mit `auftrag_id`, Wechselrichter Power-One Aurora). Keine Befunde, keine Messwerte.
  - Aufnahmedatum aus EXIF. Weil die Bereinigung EXIF entfernt, steht es im Titel, z. B. „Bestand Anlage – 14.08.2026 10:30 – IMG_9484.jpg“.
  - Doppelte Bilder werden über die SHA-256 der Originaldatei erkannt und übersprungen.
  - Bricht ab, wenn der Betrieb fehlt („erst `scripts/betrieb-online.sh` ausführen“), und ebenso ohne Leitungs-Zugang oder ohne `PVM_ANLAGENDATEN=an`.
  - Am Ende gibt es die Auftragsnummer und die Anzahl abgelegter und übersprungener Bilder aus.
- **`tools/steinpleis-auftrag.json`**: Der Auftrag wird nur angelegt, wenn im Betrieb noch keiner „Steinpleis“ enthält.
  - Enthält Kunde, Ansprechpartner, Adresse, 246,89 kWp, Status `planung` und die Teilflächen 56,42 / 83,72 / 106,75 kWp ohne Modulleistung.
  - Prüfanlass Fehlersuche und der E.ON-Hinweis stehen in der Notiz und in `anlass_hinweis`.
  - Termin 20.11.2026, 08:00, 240 min, „Prüfung Fernsteuerbarkeit, Übergabestation“, die fünf Prüfpunkte in der Notiz.
- **Tests** `tests/unterlagen-import.test.js` gegen einen Attrappen-Datenpfad: **4 von 4 grün** (`timeout 300`). Abgedeckt sind:
  - Betrieb fehlt → Abbruch;
  - EXIF-Datum lesen;
  - Anlegen samt Anlage und Termin, Modulleistung bleibt leer;
  - Doppelschutz über zwei Ordner;
  - zweiter Lauf → kein zweiter Auftrag, Termin oder Anlage, nur das neue Bild kommt dazu;
  - Aufruf per Auftragsnummer;
  - Riegel zu → Abbruch.
- **`scripts/steinpleis-online.sh`** nach dem Muster von `betrieb-online.sh`, nicht ausgeführt. Ablauf:
  1. Vorprüfung: echter Betrieb vorhanden, `PVM_ANLAGENDATEN=an`, Übergabe-Repo gefunden, Live-Stand im Release enthalten.
  2. Sicherung von Daten, `.env` und Zweig.
  3. Release nach `/root/pv-monteur-live` und `pm2 reload pv-monteur`.
  4. Gesundheitsprüfung inkl. `/js/db/modulanzahl.js`.
  5. `git pull --ff-only` im Übergabe-Repo und Import.
  - Bei Fehler vor dem Import: zurück auf den vorherigen Zweig, Reload, Gesundheitsprüfung.

**Nicht geprüft:** Den Probelauf mit den 61 echten Fotos gegen eine Attrappe hat die Freigabe hier nicht zugelassen. Ob alle Fotos die Bereinigung bestehen und ein EXIF-Datum haben, ist also offen. Auch die Syntaxprüfung (`bash -n`) des Skripts wurde nicht zugelassen, es ist ungetestet. Der Probelauf liegt als `scratchpad/steinpleis-probe.sh` bereit.

## Offen für Andre
- Der Import setzt `PVM_ANLAGENDATEN=an` in `/root/pv-monteur-live/.env` voraus, für die Fotoart `foto_anlage`, bis zu 100 Unterlagen je Anlage und die Modulanzahl-Oberfläche. In der Live-`.env` fand ich keinen Eintrag dazu (die Datei war womöglich nur nicht lesbar). Fehlt er, stoppt das Skript in der Vorprüfung. Das Eintragen ist ein `.env`-Eingriff und bleibt bei dir.
- Vorher muss `betrieb-online.sh` gelaufen sein, damit es den echten Betrieb „PV Performance Pro“ gibt. Danach:

`bash <(git -C /root/pv-monteur show release-2026-11-19-steinpleis:scripts/steinpleis-online.sh) release-2026-11-19-steinpleis #`

## Fragen an Claude Desktop
1. **Inbetriebnahme:** Bekannt ist nur 2011. Damit die Vorschläge im Bereich 230–280 Wp liegen (260/250), habe ich `datum_ibs` auf 2011-01-01 gesetzt und das in der Notiz als Platzhalter vermerkt. Ist das so recht?
2. **Azimut und Neigung:** Die Teilflächen verlangen beide Werte. Ich habe Platzhalter 180°/0° eingetragen, ebenfalls in der Notiz vermerkt. Sind die echten Werte bekannt?
3. **Foto-Art:** „Art Dach/Carport“ hat am Auftrag kein eigenes Feld, sie steht in der Notiz und in `anlass_hinweis`. Das Bestandsfoto wird als vorhandene Art „Foto der Anlage“ (`foto_anlage`) abgelegt, weil es keine eigene Art „Bestandsfoto“ gibt. Passt das?
