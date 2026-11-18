---
projekt: eid
ziel: vorschau
---
# Was soll passieren
ppp-api (`/var/www/eid/ppp-api`) nimmt im `POST /api/leistungscheck/pruefauftrag` den optionalen Block `komponenten` an (Vertrag Fassung 2, Abschnitt 5 in `projekte/ppp/schnittstelle/leistungscheck-pv-monteur.md`), prüft ihn nach denselben Grenzen und leitet ihn unverändert (bereinigt) an PV-Monteur weiter. ppp-api speichert davon **nichts** in `data/pruefauftraege.json`.

Damit die Website schon vor PV-Monteur liefern kann: Ein Schalter `PVM_LC_KOMPONENTEN` (Vorgabe aus). Ist er aus, wird ein mitgeschickter Block **still verworfen** (nicht abgelehnt), damit Anfragen nicht scheitern. Ist er an, wird er weitergeleitet. Den Schalter in `.env` setzt Andre später, nicht du.

Tests für beide Schalterstellungen und für jede Grenze. `npm test`, Commit. Den Dienst **nicht** neu laden (die Änderung wirkt erst mit dem Skript von PV-Monteur zusammen); in der Rückmeldung den Befehl nennen. Limit 20 Minuten.

# Abnahmekriterien
- `npm test` grün, Commit, Rückmeldung mit Befehl zum Neuladen.
