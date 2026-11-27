---
status: teilweise
vorschau_url:
commits: 8a02ea90
---
## Umgesetzt
- **AK 59 ist grün.** Commit `8a02ea90` liegt auf dem Zweig `kundenbetrieb` im Arbeitsbaum `.wt-kundenbetrieb` und geht damit mit dem IWS-Release mit. Im ganzen Testbaum standen nur zwei Anschriften außerhalb der erlaubten Testdomains:
  - `tests/betrieb-anlegen.test.js:92` prüfte die Ausgabe gegen die echte Adresse `info@photovoltaikperformancepro.com`. Der Test vergleicht jetzt mit `werkzeug.VORGABE.email`. Die Adresse ist im Werkzeug `tools/betrieb-anlegen.js` fest eingetragen und bleibt dort unverändert.
  - `tests/cockpit-2.test.js:47`: `a@b.de` ist durch `leitung@beispiel.test` ersetzt.
  - `tests/kundenbetrieb-anlegen.test.js` hatte keine solche Anschrift.
- **Tests:** Der Hygiene-Test lief mit 6 von 6 grün. `betrieb-anlegen`, `cockpit-2` und `kundenbetrieb-anlegen` liefen zusammen mit 14 von 14 grün.
- **Arbeitsbaum:** `.wt-kundenbetrieb` hat kein `data/`. Ich habe ihn nicht entfernt und nichts ausgeliefert. Kein PM2, keine `.env` angefasst.
- **Volle Testsuite: nicht gestartet.** Das Starten eines Hintergrundprozesses wurde nicht freigegeben, der Befehl dafür steht unten.

## Offen für Andre
- **Volle Testsuite im Hintergrund starten.** Ein Durchlauf dauert höchstens etwa 3 Stunden, nämlich 12 Teile mit je bis zu 15 Minuten. Befehl:
  ```
  nohup env PVM_DATEN_PFAD=/tmp/pvm-lauf12-leer bash -c 'mkdir -p "$PVM_DATEN_PFAD"; cd /root/pv-monteur/.wt-kundenbetrieb || exit 1; : > /root/pv-monteur/scratchpad/lauf12-status.txt; echo "start $(date -Is) $(git rev-parse --short HEAD)" >> /root/pv-monteur/scratchpad/lauf12-status.txt; for k in $(seq 1 12); do timeout 900 npm run -s test:teil -- $k/12 > /root/pv-monteur/scratchpad/lauf12-teil-$k.log 2>&1; echo "$k $?" >> /root/pv-monteur/scratchpad/lauf12-status.txt; done; echo "ende $(date -Is)" >> /root/pv-monteur/scratchpad/lauf12-status.txt' >/dev/null 2>&1 &
  ```
  - **Statusdatei:** `/root/pv-monteur/scratchpad/lauf12-status.txt`. Sie bekommt je Teil eine Zeile „Teilnummer Exit-Code“, Exit-Code 124 heißt Zeitlimit.
  - **Protokolle:** `/root/pv-monteur/scratchpad/lauf12-teil-<k>.log`. Dort liegt noch ein altes `lauf12-teil-1.log`, das der Lauf überschreibt.
- **Arbeitsanweisung fehlt:** Die Datei `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`, die der Sitzungsstart laden soll, gibt es nicht. Gearbeitet habe ich nach `ENTSCHEIDUNGEN.md` und dem Auftrag.

## Fragen an Claude Desktop
- Soll die echte Adresse in `tools/betrieb-anlegen.js` als feste Vorgabe bleiben, oder soll sie über ein Argument bzw. die Umgebung kommen? Für AK 59 ist das nicht nötig, weil der Hygiene-Test nur den Testbaum prüft.
