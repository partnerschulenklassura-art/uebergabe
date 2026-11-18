---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Prüfe das Go-live-Skript `projekte/ppp/stufe4/pruefauftrag-online.sh` gegen den echten Server. **Nicht ausführen.** Lesen und mit `bash -n` prüfen ist erlaubt. Gesamtlimit 20 Minuten.

Prüfpunkte:
1. Liegt `scripts/auslieferung-leistungscheck.sh` in `/root/pv-monteur` (Entwicklung) und kann es von dort mit `release-2026-11-18-lc` aufgerufen werden, oder muss es aus `/root/pv-monteur-live` kommen (dort gibt es es vor der Auslieferung noch nicht)? Startet es PM2 `pv-monteur` so neu, dass die neue `.env` gelesen wird (`--update-env` bzw. dotenv beim Start)?
2. Liest PV-Monteur `.env` aus `/root/pv-monteur-live/.env`? Stimmt `/api/gesundheit` als Gesundheitsweg?
3. Format von `data/firmen.json` (Array, `{eintraege:[…]}` oder Objekt) – passt das `node -e` im Skript?
4. Gibt `tools/schluessel-ausstellen.js` den Schlüssel so aus, dass `grep -oE 'pvm_lc_[A-Za-z0-9_-]+'` genau den Schlüssel findet (und nicht z. B. nur das Präfix)? Muss es aus `/root/pv-monteur-live` laufen (richtiges `data/`)?
5. Liefert `GET /api/v1/leistungscheck/pruefauftraege/LC-PROBE` ohne Schlüssel bei eingeschaltetem Schalter wirklich 401?
6. Passt der Test-Rumpf in Schritt 7 zur Prüfung in ppp-api (Pflichtfelder, Honeypot, Prüfsumme)?
7. Sonst Fallstricke (`set -e` mit grep ohne Treffer, Rechte, Pfade, Rückweg).

# Abnahmekriterien
- Rückmeldung: je Prüfpunkt ein Satz. Für jede nötige Korrektur die **genaue Ersetzung** (alte Zeile → neue Zeile) oder die vollständige korrigierte Datei in einem Codeblock, damit Claude Desktop sie ins Repo übernimmt. Nichts ausgeführt, nichts geändert.
