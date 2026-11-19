Läuft noch – ich warte auf die Benachrichtigung.

---
status: erledigt
vorschau_url:
commits: 6764bc9f, 32084521, dc8f57c4
---
## Umgesetzt
Zweig `modulanzahl` ist von `release-2026-11-19-betrieb` abgezweigt (956dc8ee) und steht für den Auftrag …1411… bereit. Nichts ist ausgeliefert, PM2 und .env sind unberührt.

**Was schon vorhanden war** (Arbeit vom 12. und 13.11., hinter dem Schalter `PVM_ANLAGENDATEN`):
- Am Auftrag gibt es „Leistung je Modul (kWp)“ (`modul_kwp`). Daraus rechnet die Maske die Gesamtzahl der Module und lässt Handeinträge zu (`baustellen-modulzahl.js`).
- Teilflächen haben schon eine eigene Leistung in kWp. Die Maske rechnet je Teilfläche die Modulzahl live mit. Teilanlagen können eine eigene Modulleistung haben.
- Ging die Rechnung nicht auf, kam bisher nur „— nachprüfen“, mit einer Toleranz von 1e-6.
- Die Rechnung lief nur im Browser. Es gab keine reine Funktion in `lib/`, keine Prüfung beim Speichern, keine Modulleistung je Teilfläche, keine Vorschläge und keine Summenprüfung in kWp.

**Neu:**
- **Reine Rechenfunktion:** Sie steht in `public/js/db/modulanzahl.js`, der Einstieg für den Server ist `lib/modulanzahl.js`. Die Datei liegt unter `public/`, damit der Browser dieselbe Funktion laden kann; so ist es auch schon bei `lib/feldschema.js` gelöst. Sie setzt alle sechs Regeln um:
  - Rechnung je Teilfläche, sonst aus `leistung_kwp`
  - Toleranz ±0,02 Modul mit dem vorgegebenen Warntext
  - Vorschläge von 50 bis 700 Wp in 5-Wp-Schritten, sortiert nach Baujahr, höchstens 5
  - Summenprüfung mit Grenze 0,5 %
  - Hinweis, wenn ein Handeintrag von der Rechnung abweicht
- **Server:** Das Feld `modul_wp` an der Teilfläche ist jetzt erlaubt (größer als 0, höchstens 2000 Wp, hinter dem Schalter wie `kwp`). Beim Speichern läuft dieselbe Rechnung. Die Warnungen landen im neuen Feld `modulanzahl_hinweis` am Auftrag, das nur der Server schreiben kann. Gespeichert wird trotzdem immer.
- **Maske:** Jede Teilfläche hat ein Feld „Modulleistung (Wp)“. Ist es leer, gilt die Leistung je Modul des Auftrags. Beim Tippen erscheinen sofort:
  - die gerechnete Anzahl, die Warnung und der Hinweis zum Handeintrag
  - ohne Modulleistung die Vorschläge als Knöpfe, ein Klick übernimmt den Wert
  - unter den Teilflächen die Gesamtzahl und die Summenwarnung

  Eine Änderung am Inbetriebnahme-Datum ordnet die Vorschläge neu.
- **Tests:** Die neuen Tests in `tests/modulanzahl.test.js` sind grün. Sie decken ab:
  - Steinpleis 217/322/427, gesamt 966
  - glatt und nicht glatt, Toleranz
  - Vorschläge für Baujahr 2011: 260 Wp für KV1 und KV2, 250 Wp für KV3
  - Summenprüfung, Handeintrag, Prüfung beim Speichern

  Dazu liefen die betroffenen Oberflächen- und Servertests gezielt mit `timeout 300`: 64 bestanden, 0 fehlgeschlagen. Die Gesamtsuite lief nicht.

## Offen für Andre
- Damit Maske und Server-Prüfung wirken, muss `PVM_ANLAGENDATEN=an` in der Umgebung gesetzt sein. Ob das auf Vorschau und live schon so ist, habe ich nicht geprüft.
- `modulanzahl_hinweis` wird gespeichert, aber noch nirgends außerhalb des Formulars angezeigt, etwa in Auftragsliste oder Akte. Das wäre ein Folgeauftrag.
- Die Teilanlagen nutzen dieselbe Teilflächen-Zeile und bekommen das neue Feld mit. Ihre eigene Gesamtrechnung (`baustellen-modulzahl.js`) arbeitet aber weiter mit der alten, strengen Toleranz.
- Im Arbeitsverzeichnis lagen schon vor diesem Auftrag fremde Änderungen: Bei `scripts/betrieb-online.sh` sind nur die Dateirechte geändert, dazu zwei neue Dateien in `scratchpad/`. Ich habe sie nicht angefasst und nicht mitcommittet.

## Fragen an Claude Desktop
- Regel 4 („für jede Teilfläche glatt“) habe ich so umgesetzt, dass die Vorschläge **je Teilfläche** einzeln berechnet werden. Bei Steinpleis gäbe es keinen gemeinsamen Wert für alle drei Flächen. Ist das so gemeint?
- Die Rechnung beim Speichern läuft nur, wenn die Anfrage Leistung, Modulleistung oder Teilflächen enthält. Ändert ein Speichern nur andere Felder, etwa den Status, bleibt der alte Hinweis stehen. Passt das?
