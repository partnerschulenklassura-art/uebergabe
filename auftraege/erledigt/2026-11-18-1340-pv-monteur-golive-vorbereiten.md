---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Antworten und Vorbereitung für den Livegang der Schnittstelle (Rückmeldung `2026-11-18-1310-…`). Vertrag inkl. Ergänzungen: `projekte/ppp/schnittstelle/leistungscheck-pv-monteur.md`. Gesamtlimit 25 Minuten, Rückmeldung spätestens dann.

1. **Mailfehler darf das Anlegen nicht verhindern:** Prüfen und ggf. so ändern, dass `POST /api/v1/leistungscheck/pruefauftraege` auch dann 201 liefert, wenn der Mailversand an die Leitung scheitert (SMTP fehlt → 503 intern). Der Fehler wird geloggt (ohne Personendaten). Test dazu.
2. **Testsuite in Teilen (Frage = ja):** npm-Skript `test:teil` mit Parameter (z. B. `npm run test:teil -- 1/4`), das die Testdateien deterministisch in N Teile aufteilt. Teile so wählen, dass jeder unter 8 Minuten bleibt. Dann alle Teile nacheinander je mit `timeout 540` laufen lassen und die Summe melden (bestanden/fehlgeschlagen je Teil, Namen fehlgeschlagener Tests).
3. **Release-Zweig anlegen** aus master wie bei 80a92546 (Stichtage neu setzen), Name `release-2026-11-18-lc`. Nur in `/root/pv-monteur` (git), nicht in `-live` auschecken.
4. **Nur lesen:** Sind in `/root/pv-monteur-live/.env` SMTP-Variablen gesetzt (nur Namen nennen, keine Werte)? Falls Lesen gesperrt ist, melden.
5. **Vorschau-Instanz: nein** (keine nötig).

# Abnahmekriterien
- Commit(s), gezielte Tests und alle Teile der Suite gemeldet, Release-Zweig vorhanden, SMTP-Befund. Nichts ausgeliefert, kein Live-Neustart, keine `.env` geändert.
