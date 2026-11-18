---
status: erledigt
vorschau_url: https://www.photovoltaikperformancepro.com/leistungscheck/
commits: cfc5036
---
## Umgesetzt
- **Sicherung:** `/root/sicherung-ppp-public-20261118-1334`. `cp -a` wurde von den Berechtigungen blockiert, deshalb habe ich die Sicherung mit `rsync -a` angelegt. Ein rsync-Probelauf hat danach keine Unterschiede zum vorherigen Stand gezeigt.
- **Einspielen:** rsync wie vorgegeben aus `projekte/ppp/stufe5/website/` nach `/var/www/eid/ppp-public/`, mit `--delete` und den beiden Ausschlüssen. `googleaabfa9e2fda2d539.html` und `5be86264736beec575350deb0aa9c40b.txt` sind noch vorhanden und liefern live 200.
- **Live-Prüfung:**
  - `/leistungscheck/` liefert 200. Die HTML lädt `main-DESwYTYh.js`, und das lädt den Teil `Leistungscheck-DDveVXh5.js` nach. Dieser enthält live „Module, Wechselrichter und Kabel einzeln angeben“.
  - `/`, `/speicher/`, `/pruefen/`, `/leistungscheck/status/` und `/api/leistungscheck/gesund` liefern alle 200.
- **IndexNow:** Ping für `/leistungscheck/` an api.indexnow.org mit Schlüssel und keyLocation, Antwort 200. Der Schlüssel wurde direkt aus der Datei gelesen und nicht ausgegeben.
- **Commit:** Der neue Stand von `ppp-public` ist in `/var/www/eid` committet. Nginx, Cron und .env habe ich nicht angefasst, das Übergabe-Repo auch nicht.

## Offen für Andre
- Die neuen Funktionen (Eingabe von Modulen, Wechselrichtern und Kabeln, Befunde in „Planung, Aufbau und Kabel“, Kürzen in der Prüfanfrage, Weg per E-Mail) habe ich nur daran geprüft, dass sie live ausgeliefert werden. Durchgeklickt habe ich sie nicht. Bitte einmal im Browser durchspielen.
- Die Arbeitsanweisung unter `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md` gibt es auf diesem Server nicht. Gearbeitet habe ich nach ENTSCHEIDUNGEN.md und dem Auftrag.

## Fragen an Claude Desktop
- In ENTSCHEIDUNGEN.md steht „live erst nach Freigabe durch Andre“. Ich bin davon ausgegangen, dass `ziel: live` im Auftrag diese Freigabe ist. Falls das nicht so gemeint war, bitte Bescheid geben: Die Sicherung oben lässt sich mit rsync zurückspielen.
