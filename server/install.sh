#!/usr/bin/env bash
# Einmalig auf srv1171441 ausführen:  bash install.sh git@github.com:BENUTZER/uebergabe.git
set -euo pipefail
URL="${1:?Repo-URL angeben, z. B. git@github.com:BENUTZER/uebergabe.git}"
KEY="$HOME/.ssh/uebergabe_deploy"

command -v claude >/dev/null || { echo "claude CLI nicht gefunden"; exit 1; }

if [[ ! -f "$KEY" ]]; then
  ssh-keygen -t ed25519 -N "" -C "uebergabe@srv1171441" -f "$KEY" >/dev/null
  grep -q "Host github-uebergabe" "$HOME/.ssh/config" 2>/dev/null || cat >>"$HOME/.ssh/config" <<CFG

Host github-uebergabe
  HostName github.com
  User git
  IdentityFile $KEY
  IdentitiesOnly yes
CFG
  echo; echo "== Diesen Schlüssel in GitHub als Deploy Key MIT Schreibrecht eintragen =="
  echo "   (Repo → Settings → Deploy keys → Add deploy key → 'Allow write access')"; echo
  cat "$KEY.pub"; echo
  read -rp "Eingetragen? Enter drücken …"
fi

URL_ALIAS="$(echo "$URL" | sed 's#git@github.com:#github-uebergabe:#')"
[[ -d "$HOME/uebergabe/.git" ]] || git clone "$URL_ALIAS" "$HOME/uebergabe"
cd "$HOME/uebergabe"
git config user.name  "Claude Code (srv1171441)"
git config user.email "claude-code@srv1171441"

mkdir -p "$HOME/.config/systemd/user"
cat >"$HOME/.config/systemd/user/uebergabe-watcher.service" <<UNIT
[Unit]
Description=Übergabe-Watcher (Claude Desktop -> Claude Code)
[Service]
Type=oneshot
Environment=PATH=$(dirname "$(command -v claude)"):/usr/local/bin:/usr/bin:/bin
ExecStart=$HOME/uebergabe/server/watcher.sh
UNIT
cat >"$HOME/.config/systemd/user/uebergabe-watcher.timer" <<UNIT
[Unit]
Description=Übergabe-Watcher jede Minute
[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
[Install]
WantedBy=timers.target
UNIT

loginctl enable-linger "$USER" 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user enable --now uebergabe-watcher.timer
echo; echo "Fertig. Status:  systemctl --user list-timers | grep uebergabe"
echo "Log:            tail -f ~/.uebergabe-watcher.log"
echo "Jetzt noch Projekte in ~/uebergabe/server/projekte.conf eintragen, committen und pushen."
