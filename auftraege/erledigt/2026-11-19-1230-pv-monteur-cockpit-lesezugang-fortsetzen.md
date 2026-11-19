---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-19-1145-pv-monteur-cockpit-lesezugang
---
# Was soll passieren
Fortsetzung von `2026-11-19-1145-pv-monteur-cockpit-lesezugang` (Inhalt siehe `auftraege/erledigt/`). Der Lauf ist mit Zeitüberschreitung abgebrochen, ohne Rückmeldung.

**Zeitplan, damit es diesmal durchläuft (Gesamtlimit 30 min):**
1. Zuerst Stand prüfen: `git -C /root/pv-monteur status --short`, `git -C /root/pv-monteur branch --show-current`, `git -C /root/pv-monteur log -5 --oneline`. Gibt es den Zweig `cockpit-lesezugang` und uncommittete Arbeit? Nichts doppelt bauen. Sinnvolle uncommittete Arbeit sofort sichern (Commit „WIP Cockpit-Lesezugang“).
2. Fehlende Teile fertigstellen: Schlüsselart `cockpit`, Werkzeug mit `--art cockpit`, Schalter `PVM_COCKPIT`, Endpunkte `/api/v1/cockpit/zeitraum` und `/offen`, Begrenzung 60/min, `scripts/cockpit-online.sh`, Einträge in `.env.example`.
3. **Nur gezielte Tests**, jeweils mit `timeout 300`: die neuen Cockpit-Tests, die Leistungscheck-Schlüsseltests und die Inventarwachen. Schlagen Inventarwachen wegen neuer Dateien an, die Zahlen nachziehen und im Test begründen (wie bei `2026-11-18-1310`). **Die Gesamtsuite diesmal nicht starten.**
4. Commit und Rückmeldung **spätestens nach 25 Minuten**, auch wenn etwas offen ist (dann `status: teilweise` mit klarer Liste).
- Weiterhin: nicht nach `/root/pv-monteur-live` ausliefern, kein PM2-Neustart, keine `.env` ändern.

# Abnahmekriterien
- Commit(s) auf `cockpit-lesezugang`, gezielte Tests grün.
- `scripts/cockpit-online.sh` liegt bereit (mit Sicherung und Rückweg). Der Schlüssel landet nur in `/var/www/eid/cockpit/.env`, nie auf dem Bildschirm.
- In der Rückmeldung unter „Offen für Andre“ der **eine** Befehl zum Ausrollen, mit ` #` am Ende.
