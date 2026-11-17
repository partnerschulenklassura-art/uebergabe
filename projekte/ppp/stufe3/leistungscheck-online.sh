#!/usr/bin/env bash
# Leistungscheck online stellen: Dienst starten, Nginx-Weiterleitung einrichten, Website mit der neuen Seite ausliefern.
# Als root:  cd ~/uebergabe && git pull && bash projekte/ppp/stufe3/leistungscheck-online.sh
# Schutzschritte nach Prüfung durch Claude Code (Rückmeldung 2026-11-17-1700) übernommen.
set -euo pipefail
export PATH="$PATH:/usr/sbin:/sbin"
HIER="$(cd "$(dirname "$0")" && pwd)"
API=/var/www/eid/ppp-api
WEB=/var/www/eid/ppp-public
NGX=/etc/nginx/sites-available/ppp
DOMAIN=https://www.photovoltaikperformancepro.com
STAMP=$(date +%Y%m%d-%H%M)

echo "== 0. Vorprüfung"
for d in index.html leistungscheck/index.html speicher/index.html pruefen/index.html datenschutz.html googleaabfa9e2fda2d539.html assets; do
  [ -e "$HIER/website/$d" ] || { echo "   STOPP: $HIER/website/$d fehlt. Erst 'git pull' im Übergabe-Ordner."; exit 1; }
done
[ -d "$API" ] || { echo "   STOPP: $API fehlt."; exit 1; }
[ "$(grep -c '^  location / {' "$NGX")" = "1" ] || { echo "   STOPP: In $NGX steht nicht genau ein '  location / {'. Bitte Claude Code fragen."; exit 1; }
echo "   in Ordnung"

echo "== 1. Dienst prüfen und starten"
cd "$API"
npm install --omit=dev --silent
npm test --silent >/dev/null 2>&1 && echo "   Tests grün" || { echo "   STOPP: Tests im Dienst schlagen fehl"; exit 1; }
mkdir -p data
if pm2 describe ppp-api >/dev/null 2>&1; then pm2 reload ecosystem.config.cjs >/dev/null; else pm2 start ecosystem.config.cjs >/dev/null; fi
pm2 save >/dev/null
ok=0
for i in $(seq 1 10); do
  if curl -fsS http://127.0.0.1:3140/api/leistungscheck/gesund >/dev/null 2>&1; then ok=1; break; fi
  sleep 1
done
[ "$ok" = 1 ] && echo "   Dienst läuft auf Port 3140" || { echo "   STOPP: Dienst antwortet nicht. Log: pm2 logs ppp-api --lines 50"; exit 1; }
cd "$HIER"

echo "== 2. Nginx: /api/leistungscheck/ an den Dienst"
if grep -q "location /api/leistungscheck/" "$NGX"; then
  echo "   schon eingerichtet"
else
  SICHERUNG="/root/ppp.nginx.vor-leistungscheck-$STAMP"
  cp "$NGX" "$SICHERUNG"
  python3 - "$NGX" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
block = """  location /api/leistungscheck/ {
    proxy_pass http://127.0.0.1:3140;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 70s;
    proxy_send_timeout 70s;
  }
"""
i = s.find('  location / {')
open(p, 'w').write(s[:i] + block + s[i:])
PY
  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx && echo "   eingerichtet (Sicherung: $SICHERUNG)"
  else
    cp "$SICHERUNG" "$NGX"; nginx -t >/dev/null 2>&1 && systemctl reload nginx
    echo "   STOPP: Nginx-Prüfung fehlgeschlagen, alte Einstellung wiederhergestellt."; exit 1
  fi
fi

echo "== 3. Website mit Leistungscheck ausliefern"
rsync -a --delete "$HIER/website/" "$WEB/"
if git -C /var/www/eid rev-parse >/dev/null 2>&1; then
  git -C /var/www/eid add -A ppp-public >/dev/null 2>&1 && git -C /var/www/eid commit -qm "Leistungscheck online" -- ppp-public >/dev/null 2>&1 || true
fi
echo "   ausgeliefert"

echo "== 4. Zwischenspeicher füllen und live testen"
(cd "$API" && timeout 150 npm run probe:wetter --silent >/dev/null 2>&1 && echo "   Wettermittel vorbereitet") || echo "   Wetter-Probe übersprungen (läuft beim ersten Nutzer)"
for p in "ort?q=08412%20Werdau" "referenz?lat=50.73&lon=12.38&azimut=0&neigung=30&aufgestaendert=0" "umgebung?lat=50.73&lon=12.38"; do
  printf "   %-62s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" --max-time 70 "$DOMAIN/api/leistungscheck/$p" || echo "keine Antwort"
done
curl -s -o /dev/null -w "   Seite /leistungscheck/  %{http_code}\n" "$DOMAIN/leistungscheck/"
echo "Fertig."
echo "Zurück: pm2 stop ppp-api; Nginx-Sicherung aus /root/ zurückkopieren und 'systemctl reload nginx'; Website: git -C /var/www/eid log -- ppp-public"
