# Feste Entscheidungen (gelten für Claude Desktop und Claude Code)

- Sprache aller Inhalte: Deutsch.
- photovoltaikperformancepro immer mit .com (nie .io).
- E-Mail-Absender: Energie/Solar → info@photovoltaikperformancepro.com, alles andere → info@unternehmensdigitalisierung.io.
- Nach jedem lauffähigen Stand committen.
- Änderungen zuerst auf Vorschau; live erst nach Freigabe durch Andre.
- Keine Eingriffe an Nginx, Datenbank-Schema, Systemdiensten oder Secrets über den Watcher – solche Punkte als „Offen für Andre“ in die Rückmeldung schreiben.

## Leistungscheck (17.11.2026, Claude Desktop)
- Wettermittel bleibt 2005–2023, passend zu PVGIS-SARAH3.
- Abstand zu Verschmutzern über `out tags bb` reicht vorerst; Straße und Bahn bei Bedarf später mit `out geom`.
- DWD-Faktoren (horizontal) werden im Rechenkern mit den PVGIS-Monatserträgen der Anlage gewichtet (`wetterFaktor()` in `projekte/ppp/web/src/lib/leistungscheck.js`). Der Dienst liefert dafür die Monatsfaktoren, PVGIS die Monatserträge.
- Der Dienst `/var/www/eid/ppp-api` wird erst mit der Seite „Leistungscheck“ gestartet.
- Ortssuche: Die Seite verlangt eine fünfstellige PLZ; `addressdetails=1` und „Ort, Kreis“ passen; eine PM2-Instanz für ppp-api (17.11.2026).
- Go-live-Skript: maßgeblich ist `projekte/ppp/stufe3/leistungscheck-online.sh` (Schutzschritte aus der Prüfung übernommen); die Kopie in `/var/www/eid/ppp-stufe3/` ist überholt.

## 2026-11-18 – Freigabe für live
- `ziel: live` in einem Auftrag von Claude Desktop gilt als Freigabe durch Andre für genau diesen Auftrag. Nginx, Cron, .env und neue Dienste bleiben weiter bei Andre.

## 2026-11-19 – Tagescockpit (`/var/www/eid/cockpit`, Port 3150)
- Für alle Vorhaben (Bereiche ppp, unternehmensdigitalisierung, mf32, didaktos), Vorgabe ppp. Stufen: 1 Heute/Kalender/Aufgaben, 2 Mail (IMAP, nur lesen und zuordnen, Antworten in Outlook), 3 Anlagenakte mit Zeitstrahl, 4 Fristen, ICS-Abo, Tagesmail 7 Uhr.
- Sperre nach 5 Fehlversuchen gilt für das ganze Cockpit (ein Benutzer); Schutz vor Aussperren durch die IP-Freigabe in Nginx. So gewollt.
- Sitzungen nur im Arbeitsspeicher (14 Tage), nach Neustart neu anmelden reicht.
- PV-Monteur liefert dem Cockpit nur Lesedaten über Schlüsselart `cockpit`, ohne Kontaktdaten und Messwerte. Ausrollen über Release-Zweig `release-2026-11-19-cockpit`.

## 2026-11-21 – Arbeitsteilung Server / Laptop
- Claude Code läuft NUR auf dem Server srv1171441, nicht auf Andres Laptop. Was auf dem Laptop laufen soll, liefert Claude Code als Repo mit `install.sh`, das Andre mit einem Befehl startet.
- Claude Desktop schreibt direkt in dieses Repo (GitHub). Andre muss keine Dateien per scp übertragen.
- Flux (Rechnungstool) läuft künftig lokal auf dem Laptop; Auftrag unter `projekte/flux/`. Für den Watcher fehlt noch der Eintrag `flux=/root/Projekte/flux` in `server/projekte.conf` – bitte serverseitig ergänzen.

## 2026-11-27 – PV-Monteur: App jetzt, Offline-Version (.exe/Stick) eingeplant
- Für die ersten Kunden (Pilot IWS GmbH) wird PV-Monteur als installierbare Web-App ausgeliefert (PC über Chrome/Edge, Handy über Startbildschirm).
- Eine echte Offline-Variante als Windows-Programm (.exe) bzw. auf dem Stick ist als nächstes größeres PV-Monteur-Projekt eingeplant. Vor dem Bau ein Konzept: Datenhaltung lokal, Sicherung, Updates, Abgleich mit dem Server, Lizenz/Zugänge.
