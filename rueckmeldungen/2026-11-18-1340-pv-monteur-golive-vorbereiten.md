---
status: teilweise
vorschau_url:
commits: 6333dcb1, 44582ee0 (master), 54e27915 (release-2026-11-18-lc)
---
## Umgesetzt
1. **Mailfehler blockiert das Anlegen nicht (6333dcb1).** Die Route hat die 201 schon vorher gesendet, bevor die Mail an die Leitung im Hintergrund verschickt wird. Ein SMTP-Fehler konnte also die 201 nicht verhindern. Problematisch war das Log: Dort landete die vollständige Meldung des Mailservers, und die kann Empfängeradressen enthalten. Jetzt wird der Fehler vorher bereinigt (`routes/leistungscheck.js`, `ohnePersonendaten`). Ins Log und in die Inhabermail kommen nur noch Code und Status, z. B. `post_nicht_konfiguriert, 503` oder `EENVELOPE`.
   - Neuer Test in `tests/leistungscheck-auftrag.test.js` mit zwei Fällen: SMTP fehlt (503) und Ablehnung mit Adresse in der Meldung. Erwartet wird jeweils 201, der Auftrag ist angelegt, der Fehler ist geloggt und im Log stehen keine Personendaten. Ohne die Änderung schlägt der Test fehl, mit ihr läuft er durch.
   - Gezielte Tests: alle vier `leistungscheck-*.test.js` → **28/28 bestanden**.
2. **`npm run test:teil -- k/N` (44582ee0).** Das Skript sortiert alle 1150 Testdateien nach Namen und verteilt sie reihum auf N Teile, also deterministisch. Mit `--liste` zeigt es nur die Dateien eines Teils an. Ungültige Angaben wie `5/4` beendet es mit Exitcode 2.
   - **Die Suite ist nicht vollständig gelaufen.** Teil 1/4 (288 Dateien) hat die 540 s nicht geschafft und wurde abgebrochen (Exit 124). Bis dahin waren 146 Tests oben in der Ausgabe fertig, **0 fehlgeschlagen**. Allein „E2E-K" brauchte 230 s.
   - Die Teile 2–4 habe ich nicht mehr gestartet, weil das Gesamtlimit erreicht war.
   - Folgerung: Auf diesem Server (2 Kerne, eine Testdatei nach der anderen) dauert die ganze Suite deutlich länger als die früheren ~21 min. Hochgerechnet ist es eher über eine Stunde, das ist aber nicht gemessen. Für Teile unter 8 min braucht es grob 10–12 Teile statt 4. Log: `lauf-teil-1-4.log`.
3. **Release-Zweig `release-2026-11-18-lc` (54e27915)** ist aus master angelegt, wie bei 80a92546. Gesetzte Stichtage: `RCD_WELLE_AB` 2026-11-18T12:39:16Z, `GILT_AB` :17, `GILT_AB_A10G` :18, `GILT_AB_A10W` :19. Der Zweig enthält beide Commits von heute. Ausgecheckt ist wieder master, in `-live` habe ich nichts ausgecheckt.
4. **SMTP-Befund `/root/pv-monteur-live/.env`** (nur gelesen, keine Werte angesehen): `PVM_POST_MODUS` (= `smtp`), `PVM_SMTP_HOST`, `PVM_SMTP_PORT`, `PVM_SMTP_USER`, `PVM_SMTP_PASS`, `PVM_SMTP_FROM`, `PVM_OEFFENTLICHE_URL` und `PVM_INHABER_EMAIL` sind alle gesetzt und nicht leer. **`PVM_LEISTUNGSCHECK` steht nicht in der Datei.** Damit antwortet die Schnittstelle live mit 404.
5. Keine Vorschau-Instanz. Nichts ausgeliefert, kein Neustart, keine `.env` geändert.

## Offen für Andre
- Für den Livegang muss `PVM_LEISTUNGSCHECK=an` in `/root/pv-monteur-live/.env` stehen, das betrifft eine Secrets-Datei.
- Die ganze Suite in Teilen laufen lassen. Vorschlag: `npm run test:teil -- k/12` für k = 1…12, je mit `timeout 540`, in einer eigenen Sitzung ohne 25-Minuten-Limit. Die Teile 2–4 der Viererteilung sind bisher nicht gelaufen.
- `scratchpad/teile-lauf.sh` ist ein nicht committeter Helfer für diese Schleife. Ich konnte ihn ohne Freigabe nicht ausführen, er kann gelöscht oder genutzt werden.
- Den Arbeitsablauf vom Sitzungsstart (`prime`) konnte ich nicht vollständig ausführen: `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md` und die projektbezogene `MEMORY.md` gibt es nicht. Gearbeitet habe ich nach `ENTSCHEIDUNGEN.md` und dem Auftrag.

## Fragen an Claude Desktop
- Soll ich N fest auf 12 setzen und die Teile in einer neuen Runde mit eigenem Zeitrahmen vollständig laufen lassen? Alternativ kann `test:teil` eine Laufzeittabelle bekommen, damit sich die Teile nach gemessener Dauer statt reihum aufteilen.
