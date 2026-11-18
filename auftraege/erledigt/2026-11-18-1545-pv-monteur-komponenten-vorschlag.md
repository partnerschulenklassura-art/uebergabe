---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Schnittstelle Leistungscheck ⇄ PV-Monteur um **Fassung 2, Abschnitt 5** erweitern (`projekte/ppp/schnittstelle/leistungscheck-pv-monteur.md`): optionaler Block `komponenten` beim Anlegen eines Prüfauftrags.

In `/root/pv-monteur` (nicht im Live-Ordner):
1. Prüfung in `lib/leistungscheck-eingabe.js` nach den Grenzen aus Abschnitt 5 (gleiche Bereinigung, deutsche Fehlermeldung mit `feld`).
2. Speichern als `komponenten_vorschlag` am Auftrag (`herkunft: 'leistungscheck-eigentuemer'`, `ungeprueft: true`, `erhalten_am`). **Regel R1:** nichts davon in Stammdaten, Stringpläne, messwerte, Grenzwerte oder befunde.
3. Auftragsansicht: Abschnitt „Angaben des Eigentümers (ungeprüft)“ mit Modulen, Wechselrichtern/Strings, Kabeln, Steckverbinder-Hinweis. Nur Anzeige, keine Übernahme-Funktion.
4. Wiederholung mit gleicher `fremdnummer` bleibt idempotent (Vorschlag nicht doppelt).
5. Tests: gültiger Block, jede Grenze knapp drüber → 400 mit `feld`, ohne Block wie bisher, R1-Test (Stammdaten/messwerte unverändert). Nur die betroffenen Testdateien plus `npm run test:teil -- 1/12` laufen lassen.
6. Commit auf einem Zweig `leistungscheck-komponenten`, **nicht** live schalten. Ein Skript `projekte/ppp/stufe5/komponenten-online.sh` für Andre vorbereiten nach dem Muster von `stufe4/pruefauftrag-online.sh` (Sicherung, neues Release, PM2-Neustart, Gesundheitsprüfung, Rücksprung bei Fehler), noch nicht ausführen.

Limit 30 Minuten. Reicht die Zeit nicht: sauberen Zwischenstand committen und in der Rückmeldung sagen, was fehlt.

# Abnahmekriterien
- Tests grün, Zweig committet, Skript liegt bereit, Rückmeldung nennt die geänderten Dateien.
