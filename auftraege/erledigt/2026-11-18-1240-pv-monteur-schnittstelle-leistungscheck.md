---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Andre hat die Kopplung freigegeben (18.11.2026). Baue die PV-Monteur-Seite der Schnittstelle **genau nach** `projekte/ppp/schnittstelle/leistungscheck-pv-monteur.md` (Abschnitte Schlüssel, 1, 2, 3) im Entwicklungsstand `/root/pv-monteur`, nach deinem Vorschlag aus der Bestandsaufnahme (eigener Router vor `zugangs-abgleich` und CSRF, Bestand `schnittstellenschluessel`, `kontextAusSchluessel` in `lib/mandant.js`, Schalter `PVM_LEISTUNGSCHECK`, Vorgabe aus).

- Neuer Bestand und neue Auftragsfelder (`anlass_hinweis` mit Herkunft) sind von Andre freigegeben.
- Regel R1 strikt: nichts aus dem Leistungscheck landet in messwerte, Grenzwerten oder befunden.
- Werkzeug `tools/schluessel-ausstellen.js --firma <id>` (Schlüssel einmal ausgeben, nur Hash speichern).
- Webhook nach Muster `lead-weitergabe`, ausgelöst nach dem Schreiben.
- E-Mail an die Leitung bei neuem Prüfauftrag.
- Tests: Schlüssel falsch/gesperrt/fremde Firma, Schalter aus → 404, doppelte fremdnummer, Statusableitung, nur abgeschlossene Fassungen geben Befunde heraus, keine Messwert-Zahlen in der Antwort, Webhook-Signatur, Größenlimit, Aufrufbegrenzung.
- **Nicht** nach `/root/pv-monteur-live` ausliefern, kein PM2-Neustart des Live-Dienstes, keine `.env` ändern.

# Abnahmekriterien
- Commit in `/root/pv-monteur`, alle Tests grün (alte und neue).
- Rückmeldung mit: geänderten Dateien, Ablauf zum Ausliefern nach `/root/pv-monteur-live` (vorhandene `scripts/auslieferung-*.sh`), und unter „Offen für Andre“ genau die Schritte für den Livegang: welche Variablen in welche `.env` (`PVM_LEISTUNGSCHECK=an`, `PVM_LC_WEBHOOK_URL`, `PVM_LC_WEBHOOK_GEHEIMNIS`), welcher Befehl den Schlüssel für welche firma_id ausstellt (Andres Betrieb ermitteln, id nennen), welcher Befehl ausliefert und neu startet.
