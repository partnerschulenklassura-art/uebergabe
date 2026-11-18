---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Fortsetzung von `2026-11-18-1545-pv-monteur-komponenten-vorschlag` (Lauf ist ins Zeitlimit gelaufen). **Kleinerer Teil 1, Limit 20 Minuten.**

1. Erst nachsehen, was vom letzten Lauf schon da ist: `cd /root/pv-monteur && git branch -a && git status --short && git log --oneline -5 leistungscheck-komponenten 2>/dev/null`. Vorhandenes weiterverwenden, nicht neu anfangen.
2. Auf Zweig `leistungscheck-komponenten`: Prüfung des Blocks `komponenten` in `lib/leistungscheck-eingabe.js` nach Vertrag Fassung 2, Abschnitt 5 (inkl. der heutigen Klarstellung: ganze Zahlen für anzahl/module_je_string/modul_index, `modul_index` muss auf ein Modul zeigen, `herkunft` nur `eigentuemer` – identisch zu ppp-api `pruefeKomponenten()` in `/var/www/eid/ppp-api/src/pruefauftrag.js`, dort abschauen).
3. Speichern als `komponenten_vorschlag` am Auftrag (`herkunft: 'leistungscheck-eigentuemer'`, `ungeprueft: true`, `erhalten_am`), idempotent bei gleicher `fremdnummer`. R1: nichts in Stammdaten, Stringpläne, messwerte, Grenzwerte, befunde.
4. **Nur** die neue bzw. betroffene Testdatei laufen lassen (nicht die ganze Suite, nicht `test:teil`). Commit auf dem Zweig.

Die Anzeige im Auftrag und das Go-live-Skript kommen in Teil 2 (eigener Auftrag). Reicht die Zeit nicht, sauberen Zwischenstand committen und sagen, was fehlt.

# Abnahmekriterien
- Betroffene Tests grün, Commit auf `leistungscheck-komponenten`, Rückmeldung mit geänderten Dateien.
