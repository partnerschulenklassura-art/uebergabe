Ich habe hier nichts geändert und nichts neu gestartet. Wo das Skript stehen blieb, kann ich nur auf zwei Schritte eingrenzen: Es brach in Schritt 0 (Vorprüfung) oder Schritt 1 (Sicherung) ab. Schritt 2 hat es mit Sicherheit nicht erreicht. Mehrere der verlangten Prüfungen hat die Rechteverwaltung blockiert. Sie stehen unten unter „Offen für Andre“.

---
status: teilweise
vorschau_url:
commits:
---
## Umgesetzt
Alles nur gelesen, Stand 13:17 UTC.

- **Schritt 2 lief nie.** In `/root/pv-monteur-live/.env` steht keiner der drei Namen `PVM_LEISTUNGSCHECK`, `PVM_LC_WEBHOOK_URL` und `PVM_LC_WEBHOOK_GEHEIMNIS`. Die Datei wurde zuletzt am **2026-10-02** geändert. Schritt 2 hätte die Datei angefasst und damit dieses Datum erneuert. Das Skript kam also höchstens bis Schritt 1.
- **Schritt 3 lief nie.** In `/root/pv-monteur-live` ist weiter `release-2026-11-15c` ausgecheckt. `pm2 describe pv-monteur` zeigt 0 Neustarts, läuft seit 2 Tagen und wurde am 2026-11-15T22:13Z gestartet. Daher kommt das 404 auf `/api/v1/leistungscheck/…`: Es läuft noch die alte Version und der Schalter ist aus.
- **Das Skript wartet nicht an der Nummernabfrage.** `read -rp` steht erst in Schritt 4.
- **Die Vorprüfung würde jetzt durchgehen:**
  - Der Zweig `release-2026-11-18-lc` existiert seit 12:39 UTC.
  - Alle sechs Website-Dateien liegen seit 12:37 UTC in `stufe4/website`.
  - `127.0.0.1:3140/api/leistungscheck/gesund` antwortet mit 200.
- **Wahrscheinlichste Ursache:** In der Vorprüfung hat ppp-api nicht geantwortet („STOPP: ppp-api antwortet nicht“).
  - ppp-api hat 6 Neustarts, wurde zuletzt um 13:15:35 UTC neu angelegt und lief bei meiner Abfrage erst 118 s.
  - Zur selben Zeit hat der parallele Auftrag `2026-11-18-1415-ppp-api-grenzen-angleichen` ppp-api geändert und mit `pm2 reload` neu geladen.
  - Das ist ein Schluss aus den Zeiten, nicht belegt. Den Bildschirm von tmux und die Logs durfte ich nicht lesen.
- **Andere mögliche Ursache:** Das Skript wurde nicht als root gestartet. Dann bricht es schon in der ersten Prüfung ab („Zweig fehlt“), weil es `/root/pv-monteur` nicht lesen kann.
- **Gut zu wissen:** Andre lief vermutlich noch die Fassung von 7dd32a1. Die Korrekturen in 082dbd9 kamen erst um 13:12 UTC, unter anderem die Telefonnummer im Testauftrag, ohne die Schritt 7 gescheitert wäre. Ein neuer Lauf nimmt automatisch die korrigierte Fassung.
- Keine Commits, weil in `/root/pv-monteur` nichts geändert wurde.

## Offen für Andre
Diese Prüfungen hat die Rechteverwaltung blockiert, weil sie außerhalb der freigegebenen Ordner liegen:
- `ls -d /root/sicherung-pruefauftrag-*`: Gibt es den Ordner, kam das Skript bis Schritt 1, sonst stoppte es in Schritt 0.
- Namen in `/var/www/eid/ppp-api/.env`: Laut Rückmeldung 1415 fehlt `PVM_LC_SCHLUESSEL`, daher das 503.
- `tmux capture-pane -p`, also was das Skript auf dem Bildschirm zuletzt gemeldet hat.
- `pm2 logs`: Das Auslieferungsskript schreibt kein eigenes Log.

**Zum Weitermachen genau ein Befehl**, als root und erst wenn kein anderer Auftrag an ppp-api arbeitet:
```
cd /root/uebergabe && git pull && bash projekte/ppp/stufe4/pruefauftrag-online.sh 2>&1 | tee /root/pruefauftrag-lauf-$(date +%H%M).log
```
Erneut ausführen ist unbedenklich, weil bisher nichts am Live-Stand verändert wurde. Bricht er wieder ab, nennt das Log den Grund. Einen Rückweg braucht es nicht. Spätester Lauf ist der **20.11.2026, 12:39 UTC**, wegen des Stichtags im Release-Zweig.

Nebenbei: Die Arbeitsanweisung `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`, die der Prime-Skill laden soll, gibt es nicht.

## Fragen an Claude Desktop
- Sollen Aufträge, die ppp-api neu starten, gesperrt sein, solange Andre ein Go-live-Skript ausführt? Der parallele Auftrag 1415 hat ppp-api genau in diesem Zeitfenster neu geladen.
