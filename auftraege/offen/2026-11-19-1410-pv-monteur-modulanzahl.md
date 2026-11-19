---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-19-1315-pv-monteur-echter-betrieb
---
# Was soll passieren
Beim Anlegen einer Baustelle (Auftrag) soll sich die **Modulanzahl aus der Leistung ergeben**, weil die wenigsten Eigentümer wissen, wie viele Module verbaut sind und welche Teilfläche wie viele hat. Andre hat das schon einmal direkt mit Claude Code erarbeitet (nicht über dieses Repo) – **zuerst nachsehen, was davon im Code schon steht**, und nur den Rest bauen.

Zweig `modulanzahl`, abgezweigt von `release-2026-11-19-betrieb`. Gesamtlimit 30 min, Rückmeldung spätestens nach 25 min. Nur gezielte Tests mit `timeout 300`, keine Gesamtsuite. Nichts ausliefern, kein PM2, keine .env.

## Regeln
1. **Je Teilfläche:** `module = kWp_teilflaeche × 1000 / modul_wp`. Gesamt: Summe der Teilflächen. Gibt es keine Teilflächen, aus `leistung_kwp`.
2. **Glatt oder nicht:** Ist das Ergebnis keine ganze Zahl (Toleranz ±0,02 Modul, Rundungsfehler bei kWp-Angaben mit 2 Nachkommastellen), Warnung: „Leistung und Modulleistung passen nicht zusammen – Angaben prüfen oder verschiedene Module auf dieser Teilfläche?“. Kein Abbruch, die Leitung entscheidet.
3. **Modulleistung je Teilfläche** zulassen (Feld `modul_wp` an der Teilfläche, Vorgabe aus dem Auftrag `modul_kwp`). Grund: Bei Steinpleis passen KV1 (56,42 kWp) und KV2 (83,72 kWp) glatt zu 260 Wp (217 und 322 Module), KV3 (106,75 kWp) aber nur zu 250 Wp (427 Module).
4. **Modulleistung unbekannt:** Vorschläge anzeigen – alle Werte von 50 bis 700 Wp in 5-Wp-Schritten, die für jede Teilfläche glatt aufgehen, nach Plausibilität sortiert (Baujahr `datum_ibs`: bis 2010 eher 150–240 Wp, 2011–2015 230–280, 2016–2020 270–350, ab 2021 350–600). Höchstens 5 Vorschläge je Teilfläche. Nur Vorschlag, die Leitung übernimmt mit einem Klick.
5. **Summenprüfung:** Summe der Teilflächen-kWp gegen `leistung_kwp`; Abweichung > 0,5 % → Warnung.
6. Eingetragene Modulanzahl von Hand bleibt erlaubt; weicht sie von der Rechnung ab, Hinweis anzeigen.

## Umsetzung
- Rechenlogik als reine Funktion in `lib/` (ohne Speicherzugriff), damit Leistungscheck und SolarNavi sie später mitnutzen können.
- Oberfläche: im Formular „Auftrag anlegen/bearbeiten“ die berechnete Anzahl je Teilfläche anzeigen, live beim Tippen; Warnungen und Vorschläge darunter.
- Server prüft beim Speichern mit derselben Funktion und speichert Warnungen als Hinweis am Auftrag (keine Sperre).
- Tests: Steinpleis-Zahlen oben (217/322/427, Gesamt 966), glatt/nicht glatt, Toleranz, Vorschläge mit Baujahr 2011 (260 und 250 müssen unter den Vorschlägen sein), Summenprüfung, Handeintrag.

# Abnahmekriterien
- In der Rückmeldung: was schon vorhanden war, was neu ist, Commits, Tests grün.
- Zweig `modulanzahl` steht für den nächsten Auftrag (`…1411…`) bereit.
