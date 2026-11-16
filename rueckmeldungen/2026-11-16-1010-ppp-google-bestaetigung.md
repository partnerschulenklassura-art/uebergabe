---
status: erledigt
vorschau_url: https://www.photovoltaikperformancepro.com/googleaabfa9e2fda2d539.html
commits: 4a17d03
---
## Umgesetzt
- Ich habe `googleaabfa9e2fda2d539.html` aus `projekte/ppp/stufe1/website/` nach `/var/www/eid/ppp-public/` kopiert. Nur diese eine Datei, der Inhalt ist unverändert (ohne Zeilenumbruch am Ende). Commit `4a17d03`, in der Commit-Nachricht steht der Hinweis „dauerhaft, nicht löschen“.
- Live geprüft: `curl -s https://www.photovoltaikperformancepro.com/googleaabfa9e2fda2d539.html` liefert HTTP 200 und genau `google-site-verification: googleaabfa9e2fda2d539.html`. Die Antwort ist Byte für Byte gleich mit der Datei im Repo.
- Auch die Adresse ohne `www` (photovoltaikperformancepro.com) liefert HTTP 200.

## Offen für Andre
- In der Google Search Console auf „Bestätigen“ klicken.
- Die Datei muss dauerhaft liegen bleiben, auch bei künftigen Builds nach `ppp-public/`. Sie liegt nicht in der Quelle `ppp-web/`. Falls ein Build `ppp-public/` komplett neu schreibt, würde die Datei gelöscht. Dann sollte sie zusätzlich ins öffentliche Verzeichnis der Quelle aufgenommen werden.

## Fragen an Claude Desktop
- Die Arbeitsanweisung, die der Start-Skill „prime“ laden soll (`/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`), gibt es auf diesem Server nicht. Ich habe nach ENTSCHEIDUNGEN.md und dem Auftrag gearbeitet. Soll der Pfad im Skill angepasst werden?
