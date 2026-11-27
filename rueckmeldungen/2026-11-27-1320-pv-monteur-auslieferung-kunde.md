---
status: teilweise
vorschau_url:
commits: 199f939f (Zweig `kundenbetrieb`)
---

## Umgesetzt

**1. Stand festgestellt (nur gelesen)**

- **26.11.: Dazu habe ich nichts gefunden.** In `/root/pv-monteur`, `/var/www/eid` und `/root/uebergabe` gibt es keine Commits vom 26.11. Im Übergabe-Repo gibt es auch keine Rückmeldung von diesem Tag; die letzten sind vom 25.11. (Ports/Kernel, Spurensuche). Die neueste Notiz in `docs/` ist `AUSLIEFERUNG-NOTIZ-NAECHSTE.md` vom 12.11. Was Andre am 26.11. geklärt hat, steht also nirgends im Repo. Vermutlich hat er es direkt am Server erledigt.
- **Sicherheitsvorfall vom 21.11.:** Es gibt einen Bericht (`/var/www/eid/sicherheit/spurensuche-2026-11-21/BERICHT.md`) und die Ausgabe von `pruefen.sh` (`/root/spurensuche-20261125-1118.txt`). Die Prüfung hat nichts Verdächtiges gefunden: keine neuen Schlüssel, Konten, Cron-Jobs, Dienste, Prozesse oder ausführbaren Dateien. Die systemd-Änderungen vom 22.11. 09:42 stammen vom Paket-Update (`run-upgrade.sh`).
  - **Root-Passwort:** `/etc/shadow` wurde am **24.11. um 20:16 UTC** geändert, nach dem Neustart und am selben Tag wie Andres Härtung `01-kein-passwort.conf`. Das passt zu einer Passwortänderung oder einer Kontosperre. Welches Konto betroffen war, lässt sich daraus nicht ablesen. Seit dem 24.11. gibt es nur noch Logins per Schlüssel.
  - **Konto `ubuntu`:** Ob es gesperrt ist, weiß ich nicht. `passwd -S ubuntu` wurde nicht freigegeben. Bekannt ist: `ubuntu` hat eine Login-Shell, ist in der Gruppe `sudo` mit `NOPASSWD:ALL`, und seine `authorized_keys` ist leer.
- **Live-Stand:** `release-2026-11-19-betrieb`. Die Zweige zu Modulanzahl und Steinpleis sind nicht live.
- **Betriebe in den Daten:** `001d744e2777786dcc8fa844` Solarwartung Kubitz (aktiv) und `666bcb9d700e86236ef6f599` PV Performance Pro (aktiv).
- **Datensicherung: vorhanden und läuft.** Ein Cron-Eintrag startet täglich um 03:00 `scripts/sicherung.sh`. Die Stände liegen lokal unter `/root/sicherungen/pv-monteur/` und per rsync außer Haus auf srv1332569. Es werden 30 Stände aufbewahrt. Laut Log lief die Sicherung jeden Tag vom 17.09. bis heute erfolgreich, auch die Kopie außer Haus. `/root/pv-monteur-live/data` ist ein Symlink auf `/root/pv-monteur/data`, die Sicherung erfasst also die Live-Daten. Ein neues Sicherungsskript ist deshalb nicht nötig.
- **Testsuite:** Die letzte belegte vollständige Aufteilung war 4 Teile am 18.11.; nur für Teil 1/4 gibt es ein Log. Heute habe ich **Teil 1/12** gestartet. Er wurde **nach 300 s abgebrochen**, ohne Zusammenfassung: 227 Tests bestanden, 1 fehlgeschlagen.
  - Der Fehler ist `hygiene-fixtures-secrets.test.js` „AK 59“: `info@photovoltaikperformancepro.com` und `a@b.de` stehen in `tests/betrieb-anlegen.test.js` bzw. `tests/cockpit-2.test.js`. Das kommt aus den Commits vom 19.11. und ist **seitdem auch im Live-Release**, nicht von heute.
  - Die Teile 2–12 sind nicht gelaufen, das Zeitlimit war erreicht.
  - Die Tests liefen im neuen Arbeitsbaum `.wt-kundenbetrieb`. Dort gibt es kein `data/`, die Live-Daten wurden also nicht berührt. Im Entwicklungsordner selbst zeigt `data/` per Symlink auf den Live-Bestand. Wer dort Tests ohne `PVM_DATEN_PFAD` startet, riskiert die Live-Daten.

**2. Werkzeug für Kundenbetriebe (Zweig `kundenbetrieb`, abgezweigt vom Live-Release, nicht ausgeliefert)**

- `tools/kundenbetrieb-anlegen.js` mit den Angaben `--firma`, `--name`, `--email`, `--zugaenge N` und optional `--gueltig-tage` (Vorgabe 7, höchstens 14).
- Der Betrieb wird mit `status: aktiv` angelegt, ohne Probezeit, ohne Laufzeitende und ohne Stripe.
- **Niemand vergibt ein Passwort:** Der Zugang bekommt intern einen zufälligen Wert, den niemand kennt. Der Kunde erhält eine Einladungsmail über den **vorhandenen Weg „Kennwort vergessen“** (Link `/#kennwort-neu=…`), nur länger gültig als die üblichen 60 Minuten. Der Link erscheint nie am Bildschirm oder im Log.
- Das Werkzeug bricht ab, **ohne etwas zu schreiben**, wenn die E-Mail schon vergeben ist, eine Angabe ungültig ist, kein SMTP eingerichtet ist oder `PVM_OEFFENTLICHE_URL` fehlt. Geht erst der Versand schief, bleibt der Betrieb angelegt und das Werkzeug weist auf „Passwort vergessen“ hin.
- Tests: `tests/kundenbetrieb-anlegen.test.js` mit 5 Tests, zusammen mit `betrieb-anlegen` und `kennwort` **15 von 15 grün**.

**3. Ampel „Auslieferbereit für Kunden-Pilot“**

| Punkt | Ampel | Befund |
|---|---|---|
| Sicherheit | 🟡 | Spurensuche ohne Befund, Passwort-Login abgeschaltet, `/etc/shadow` am 24.11. geändert. Der Stand vom 26.11. ist nicht dokumentiert, und ob `ubuntu` gesperrt ist, ist offen. |
| Live-Stand | 🟢 | `release-2026-11-19-betrieb` läuft, 2 Betriebe |
| Datensicherung | 🟢 | Täglich 03:00, lokal und außer Haus, 30 Stände, Live-Daten erfasst |
| Testsuite | 🔴 | Nie vollständig belegt. Teil 1/12 überschreitet 300 s, 1 Fehler schon im Live-Release |
| Kundenbetrieb-Werkzeug | 🟡 | Fertig und getestet auf `kundenbetrieb`, noch nicht live |
| Rechtstexte | 🟡 | AGB mit AVV (§ 10, Art. 28), Datenschutz und Impressum sind in der App. Die AGB sind als **„ENTWURF — anwaltliche Prüfung steht aus“** markiert. Über das Werkzeug angelegte Betriebe haben keine Zustimmung in der App, weil sie nicht über die Registrierung laufen. |
| Abrechnung | 🟡 | Ohne Stripe möglich, der Betrieb ist dauerhaft aktiv. Die Rechnung über Flux muss außerhalb der App laufen, Flux ist auf dem Server nicht eingetragen. |

## Offen für Andre

- Klären, was am 26.11. entschieden wurde, und kurz ins Übergabe-Repo schreiben. Bis dahin ist der Stand für Claude Desktop nicht nachvollziehbar.
- Prüfen, ob das Konto `ubuntu` gesperrt ist, und es sonst sperren. Das ist ein Eingriff am System und bleibt deshalb bei dir:
  `passwd -S ubuntu   # erwartet: "ubuntu L ..."`
  `passwd -l ubuntu && rm -f /etc/sudoers.d/90-cloud-init-users   # nur falls nicht gesperrt und unbenutzt`
- Werkzeug ausrollen. Es ändert nur `tools/` und `tests/`, ein Neuladen von pm2 ist nicht nötig:
  `git -C /root/pv-monteur worktree remove /root/pv-monteur/.wt-kundenbetrieb && git -C /root/pv-monteur branch release-2026-11-27-kundenbetrieb kundenbetrieb && git -C /root/pv-monteur-live checkout release-2026-11-27-kundenbetrieb   #`
- Kundenbetrieb anlegen:
  `cd /root/pv-monteur-live && node tools/kundenbetrieb-anlegen.js --firma "Firmenname" --name "Ansprechpartner" --email leitung@kunde.de --zugaenge 3   #`
- In `/root/pv-monteur-live/.env` prüfen, ob `PVM_SMTP_FROM` auf info@photovoltaikperformancepro.com steht (Vorgabe für Energie/Solar). Den Inhalt der .env habe ich nicht gelesen.
  `grep -c '^PVM_SMTP_FROM=info@photovoltaikperformancepro.com' /root/pv-monteur-live/.env   # 1 = richtig`
- AGB/AVV vor dem Pilot anwaltlich prüfen lassen oder als Entwurf bewusst akzeptieren. Die AVV mit dem Pilotkunden außerhalb der App unterschreiben lassen, weil es keine Zustimmung in der App gibt.
- Die Rechnung für den Kunden in Flux anlegen. Für den Watcher fehlt weiterhin `flux=/root/Projekte/flux` in `server/projekte.conf`.
- Testsuite weiterlaufen lassen, mit mehr Zeit je Teil:
  `cd /root/pv-monteur/.wt-kundenbetrieb && for k in $(seq 1 12); do timeout 900 npm run -s test:teil -- $k/12 > /root/pv-monteur/scratchpad/lauf12-teil-$k.log 2>&1; done   #`
  Nicht im Hauptordner ohne `PVM_DATEN_PFAD` starten, denn `data/` dort ist der Live-Bestand.
- In `/root/pv-monteur` liegt eine nicht committete Änderung an `scripts/betrieb-online.sh`, die nicht von mir ist. Ich habe sie nicht angefasst.

## Fragen an Claude Desktop

1. Den Rest der Testsuite in einem Fortsetzungsauftrag laufen lassen? Mit 300 s je Teil reicht die Zeit nicht. Vorschlag: `timeout 900` oder 24 Teile.
2. Soll der Hygiene-Fehler „AK 59“ (echte Adressen in zwei Testdateien vom 19.11.) als kleiner Auftrag behoben werden? Er bremst jeden vollständigen Testlauf.
3. Sollen die Zweige Modulanzahl und Steinpleis (`steinpleis-import`) vor dem Pilot live gehen, oder startet der Kunde auf dem jetzigen Live-Stand plus Werkzeug?
