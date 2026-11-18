Ich habe das Skript nur gelesen und gegen den Server geprüft, nichts ausgeführt und nichts geändert. Das Skript taugt grundsätzlich, braucht aber eine Pflichtkorrektur: Schritt 7 würde mit dem Testrumpf an der Telefonnummer scheitern. `bash -n` wurde mir von der Rechteverwaltung verweigert und lief deshalb nicht.

## Ergebnis je Prüfpunkt

1. **Auslieferungsskript:** `scripts/auslieferung-leistungscheck.sh` liegt in `/root/pv-monteur` und kann von dort mit `release-2026-11-18-lc` aufgerufen werden. Es wechselt selbst nach `/root/pv-monteur-live`, und weil das ein Worktree desselben Repos ist, sieht es den Zweig dort auch. Es startet `scripts/pm2-live-start.sh`, das PM2 `pv-monteur` löscht und mit `--update-env` frisch startet. `server.js` liest beim Start per dotenv die `.env`, die neue `.env` wird also gelesen.
2. **`.env` und Gesundheitsweg:** PV-Monteur läuft unter PM2 mit Arbeitsordner `/root/pv-monteur-live` und liest deshalb `/root/pv-monteur-live/.env`. `GET /api/gesundheit` gibt es im Release-Zweig, der Weg stimmt.
3. **`data/firmen.json`:** Die Live-Datei hat die Form `{eintraege:[…]}` mit 1 Eintrag, der `id` und `name` hat. Das `node -e` im Skript passt. `PVM_DATEN_PFAD` ist weder in der `.env` noch in PM2 gesetzt, `./data` ist also richtig.
4. **Schlüssel-Werkzeug:** Das Werkzeug schreibt nur den Schlüssel `pvm_lc_<8 hex>_<32 hex>` auf stdout, den Hinweis mit dem Präfix auf stderr. Das grep findet deshalb den ganzen Schlüssel. Es wechselt selbst in seinen eigenen Projektordner, muss also aus `/root/pv-monteur-live` laufen; nach dem Checkout in Schritt 3 liegt es dort.
5. **401 ohne Schlüssel:** Ja. Die Reihenfolge im Router ist Schalter (404), dann Zähler (429), dann Schlüssel (401). Mit `PVM_LEISTUNGSCHECK=an` kommt ohne Schlüssel 401 zurück; die Schnittstelle hängt in `server.js` unter `/api/v1/leistungscheck`.
6. **Test-Rumpf:** Honeypot (`website:""`), Prüfsumme (SHA-256, 64 Zeichen), Einwilligung und alle Pflichtfelder passen. **Aber** `"telefon":"000"` wird abgelehnt: ppp-api verlangt mindestens 5 Zeichen, PV-Monteur mindestens 6. Der Testauftrag endet so mit 400.
7. **Weitere Fallstricke:**
   - In Zeile 70 beendet sich das Skript wegen `set -e`/`pipefail` ohne Meldung, wenn das grep nichts findet; die STOPP-Meldung in Zeile 71 wird nie erreicht.
   - Schritt 5 gibt „ppp-api läuft“ aus, ohne den Gesundheitsweg wirklich zu prüfen.
   - Der Stichtag `GILT_AB` im Zweig ist `2026-11-18T12:39:16Z`. Das Auslieferungsskript lässt nur 48 h zu, das Skript muss also **vor dem 20.11.2026, 12:39 UTC** laufen.
   - Unkritisch: Beide Dienste laufen als root (`chmod 600` stört nicht). Der Live-Baum hat keine Änderungen. PM2 hält keine `PVM_LC_*`-Variablen, die die `.env` überdecken würden. `rsync --delete` löscht nur alte Asset-Dateien.

## Nötige Korrekturen in `projekte/ppp/stufe4/pruefauftrag-online.sh`

**Zeile 90 (Pflicht):**
```
alt: {"fremdnummer":"$NUM","website":"","eigentuemer":{"name":"TEST Leistungscheck (bitte löschen)","telefon":"000","email":"info@photovoltaikperformancepro.com"},
neu: {"fremdnummer":"$NUM","website":"","eigentuemer":{"name":"TEST Leistungscheck (bitte löschen)","telefon":"0000000000","email":"info@photovoltaikperformancepro.com"},
```

**Zeile 70 (empfohlen, damit die STOPP-Meldung erscheint; das Muster ist zugleich strenger):**
```
alt: SCHLUESSEL=$(node tools/schluessel-ausstellen.js --firma "$FIRMA" | grep -oE 'pvm_lc_[A-Za-z0-9_-]+' | head -1)
neu: SCHLUESSEL=$(node tools/schluessel-ausstellen.js --firma "$FIRMA" | grep -oE '^pvm_lc_[0-9a-f]{8}_[0-9a-f]{32}$' | head -1) || true
```

**Zeile 80 (empfohlen, echte Prüfung statt fester Ausgabe):**
```
alt: echo "   ppp-api läuft"
neu: curl -fsS --max-time 5 http://127.0.0.1:3140/api/leistungscheck/gesund >/dev/null && echo "   ppp-api läuft" || { echo "   STOPP: ppp-api antwortet nach Reload nicht. Rückweg: .env aus $SICHER zurück, pm2 reload ppp-api --update-env"; exit 1; }
```

---
status: erledigt
vorschau_url:
commits:
---
## Umgesetzt
- Alle sieben Prüfpunkte am Server geprüft: Skript, Auslieferungs- und Rückweg-Skript, `pm2-live-start.sh` in `/root/pv-monteur-live`, Release-Zweig `release-2026-11-18-lc`, `firmen.json` (nur die Form), PM2-Liste und PM2-Umgebung (nur Namen), ppp-api `server.js`/`app.js`/`pruefauftrag.js`, `rsync` nur als Trockenlauf.
- Ergebnis: eine Pflichtkorrektur (Telefon im Test-Rumpf) und zwei empfohlene (Zeile 70 und 80), siehe oben.
- `bash -n` lief nicht, weil die Rechteverwaltung den Aufruf verweigert hat.
- Nichts ausgeführt, nichts geändert. Keine Commits, weil keine Änderung in `/root/pv-monteur` nötig war.

## Offen für Andre
- Skript **vor dem 20.11.2026, 12:39 UTC** ausführen. Danach bricht `auslieferung-leistungscheck.sh` am Stichtag ab, und die Stichtage im Zweig müssen neu gesetzt werden.
- `scripts/pm2-live-start.sh` gibt es nur unversioniert in `/root/pv-monteur-live`; im Repo wurde es am 04.11. entfernt. Es funktioniert, sollte aber gesichert oder wieder versioniert werden.
- Die `.env`-Änderungen aus Schritt 2 bleiben stehen, wenn Schritt 3 vorher abbricht. Das ist harmlos, weil `release-2026-11-15c` den Schalter nicht kennt und ppp-api erst in Schritt 5 neu lädt.

## Fragen an Claude Desktop
- Die Feldgrenzen von ppp-api und PV-Monteur weichen voneinander ab. Bei Eingaben, die nur ppp-api zulässt, bekommt die Website ein 400, das PV-Monteur durchreicht. Beispiele:
  - Telefon: ppp-api erlaubt einen Punkt, PV-Monteur nicht; Länge 5–50 gegen 6–30.
  - Azimut: bis 360 gegen bis 180.
  - Teilflächen: höchstens 50 gegen höchstens 20.
  - Ursachen: 20 Einträge mit je 200 Zeichen gegen 10 mit je 80.
  - Performance: bis 10 gegen bis 5.
  - Weitere kleinere Abweichungen bei `adresse`, `name`, `wunschtermin` und `inbetriebnahme_jahr` (ppp-api erlaubt Jahr+1).
  
  Sollen die Grenzen in ppp-api an den Vertrag mit PV-Monteur angeglichen werden?
