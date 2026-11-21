---
projekt: flux
ziel: vorschau
ausfuehrung: server  # Claude Code läuft NUR auf srv1171441. Der Laptop (Linux Mint) hat KEIN Claude Code.
bezug:
---
# Flux: Rechnungstool lokal auf den Laptop holen und an Claude Desktop anbinden

## Ausgangslage
- Starter `~/.local/bin/flux` öffnet nur `https://rechnungen.unternehmensdigitalisierung.io` (läuft auf srv1171441).
- Die Seite liefert ohne Anmeldung „401 Unauthorized“, aber kein Login-Fenster.
- Wie Flux auf dem Server gebaut ist (Code, Datenbank, Mailversand), ist noch nicht dokumentiert.
- Der Hostinger-Server läuft nur noch bis Dezember 2026.
- Entscheidung von Andre: Flux läuft künftig **nur lokal auf dem Laptop**, denn er arbeitet nur, wenn der Laptop an ist.
- Internetzugriff von Flux nach draußen ist nötig: Bank (FinTS), Mailpostfach (Belege, Versand). ELSTER macht Andre selbst im Browser.

# Wichtig: Arbeitsteilung Server / Laptop
- Claude Code arbeitet auf dem Server. Es hat keinen Zugriff auf Andres Laptop.
- Ziel ist trotzdem ein Flux, das **auf dem Laptop** läuft. Claude Code baut deshalb auf dem Server ein fertiges Paket als Git-Repo (privat, GitHub-Konto partnerschulenklassura-art, Repo `flux`).
- Dazu gehört ein Skript `install.sh`, das Andre auf dem Laptop mit **einem** Befehl ausführt: `git clone … && cd flux && ./install.sh`.
- `install.sh` richtet alles ein: Abhängigkeiten, Datenbank-Import, systemd-User-Dienst, Starter, MCP-Eintrag mit vorheriger Sicherung der Config sowie das Backup. Das Skript muss idempotent sein, also mehrfach laufen dürfen, und jeden Schritt auf Deutsch ausgeben.
- Den Datenbank-Export vom Server legt Claude Code als Datei bereit (nicht ins Repo, da sensible Daten). Andre holt ihn per `scp`. Den genauen Befehl in die Rückmeldung schreiben.
- Alles, was nur auf dem Laptop getestet werden kann, kommt als Checkliste unter „Offen für Andre“. Claude Desktop prüft es danach mit Andre.

# Was soll passieren

## 0. Bestandsaufnahme (zuerst, nichts verändern)
- Per SSH auf srv1171441 (root) herausfinden: Nginx-Block für `rechnungen.unternehmensdigitalisierung.io`, Projektordner, Prozess (pm2/systemd), Datenbank (Art, Name, Tabellen), Woher kommt die 401?, Mailversand (SMTP-Konto, Logs).
- Klären, ob Flux je E-Mails verschickt hat und wann zuletzt.
- Ergebnis als `docs/BESTANDSAUFNAHME.md` im Flux-Projekt festhalten.
- Auf dem Server **nichts löschen und nichts abschalten**. Das entscheidet Andre später.

## 1. Lokal lauffähig machen
- Auf dem Server unter `/root/Projekte/flux` als Git-Repo aufbauen. Ziel-Ort auf dem Laptop: `~/Projekte/flux`. Nach jedem lauffähigen Stand committen.
- Datenbank samt aller Daten übernehmen, ohne Verlust. Der Rechnungsnummernkreis muss nahtlos weiterlaufen. Ist das Volumen klein, ist SQLite bevorzugt, sonst lokales PostgreSQL.
- Als systemd-**User**-Dienst starten (`systemctl --user`), nur auf `127.0.0.1` gebunden und mit Autostart beim Login.
- Den Starter `~/.local/bin/flux` auf `http://127.0.0.1:<port>` umstellen. Weil nur localhost erreichbar ist, entfällt ein Login.
- Geheimnisse (SMTP, Bank) gehören nicht in den Code. Ablage: `~/.config/flux/.env` mit chmod 600 oder der GNOME-Schlüsselbund (`secret-tool`).

## 2. Rechnungen (Kernfunktion)
- Kunden, Leistungen/Artikel, Rechnungsentwurf, Finalisieren.
- Beim Finalisieren werden die Nummer vergeben und die Rechnung gesperrt (GoBD). Danach gibt es Korrektur nur per Storno oder Gutschrift, nie per Löschen.
- Alle Pflichtangaben nach § 14 UStG. Steuermodus konfigurierbar: Regelbesteuerung oder Kleinunternehmer nach § 19. Andre fragen, was gilt.
- Ausgabe als **E-Rechnung ZUGFeRD/Factur-X (EN 16931, PDF/A-3 mit eingebettetem XML)**, optional XRechnung-XML. Mit einer bewährten Bibliothek erzeugen (z. B. Mustangproject-CLI oder Python `factur-x`) und mit einem Validator prüfen. Hintergrund: Ab 01.01.2028 ist die E-Rechnung für alle B2B-Unternehmen Pflicht.
- Zwei Absender bzw. Briefköpfe: Energie/Solar → Photovoltaik Performance Pro (info@photovoltaikperformancepro.com), alles andere → unternehmensdigitalisierung.io (info@unternehmensdigitalisierung.io).

## 3. Anbindung an Claude Desktop (MCP)
- Ein lokaler MCP-Server (stdio, Node, `@modelcontextprotocol/sdk`), der die Flux-API auf localhost aufruft.
- Tools: `kunde_suchen`, `kunde_anlegen`, `rechnung_entwurf`, `rechnung_anzeigen`, `rechnung_finalisieren`, `rechnung_pdf_pfad`, `offene_posten`, `zahlungen_abgleichen`, `beleg_erfassen`, `ustva_werte`.
- `rechnung_finalisieren` verlangt im Tool-Aufruf eine ausdrückliche Bestätigung (Parameter `bestaetigt: true`).
- Eintrag in `~/.config/Claude/claude_desktop_config.json` ergänzen. Vorher eine Sicherung anlegen und bestehende Server, z. B. `imap` und `rea`, unverändert lassen.

## 4. Versand
- Flux verschickt **nichts automatisch**. Versand erst auf ausdrückliche Anweisung, und zuerst immer eine Testmail an power-pv@mail.de.
- Versand per Hostinger-SMTP mit der Absenderregel oben. Gesendete Mails müssen im Ordner „Gesendet“ des jeweiligen Postfachs landen (IMAP APPEND).
- Versand mit Zeitstempel und Empfänger in einem Protokoll pro Rechnung festhalten.

## 5. Belege (Eingangsrechnungen)
- Ordner `~/Dokumente/Belege` beobachten. Neue PDFs und XML erfassen, ZUGFeRD/XRechnung automatisch auslesen.
- Optional: Anhänge aus dem IMAP-Posteingang importieren (nur lesen, nichts löschen).

## 6. Bank (nur lesen)
- Kontoumsätze per FinTS/HBCI abrufen, z. B. mit Python `python-fints`. Eingänge den offenen Rechnungen zuordnen und als bezahlt markieren.
- Die PIN wird nicht im Klartext gespeichert: Abfrage beim Abruf oder Schlüsselbund. TAN-Freigabe macht Andre.
- **Keine Überweisungen** und keine schreibenden Bankfunktionen.

## 7. ELSTER (nur vorbereiten)
- Die Funktion `ustva_werte(zeitraum)` liefert die Kennzahlen der Umsatzsteuer-Voranmeldung (z. B. Kz 81, 86, 66, 83) als Übersicht zum Abtippen.
- Andre übermittelt selbst im Browser über Mein ELSTER. Eine ERiC-Anbindung ist nicht Teil dieses Auftrags.

## 8. Sicherung
- Tägliches Datenbank- und Dokumenten-Backup nach `~/Dokumente/Flux-Backup` mit Rotation.
- Hinweis an Andre, wie er eine zweite Kopie außer Haus anlegt.
- Aufbewahrungsfrist für Rechnungen beachten: 8 Jahre.

# Abnahmekriterien
- `flux` im Terminal oder Menü öffnet die lokale Oberfläche ohne 401. Alle Altdaten sind sichtbar.
- In Claude Desktop erscheint der Flux-MCP. „Rechnungsentwurf an Testkunde, 2 h Beratung à 95 €“ erzeugt einen Entwurf. Nach Bestätigung entsteht eine finalisierte ZUGFeRD-PDF, die der Validator ohne Fehler akzeptiert.
- Eine Testmail mit der Rechnung geht an power-pv@mail.de und liegt danach im Ordner „Gesendet“.
- Eine PDF in `~/Dokumente/Belege` erscheint in Flux als Beleg.
- Der Bankabruf funktioniert lesend, oder es ist klar dokumentiert, was Andre dafür einrichten muss (Bank, FinTS-Freischaltung).
- `docs/BESTANDSAUFNAHME.md` und `docs/BEDIENUNG.md` (kurz, auf Deutsch) liegen vor.
- Rückmeldung im üblichen Format: Umgesetzt / Offen für Andre / Fragen.
