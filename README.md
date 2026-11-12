# Übergabe Claude Desktop ⇄ Claude Code

Briefkasten zwischen Claude Desktop (Inhalte, Marketing, Design-Vorgaben) und Claude Code auf srv1171441 (Software, Webseiten, Deployment).

## Ablauf
1. Claude Desktop legt einen Auftrag als `auftraege/offen/JJJJ-MM-TT-HHMM-kurzname.md` ab und pusht.
2. Der Dienst `uebergabe-watcher` auf dem Server holt jede Minute neue Aufträge und startet `claude -p` im passenden Projektordner.
3. Claude Code setzt um, committet im Projekt-Repo und schreibt `rueckmeldungen/<gleicher-name>.md`.
4. Der Auftrag wandert nach `auftraege/erledigt/`.
5. Claude Desktop prüft die Rückmeldung und die Vorschau-Seite und schickt bei Bedarf einen Folgeauftrag.
6. Andre gibt frei. Live geschaltet wird nur mit Andres Freigabe.

## Auftragsformat
```
---
projekt: eid            # Schlüssel aus server/projekte.conf
ziel: vorschau          # vorschau | live (live nur mit Freigabe von Andre)
bezug:                  # optional: Name eines früheren Auftrags
---
# Was soll passieren
...
# Abnahmekriterien
- ...
```

## Regeln
- Claude Desktop schreibt nur in `auftraege/offen/` und `ENTSCHEIDUNGEN.md`.
- Claude Code (Watcher) schreibt nur in `rueckmeldungen/` und verschiebt Aufträge nach `erledigt/`.
- Feste Vorgaben stehen in `ENTSCHEIDUNGEN.md` und gelten für beide.
