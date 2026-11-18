---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Baue die ppp-api-Seite der Schnittstelle nach `projekte/ppp/schnittstelle/leistungscheck-pv-monteur.md`, Abschnitt 4 (und die Aufrufe aus 1–3), in `/var/www/eid/ppp-api`.

- `POST /api/leistungscheck/pruefauftrag`, `GET /api/leistungscheck/pruefauftrag/:fremdnummer?t=`, `POST /api/leistungscheck/pvm-hinweis` wie beschrieben.
- Schlüssel aus `PVM_LC_SCHLUESSEL`, Geheimnis aus `PVM_LC_WEBHOOK_GEHEIMNIS` (`.env`; fehlt der Schlüssel → 503 „Prüfaufträge sind gerade nicht möglich“, die Website fällt dann auf E-Mail zurück).
- Token: 32 Zufallsbytes base64url, gespeichert nur als SHA-256. Vergleich zeitkonstant.
- Speicher `data/pruefauftraege.json` ohne personenbezogene Daten (siehe Vertrag).
- Kein Logging von Rumpf-Inhalten (Namen, Telefon, E-Mail, Adresse).
- Tests ohne Netz mit einem Fake-PV-Monteur (lokaler Express auf Zufallsport): Erfolg, doppelt, Einwilligung fehlt, Honeypot, Größe, Aufrufbegrenzung, Token falsch, Signatur falsch/abgelaufen, PV-Monteur aus (503).
- `pm2 reload ppp-api` ist erlaubt (nur Code). `.env` NICHT anlegen oder ändern.

# Abnahmekriterien
- `npm test` grün, Commit, Dienst gesund.
- Rückmeldung: unter „Offen für Andre“ die zwei Zeilen für `/var/www/eid/ppp-api/.env` (Namen, nicht die Werte) und ob danach `pm2 reload ppp-api --update-env` reicht.
