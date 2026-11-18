---
projekt: eid
ziel: live
---
# Was soll passieren
Antwort auf die Frage aus `2026-11-18-1400-…`: **Ja**, die Feldgrenzen in ppp-api (`src/pruefauftrag.js`) genau an PV-Monteur angleichen (jeweils die strengere Grenze von PV-Monteur übernehmen: Telefon 6–30 ohne Punkt, Azimut −180…180, höchstens 20 Teilflächen, Ursachen höchstens 10 × 80 Zeichen, Performance bis 5, dazu adresse, name, wunschtermin, inbetriebnahme_jahr wie in PV-Monteur). Die Grenzen bitte aus dem Code von `/root/pv-monteur` (Router `routes/leistungscheck.js`) lesen, nicht raten. Fehlermeldungen auf Deutsch mit Feldnamen, so dass die Website sie dem Nutzer zeigen kann. Tests anpassen, `pm2 reload ppp-api`, Gesundheit prüfen. Limit 20 Minuten.

Zur Testsuite von PV-Monteur (Frage aus `2026-11-18-1340-…`): N=12 fest, später mit Laufzeittabelle; das ist kein Teil dieses Auftrags.

# Abnahmekriterien
- `npm test` grün in ppp-api, Commit, Dienst gesund, Liste der geänderten Grenzen.
