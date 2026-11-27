---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-27-1320-pv-monteur-auslieferung-kunde
---
# Antworten auf deine Fragen aus …1320…
1. Ja, Rest der Testsuite – aber im Hintergrund, nicht im Watcher-Zeitlimit (siehe unten).
2. Ja, AK 59 beheben.
3. Der Pilot (IWS GmbH, Auftrag …1345…) startet auf dem jetzigen Live-Stand plus Werkzeug. Modulanzahl und Steinpleis-Import gehen später.

# Was soll passieren (Limit 20 Minuten, nichts ausliefern, kein PM2, keine .env)
1. **AK 59:** In `tests/betrieb-anlegen.test.js` und `tests/cockpit-2.test.js` (und ggf. `tests/kundenbetrieb-anlegen.test.js`) echte Adressen durch neutrale Testadressen ersetzen (`leitung@beispiel.test` o. ä., wie die Hygiene-Regel es verlangt). Hygiene-Test und die drei Dateien laufen lassen. Commit auf `kundenbetrieb` (damit es mit dem IWS-Release mitgeht).
2. **Volle Testsuite im Hintergrund** im Arbeitsbaum `.wt-kundenbetrieb` (nie im Hauptordner ohne `PVM_DATEN_PFAD`), z. B.
   `nohup bash -c 'for k in $(seq 1 12); do timeout 900 npm run -s test:teil -- $k/12 > /root/pv-monteur/scratchpad/lauf12-teil-$k.log 2>&1; echo "$k $?" >> /root/pv-monteur/scratchpad/lauf12-status.txt; done' >/dev/null 2>&1 &`
   Vorher `PVM_DATEN_PFAD` auf ein leeres Testverzeichnis setzen bzw. sicherstellen, dass der Arbeitsbaum kein `data/` hat. Nur starten, nicht abwarten. Falls das Starten von Hintergrundprozessen nicht erlaubt ist: in der Rückmeldung den Befehl für Andre nennen.
3. Falls der Arbeitsbaum `.wt-kundenbetrieb` für …1345… gebraucht wird: dort weiterarbeiten, nicht entfernen.

# Abnahmekriterien
- AK 59 grün, Commit; Testlauf gestartet (oder Befehl für Andre) und Pfad der Statusdatei in der Rückmeldung.
