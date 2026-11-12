#!/usr/bin/env bash
# Holt neue Aufträge aus dem Übergabe-Repo und lässt sie von Claude Code abarbeiten.
set -uo pipefail
REPO="${UEBERGABE_REPO:-$HOME/uebergabe}"
CONF="$REPO/server/projekte.conf"
LOG="$HOME/.uebergabe-watcher.log"
exec 9>/tmp/uebergabe-watcher.lock
flock -n 9 || exit 0   # läuft schon

cd "$REPO" || exit 1
git pull -q --rebase 2>>"$LOG" || { echo "$(date -Is) pull fehlgeschlagen" >>"$LOG"; exit 1; }
# Falls ein früherer Push scheiterte: nachholen
git push -q 2>>"$LOG" || true

shopt -s nullglob
for auftrag in auftraege/offen/*.md; do
  name="$(basename "$auftrag" .md)"
  projekt="$(sed -n 's/^projekt:[[:space:]]*\([a-z0-9_-]*\).*/\1/p' "$auftrag" | head -1)"
  pfad="$(grep -E "^${projekt}=" "$CONF" 2>/dev/null | head -1 | cut -d= -f2-)"
  rueck="rueckmeldungen/$name.md"

  if [[ -z "$projekt" || -z "$pfad" || ! -d "$pfad" ]]; then
    printf -- "---\nstatus: abgelehnt\n---\nProjekt '%s' fehlt in server/projekte.conf oder Ordner existiert nicht.\n" "$projekt" >"$rueck"
  else
    echo "$(date -Is) starte $name in $pfad" >>"$LOG"
    prompt="Du bekommst einen Auftrag von Claude Desktop über das Übergabe-Repo.
Lies zuerst $REPO/ENTSCHEIDUNGEN.md und halte dich daran.
Arbeite ausschließlich in $pfad. Committe nach jedem lauffähigen Stand.
Keine Eingriffe an Nginx, Datenbank-Schema, Systemdiensten oder Secrets – liste so etwas unter 'Offen für Andre'.
Live schalten nur, wenn im Auftrag 'ziel: live' steht.

AUFTRAG ($name):
$(cat "$auftrag")

Antworte am Ende auf Deutsch in diesem Format:
---
status: erledigt | teilweise | blockiert
vorschau_url: <URL oder leer>
commits: <Hashes>
---
## Umgesetzt
## Offen für Andre
## Fragen an Claude Desktop"
    ( cd "$pfad" && timeout 1800 claude -p "$prompt" \
        --permission-mode acceptEdits \
        --allowedTools "Read,Edit,Write,Glob,Grep,Bash(git:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(pm2 list),Bash(pm2 jlist),Bash(pm2 describe:*),Bash(pm2 restart:*),Bash(pm2 reload:*),Bash(ls:*),Bash(cat:*),Bash(curl:*)" \
      ) >"$rueck" 2>&1 || echo -e "\n(Claude Code beendet mit Fehler/Timeout – siehe Server-Log)" >>"$rueck"
  fi

  git mv -f "$auftrag" "auftraege/erledigt/$name.md"
  git add "$rueck"
  git commit -qm "Rückmeldung: $name"
  git push -q 2>>"$LOG" || { git pull -q --rebase 2>>"$LOG" && git push -q 2>>"$LOG"; } || echo "$(date -Is) PUSH FEHLGESCHLAGEN für $name" >>"$LOG"
  echo "$(date -Is) fertig $name" >>"$LOG"
done
