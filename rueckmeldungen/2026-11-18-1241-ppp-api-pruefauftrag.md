---
status: erledigt
vorschau_url:
commits: c60e803
---
## Umgesetzt
Die drei Endpunkte aus dem Vertrag (Abschnitt 4) laufen in `/var/www/eid/ppp-api`. `npm test` ist grün (99 Tests, davon 17 neue), der Commit ist gemacht und `pm2 reload ppp-api` ist durch. Der Dienst ist gesund (`/gesund` → `{"ok":true}`). Weil es noch keine `.env` gibt, antwortet er live wie vorgesehen: `POST /pruefauftrag` → 503 „Prüfaufträge sind gerade nicht möglich.“, `POST /pvm-hinweis` → 503.

- **`POST /api/leistungscheck/pruefauftrag`** (`src/pruefauftrag.js`):
  - Prüft Pflichtfelder (die Fehlermeldung nennt Feld und Grund), Einwilligung (`datenschutz === true`), Honeypot `website`, Größe (höchstens 32 KB, sonst 413) und 5 Anfragen je Stunde und IP (sonst 429 mit `Retry-After`).
  - Leitet nur die bekannten Felder an `127.0.0.1:3821` weiter, ohne Weiterleitungen und mit 15 s Zeitlimit. Die Antwort ist `{ auftragsnummer, fremdnummer, eigentuemer_liefert, statuslink }`.
  - Ist PV-Monteur aus (404), der Schlüssel falsch (401), PV-Monteur überlastet (429), fehlerhaft (5xx) oder nicht erreichbar, kommt 503. Dann fällt die Website auf E-Mail zurück.
  - Gleiche Nummer mit gleicher Protokoll-Prüfsumme → 200: kein zweiter Auftrag, dafür ein zusätzlicher Statuslink. Der alte Link gilt weiter.
  - Gleiche Nummer mit anderer Prüfsumme → 409. Die Nummer hat nur 4 Zufallszeichen und ist damit erratbar; so bekommt niemand durch Raten einen Zugang.
- **`GET /api/leistungscheck/pruefauftrag/:fremdnummer?t=`**: Ist das Token falsch, fehlt es oder ist die Nummer unbekannt, kommt einheitlich 404, und PV-Monteur wird gar nicht gefragt. Bei passendem Token kommen Status, Termin, Fassung, `abdruck`, `verifikationskennung`, Befunde und Urteile. Die Felder sind fest vorgegeben, Messwerte kommen nie durch. Antwort mit `Cache-Control: no-store`.
- **`POST /api/leistungscheck/pvm-hinweis`**:
  - Prüft die HMAC-Signatur über die Rohbytes des Rumpfs, mit 5 Minuten Toleranz und zeitkonstantem Vergleich. Fehlt oder stimmt die Signatur nicht, kommt 401.
  - Merkt sich den letzten Status. Ein älterer Hinweis überschreibt keinen neueren.
  - Eine unbekannte Nummer bekommt 200 ohne Wirkung, damit PV-Monteur nicht wiederholt.
- **Token und Speicher**:
  - Token: 32 Zufallsbytes base64url, gespeichert nur als SHA-256 (bis 5 je Auftrag), Vergleich zeitkonstant.
  - `data/pruefauftraege.json` enthält keine Namen, Kontaktdaten oder Adressen. Ein Test prüft das.
  - Rumpf-Inhalte stehen nie im Log. Auch Fehler beim Lesen des JSON werden abgefangen, bevor sie geloggt werden.
- **Tests** (`test/pruefauftrag.test.js`) laufen gegen einen nachgebauten PV-Monteur (lokaler Express auf Zufallsport). Abgedeckt sind alle Fälle aus dem Auftrag, dazu gleichzeitiges Doppeln, die 409, abgelaufene und künftige Signaturen sowie ein fehlender Schlüssel.
- `server.js` liest jetzt selbst `.env` aus dem Dienstverzeichnis. `.env` steht in `.gitignore`. README ist ergänzt.

## Offen für Andre
1. Zwei Zeilen in `/var/www/eid/ppp-api/.env`:
   ```
   PVM_LC_SCHLUESSEL=
   PVM_LC_WEBHOOK_GEHEIMNIS=
   ```
   Den Schlüssel stellt PV-Monteur aus (`node tools/schluessel-ausstellen.js --firma <id>`). Das Geheimnis muss derselbe Wert sein wie in der `.env` von PV-Monteur.
2. **Danach reicht `pm2 reload ppp-api`.** `server.js` liest `.env` beim Start selbst; `--update-env` schadet nicht, ist aber nicht nötig. Einzige Ausnahme: Variablen, die in der PM2-Umgebung schon gesetzt sind, haben Vorrang vor `.env`. Das ist im Moment nicht der Fall.
3. PV-Monteur braucht in seiner `.env` noch `PVM_LEISTUNGSCHECK=an`, `PVM_LC_WEBHOOK_URL=http://127.0.0.1:3140/api/leistungscheck/pvm-hinweis` und dasselbe Geheimnis.
4. Nginx, freiwillig:
   - `/api/leistungscheck/pvm-hinweis` könnte man auf 127.0.0.1 beschränken. Er ist ohnehin signiert, nötig ist das also nicht.
   - Für `/leistungscheck/status/` empfehle ich `Referrer-Policy: no-referrer`, weil das Token in der Adresse steht.

## Fragen an Claude Desktop
1. **Honeypot:** Ist er ausgefüllt, kommt 400 mit „Die Anfrage konnte nicht angenommen werden.“ statt einer stillen Schein-Bestätigung. Hintergrund: Füllt der Browser das Feld automatisch aus, sieht ein echter Mensch so eine klare Meldung und keine Bestätigung ohne Auftragsnummer. Passt das?
2. **Zusatzfeld im Speicher:** Ich speichere zusätzlich den SHA-256 der Protokoll-Prüfsumme, um eine echte Wiederholung von einer erratenen Nummer zu unterscheiden. Das ist kein personenbezogenes Datum, steht aber nicht wörtlich in der Feldliste des Vertrags. Bitte bestätigen oder den Vertrag ergänzen.
3. **409 an der Website:** `Leistungscheck.jsx` zeigt eine 409 als allgemeinen Fehler mit dem Text vom Server an. Soll die Seite bei 409 lieber auf den E-Mail-Weg umschalten?
