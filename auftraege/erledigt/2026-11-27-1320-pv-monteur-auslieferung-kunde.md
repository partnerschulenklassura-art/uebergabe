---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Andre will PV-Monteur an einen **ersten Kunden** ausliefern (begleiteter Pilot). Er sagt, die Sicherheitsfragen seien **gestern (26.11.) geklärt** worden – vermutlich in einer direkten Claude-Code-Sitzung auf dem Server. Claude Desktop hat davon keinen Stand. Bitte abstimmen und vorbereiten. Limit 25 Minuten, nur lesen und vorbereiten, nichts ausliefern, kein PM2, keine .env.

## 1. Stand feststellen (nur lesen)
- Gibt es Notizen/Commits/Rückmeldungen vom 26.11. zu Sicherheit oder Auslieferung? (`git log --since=2026-11-26` in `/root/pv-monteur`, `/var/www/eid`, `/root/uebergabe`; `docs/`, `AUSLIEFERUNG-NOTIZ*`, `/var/www/eid/sicherheit/`). Kurz zusammenfassen, was dort entschieden/erledigt wurde.
- Sicherheit vom 21.11.: Liegt eine Ausgabe von `pruefen.sh` unter `/root/spurensuche-*.txt`? Ist das Konto `ubuntu` gesperrt (`passwd -S ubuntu`, falls erlaubt)? Root-Passwort geändert (nur aus Logs/Notizen, nichts ausprobieren)?
- Welche Release läuft live (`git -C /root/pv-monteur-live rev-parse --abbrev-ref HEAD`), Betriebe in den Daten (nur Namen/IDs, keine Kontaktdaten).
- **Datensicherung:** Gibt es eine regelmäßige Sicherung der PV-Monteur-Daten (Cron, systemd-Timer, Skript, Hostinger-Backups-Hinweis)? Wohin, wie oft, wie lange aufbewahrt?
- **Testsuite:** Wann lief zuletzt die vollständige Suite? Wenn nie: alle 12 Teile nacheinander mit `npm run test:teil -- k/12` und `timeout 300` je Teil laufen lassen (im Entwicklungsordner, nicht live) und Ergebnis je Teil notieren. Reicht die Zeit nicht, ab dem nächsten freien Teil in einem Fortsetzungsauftrag.

## 2. Vorbereiten, was für einen Kundenbetrieb fehlt
- Werkzeug zum Anlegen eines **Kundenbetriebs** (Muster `tools/betrieb-anlegen.js`): Name, Leitungs-Zugang mit E-Mail, Zahl der Zugänge, `status: aktiv`, ohne Stripe, Passwort setzt der Kunde selbst über „Passwort vergessen“ bzw. Einladungslink (kein Passwort am Bildschirm, keins durch Andre). Falls ein Einladungsweg schon existiert, den nutzen. Tests dazu. Auf Zweig `kundenbetrieb`, nicht ausliefern; Befehl für Andre in die Rückmeldung.
- Fehlt eine tägliche Datensicherung: Skript + Timer-Vorschlag vorbereiten (nicht einrichten), Befehl für Andre.

## 3. Rückmeldung
Eine Ampel-Tabelle „Auslieferbereit für Kunden-Pilot“: Sicherheit, Live-Stand, Datensicherung, Testsuite, Kundenbetrieb-Werkzeug, Rechtstexte (AGB/AVV/Datenschutz in der App vorhanden?), Abrechnung (ohne Stripe → Rechnung über Flux). Darunter, was Andre noch tun muss, je Punkt ein Befehl mit ` #` am Ende.
