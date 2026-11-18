---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Teil 3 zu den Bauteilen (Zweig `leistungscheck-komponenten`). Ziel: Andre führt danach **nur noch einen Befehl** aus. Limit 20 Minuten.

Antworten auf deine Fragen: (1) Bei Fehler in Schritt 5/6 alles zurücksetzen wie jetzt – passt. (2) Stammdaten-Liste reicht so.

1. **Release-Zweig anlegen** (in `/root/pv-monteur`, nicht live): `release-2026-11-18-komp` aus `leistungscheck-komponenten`, Stichtage wie bei `release-2026-11-18-lc` neu setzen (`lib/regelstand.js` GILT_AB, GILT_AB_A10G, GILT_AB_A10W; `lib/dokument/textstaende.js` RCD_WELLE_AB auf `date -u`), committen. Prüfen, dass der Live-Baum `/root/pv-monteur-live` den Zweig auschecken kann (wie beim letzten Release).
2. **Probe in Schritt 4 robust machen:** Der Probe-Rumpf muss bis auf `komponenten.module[0].wp = 0` vollständig gültig sein (Telefon „0000000000“, E-Mail falls Pflicht, Adresse, Teilflächen, Einschätzung mit allen Pflichtfeldern), damit die Prüfung sicher erst am Bauteil-Block scheitert. Gegen den Prüfer in `lib/leistungscheck-eingabe.js` mit einem kleinen node-Aufruf nachweisen, dass genau `komponenten.module[0].wp` kommt.
3. **Prüfung in Schritt 6 gegen echte Datenform prüfen:** Die Bedingung `(a[0].teilflaechen||[]).some(t=>t.module!==0)` sieht aus, als könne sie bei Teilflächen ohne Feld `module` fälschlich anschlagen. Mit einem in Testdaten angelegten Auftrag (Test-Datenpfad, nicht live) nachweisen, dass die ganze Schritt-6-Prüfung bei korrektem Ablauf „ok …“ liefert; sonst die Bedingung an die echte Datenform anpassen. Ebenso prüfen, dass `anlass_hinweis.fremdnummer` der richtige Ort für die Fremdnummer ist.
4. Kommentarkopf des Skripts anpassen (Release-Zweig liegt bereit, Aufruf `bash /root/pv-monteur/scripts/komponenten-online.sh release-2026-11-18-komp`). Commit auf beiden Zweigen (Skript auch im Release-Zweig gleich).
5. Das Skript **nicht** ausführen. In die Rückmeldung nur den **Diff** des Skripts gegenüber `65a57d2d` und die Nachweise aus 2 und 3.

# Abnahmekriterien
- Release-Zweig mit frischen Stichtagen, Nachweise 2 und 3, Skript-Diff in der Rückmeldung.
