---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Andre hat `projekte/ppp/stufe4/pruefauftrag-online.sh` um ca. 13:10 UTC ausgeführt. Live-Stand danach: `POST /api/leistungscheck/pruefauftrag` → 503 (kein Schlüssel in ppp-api), `/leistungscheck/status/status.js` → 404 (Website nicht ausgeliefert), `https://pv-monteur.unternehmensdigitalisierung.io/api/v1/leistungscheck/pruefauftraege/LC-PROBE` → 404 (Schalter aus oder alte Version). Das Skript ist also früh abgebrochen. **Nur lesen, nichts ändern, nichts neu starten.** Limit 15 Minuten.

Bitte feststellen, bis zu welchem Schritt es kam und warum es stoppte:
- Gibt es `/root/sicherung-pruefauftrag-*` (Zeitstempel, Inhalt nur als Dateiliste)?
- Stehen `PVM_LEISTUNGSCHECK`, `PVM_LC_WEBHOOK_URL`, `PVM_LC_WEBHOOK_GEHEIMNIS` in `/root/pv-monteur-live/.env` und `PVM_LC_WEBHOOK_GEHEIMNIS`/`PVM_LC_SCHLUESSEL` in `/var/www/eid/ppp-api/.env` (nur Namen, keine Werte)?
- Welcher Zweig ist in `/root/pv-monteur-live` ausgecheckt? `pm2 describe pv-monteur` (Uptime, Neustarts), letzte 40 Zeilen `pm2 logs pv-monteur --lines 40 --nostream` und Log des Auslieferungsskripts, falls es eines schreibt.
- Läuft die tmux-Sitzung noch mit dem Skript (z. B. wartet es an `read -rp` auf die Nummer)? `tmux capture-pane -p` aller Fenster, letzte 30 Zeilen.

# Abnahmekriterien
- Rückmeldung: letzter erfolgreicher Schritt, Ursache des Abbruchs, und genau ein Befehl für Andre, um sauber weiterzumachen (oder den Rückweg).
