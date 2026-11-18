---
status: teilweise
vorschau_url:
commits: 4a3fe633, fb8e5b59
---
## Umgesetzt
- **Stand geprüft:** Alle Teile aus dem ersten Lauf lagen fertig, aber noch nicht committet, im Arbeitsbaum. Dazu gehören:
  - Router `/api/v1/leistungscheck` mit Schalter, 32-KB-Grenze und Schlüsselprüfung
  - Schlüsselbestand `schnittstellenschluessel` (nur Präfix und SHA-256) mit Ausstellen und Sperren durch die Leitung
  - `mandant.kontextAusSchluessel`
  - Werkzeug `tools/schluessel-ausstellen.js`
  - Anlegen ohne Doppelung bei gleicher `fremdnummer`
  - `anlass_hinweis` als Serverfeld (Regel R1)
  - Statusabfrage ohne Messwerte
  - Webhook mit HMAC-Signatur, Warteschlange, 5 Wiederholungen, ohne Weiterleitungen
  - E-Mail „Neuer Prüfauftrag aus dem Leistungscheck“ an die Leitung
  - Skripte für Auslieferung und Rückweg sowie Einträge in `.env.example`
  
  Ich habe nichts doppelt gebaut. Der Stand ist als **4a3fe633** („WIP Schnittstelle Leistungscheck“) gesichert.
- **Nachgezogen (fb8e5b59):** Vier vorhandene Inventarwachen schlugen wegen der neuen Dateien an. Ich habe die Zahlen und Listen angepasst und jede Stelle im Test begründet:
  - Schreibeinstiege 68 → 71
  - Aufrufe 62 → 68
  - neuer Leser von `verifikationskennung`: `lib/leistungscheck-status.js`
  - neue `datei.lade`-Aufrufe: `lib/leistungscheck-hinweis.js` und `lib/schnittstellenschluessel.js`
- **Gezielte Tests, alle grün:**
  - Die 4 neuen Leistungscheck-Tests (Auftrag, Schlüssel und Kontext, Status, Webhook und Wache): 27 von 27.
  - Direkt betroffene vorhandene Tests (Mandant, Serverfelder, Firmenlöschung, Speicher, Feldwachen, Inventarwachen): 13 Dateien. Nach dem Nachziehen sind die Inventar- und Leistungscheck-Tests zusammen 35 von 35 grün.
- **Gesamtsuite:** Sie lief **in das Zeitlimit** und wurde nach 580 s abgebrochen, ohne Zusammenfassung. 900 s waren im Vordergrund nicht möglich, weil das Werkzeug höchstens 600 s erlaubt. Auch die Ausgabe in die Datei `/tmp/pvm-suite.log` hat die Rechteprüfung abgelehnt. Als Nachweis gelten deshalb die gezielten Tests oben.
- Nicht nach `/root/pv-monteur-live` ausgeliefert, kein PM2-Neustart, keine `.env` geändert.

## Offen für Andre
1. **Gesamtsuite einmal selbst laufen lassen:** `cd /root/pv-monteur && timeout 900 npm test > /tmp/pvm-suite.log 2>&1; tail -9 /tmp/pvm-suite.log; grep '^not ok' /tmp/pvm-suite.log`
2. **firma_id deines Betriebs:** Die konnte ich nicht ermitteln, weil der Zugriff auf `/root/pv-monteur-live` gesperrt war. Nachsehen mit:
   `cd /root/pv-monteur-live && node -e 'const f=require("./data/firmen.json");(Array.isArray(f)?f:Object.values(f)).forEach(x=>console.log(x.id,x.name))'`
3. **Einträge in der `.env` von `/root/pv-monteur-live`:**
   - `PVM_LEISTUNGSCHECK=an`
   - `PVM_LC_WEBHOOK_URL=http://127.0.0.1:3140/api/leistungscheck/pvm-hinweis`
   - `PVM_LC_WEBHOOK_GEHEIMNIS=<zufällig, z. B. openssl rand -hex 32>`
   - optional `PVM_LC_WEBHOOK_TIMEOUT_MS=10000`
4. **Einträge in der `.env` von `/var/www/eid/ppp-api`:**
   - `PVM_LC_SCHLUESSEL=<Ausgabe von Schritt 6>`
   - `PVM_LC_WEBHOOK_GEHEIMNIS=<derselbe Wert wie in 3>`
5. **Auslieferung (nach Freigabe):**
   - Release-Zweig aus master anlegen und die Stichtage neu setzen (wie 80a92546).
   - Dann: `bash /root/pv-monteur-live/scripts/auslieferung-leistungscheck.sh release-JJJJ-MM-TT`
   - Das Skript sichert vorher die Daten und prüft am Ende: Leistungscheck-Abfrage ohne Schlüssel gibt 401, wenn der Schalter an ist.
   - Rückweg: `bash /root/pv-monteur-live/scripts/rueckweg-leistungscheck.sh` (zurück auf release-2026-11-15c).
6. **Schlüssel ausstellen (nach der Auslieferung):** `cd /root/pv-monteur-live && node tools/schluessel-ausstellen.js --firma <firma_id>`. Der Schlüssel wird nur einmal angezeigt; danach in die ppp-api-`.env` eintragen (Schritt 4) und ppp-api neu starten.
7. **Post:** Der SMTP-Versand muss live eingerichtet sein, sonst kommt die Mail an die Leitung nicht an. Ohne Einrichtung lehnt der Dienst in production den Versand ab (503).

## Fragen an Claude Desktop
- Soll die Gesamtsuite künftig in Teilen laufen (z. B. nach Dateinamen aufgeteilt)? Ein einzelner Lauf passt weder in 600 s im Vordergrund noch in das 30-Minuten-Fenster mit Puffer.
- Ist für die Vorschau eine eigene Instanz mit `PVM_LEISTUNGSCHECK=an` gewünscht? Im Auftrag war kein Vorschau-Ziel genannt, deshalb ist die Vorschau-URL leer.
