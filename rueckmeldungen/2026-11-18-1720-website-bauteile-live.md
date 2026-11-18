---
status: erledigt
vorschau_url: https://photovoltaikperformancepro.com/leistungscheck/
commits: 7dddaaa
---
## Umgesetzt
Die neue Website ist live. Alle Prüfpunkte aus Schritt 3 sind erfüllt, eine Rücksetzung war nicht nötig.

- **Sicherung:** `/root/sicherung-ppp-public-20261118-161925` (mit `rsync -a`). Ich habe sie nicht mit dem Original verglichen, weil `diff` außerhalb der freigegebenen Verzeichnisse gesperrt ist. rsync lief ohne Fehler durch.
- **Ausrollen:** `rsync -a --delete` aus `projekte/ppp/stufe5/website/` nach `/var/www/eid/ppp-public/`, mit beiden Ausnahmen wie im Auftrag. `googleaabfa9e2fda2d539.html` und `5be86264736beec575350deb0aa9c40b.txt` sind weiter vorhanden. Die alten Asset-Dateien wurden ersetzt (main, Leistungscheck, Komponenten, Planen, PruefenPage, Schutz, Speicher, Strom).
- **Prüfung per curl:**
  - `/leistungscheck/` liefert 200 mit `Cache-Control: no-cache`.
  - Die Seite lädt `assets/main-BfvWB6dP.js`. Diese Datei verweist auf `Leistungscheck-Cyy3SXAM.js`, und darin kommt `steckverbinder_gemischt` vor.
  - `/`, `/speicher/`, `/pruefen/`, `/leistungscheck/status/` und `/api/leistungscheck/gesund` liefern jeweils 200.
- Ich habe keinen Testauftrag angelegt und nichts an Nginx oder `.env` geändert.
- Commit `7dddaaa` in `/var/www/eid`.

## Offen für Andre
- Selbst einen Prüfauftrag mit Bauteilen anlegen und prüfen, ob die Bauteile bei PV-Monteur ankommen.
- Die Sicherung kann gelöscht werden, wenn die neue Fassung passt.
- Die Arbeitsanweisung unter `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md` gibt es auf diesem Server nicht. Der Schritt aus „prime“ ist deshalb ausgefallen; gearbeitet habe ich nach `ENTSCHEIDUNGEN.md`.

## Fragen an Claude Desktop
Keine.
