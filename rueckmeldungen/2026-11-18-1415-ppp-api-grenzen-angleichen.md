---
status: erledigt
vorschau_url:
commits: 692f102
---
## Umgesetzt
Die Feldgrenzen in `ppp-api/src/pruefauftrag.js` stimmen jetzt mit PV-Monteur überein. Gelesen habe ich sie aus `/root/pv-monteur/lib/leistungscheck-eingabe.js`; der Router `routes/leistungscheck.js` gibt die Prüfung dorthin weiter. Wo ppp-api strenger war, bleibt es so.

`npm test` läuft mit 102 von 102 Tests grün. Zur Gegenprobe habe ich einen Rumpf, der an jeder Grenze genau den erlaubten Höchst- oder Mindestwert hat, durch den echten Prüfer von PV-Monteur geschickt; er wird angenommen. `pm2 reload ppp-api` ist gelaufen, der Dienst ist online und `/api/leistungscheck/gesund` antwortet mit 200.

**Geänderte Grenzen (vorher → jetzt):**

| Feld | vorher | jetzt |
|---|---|---|
| eigentuemer.telefon | 5–50 Zeichen, Punkt erlaubt | 6–30 Zeichen, nur Ziffern, `+ / - ( )` und Leerzeichen |
| eigentuemer.name | 2–200 | 2–120 |
| eigentuemer.email | Endung ab 1 Zeichen | Endung ab 2 Zeichen (wie PV-Monteur) |
| anlage.adresse | 5–300 | 5–200 (Mindestlänge 5 von ppp bleibt, PV-Monteur verlangt nur 3) |
| anlage.lat / anlage.lon | freiwillig | **Pflicht** (wie PV-Monteur) |
| anlage.kwp | 0,1–100 000 | 0,1–10 000 |
| anlage.inbetriebnahme_jahr | 1980 bis laufendes Jahr + 1 | 1980 bis laufendes Jahr |
| anlage.teilflaechen | höchstens 50 | höchstens 20 |
| teilflaechen[].azimut | −180…360 | −180…180 |
| teilflaechen[].kwp | 0–100 000 | 0,01–10 000 |
| einschaetzung.stufe | freiwillig | **Pflicht** (wie PV-Monteur) |
| einschaetzung.performance | 0–10 | 0–5 |
| einschaetzung.ursachen | 20 × 200 Zeichen | 10 × 80 Zeichen |
| einschaetzung.pruefpunkte | 30, Ursache 200, Prüfung 1000 | 20, Ursache 80, Prüfung 500 |
| wunschtermin | höchstens 500 | höchstens 300 |
| einwilligung.zeitpunkt | 1–40 | 10–40 |

**Weitere Änderungen:**
- **Textbereinigung wie PV-Monteur:** Unicode-Normalform, Steuerzeichen entfernt, Leerraum zusammengefasst. Die Länge zählt erst danach, damit beide Seiten gleich messen. Weitergeleitet wird der bereinigte Text.
- **Fehlermeldungen:** Sie sind deutsch und nennen das Feld, zum Beispiel `Angabe „anlage.teilflaechen[0].azimut“ muss eine Zahl zwischen -180 und 180 sein.` Die Antwort enthält zusätzlich `feld`, damit die Website das Eingabefeld markieren kann.
- **Ablehnung durch PV-Monteur:** Lehnt PV-Monteur einen Auftrag mit 400 ab, gibt ppp-api dessen Meldung und `feld` weiter.
- **Tests:** Für jede Grenze prüft ein Test, dass der Grenzwert durchgeht und der Wert knapp darüber mit 400 und dem richtigen Feld abgewiesen wird. Dazu kommen ein Test zur Bereinigung und einer zur Weitergabe von `feld`.

## Offen für Andre
- **Live-Probe ging nicht bis zur Feldprüfung:** Ein Prüfauftrag an den Live-Dienst endet mit 503 „Prüfaufträge sind gerade nicht möglich.“. Der Grund ist vermutlich, dass `PVM_LC_SCHLUESSEL` in der Umgebung des laufenden Dienstes fehlt; die Schlüsselprüfung kommt vor der Feldprüfung. Den Schlüssel setze ich nicht, das ist ein Secret. Nach dem Eintragen ist `pm2 reload ppp-api --update-env` nötig.

## Fragen an Claude Desktop
1. **Pflichtfelder lat, lon und stufe:** Die Website schickt `lat`, `lon` und `stufe` als `null`, wenn sie fehlen (`Leistungscheck.jsx:440, 441, 448`). Solche Aufträge werden jetzt mit „Angabe … fehlt.“ abgewiesen; vorher hätte PV-Monteur sie genauso abgelehnt. Soll die Website den Prüfauftrag nur anbieten, wenn Standort und Stufe bekannt sind?
2. **Kleine Teilflächen:** Die Website rundet die kWp der Teilflächen auf zwei Nachkommastellen (`Leistungscheck.jsx:445`). Eine sehr kleine Teilfläche kann dadurch 0 werden und wird dann abgewiesen, weil das Minimum jetzt 0,01 ist. Soll die Website solche Teilflächen weglassen?
3. **Neues Feld `feld`:** Soll die Website `feld` aus der Fehlerantwort auswerten und das passende Eingabefeld markieren? Bisher zeigt sie nur den Text aus `fehler` an.
