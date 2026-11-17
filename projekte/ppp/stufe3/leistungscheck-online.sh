#!/usr/bin/env bash
# Leistungscheck online stellen: Dienst starten, Nginx-Weiterleitung einrichten, Website mit der neuen Seite ausliefern.
# Als root:  cd ~/uebergabe && git pull && bash projekte/ppp/stufe3/leistungscheck-online.sh
set -euo pipefail
cd "$(dirname "$0")"
API=/var/www/eid/ppp-api
WEB=/var/www/eid/ppp-public
NGX=/etc/nginx/sites-available/ppp
STAMP=$(date +%Y%m%d-%H%M)

echo "== 1. Dienst prüfen und starten"
cd "$API"
npm install --omit=dev --silent
npm test --silent >/dev/null && echo "   Tests grün" || { echo "   STOPP: Tests im Dienst schlagen fehl"; exit 1; }
mkdir -p data
pm2 describe ppp-api >/dev/null 2>&1 && pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
pm2 save >/dev/null
sleep 2
curl -fsS http://127.0.0.1:3140/api/leistungscheck/gesund >/dev/null && echo "   Dienst läuft auf Port 3140"
cd - >/dev/null

echo "== 2. Nginx: /api/leistungscheck/ an den Dienst"
if grep -q "location /api/leistungscheck/" "$NGX"; then
  echo "   schon eingerichtet"
else
  cp "$NGX" "/root/ppp.nginx.vor-leistungscheck-$STAMP"
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
if i < 0: sys.exit('location / nicht gefunden')
open(p, 'w').write(s[:i] + block + s[i:])
PY
  nginx -t && systemctl reload nginx && echo "   eingerichtet (Sicherung: /root/ppp.nginx.vor-leistungscheck-$STAMP)"
fi

echo "== 3. Website mit Leistungscheck ausliefern"
rsync -a --delete website/ "$WEB/"
cd "$WEB" && git add -A . >/dev/null 2>&1 && git commit -qm "Leistungscheck online" >/dev/null 2>&1 || true; cd - >/dev/null

echo "== 4. Wetter-Zwischenspeicher füllen und testen"
(cd "$API" && timeout 150 npm run probe:wetter --silent >/dev/null 2>&1 && echo "   Wettermittel vorbereitet") || echo "   Wetter-Probe übersprungen (läuft beim ersten Kunden)"
for p in "ort?q=08412%20Werdau" "referenz?lat=50.73&lon=12.38&azimut=0&neigung=30&aufgestaendert=0"; do
  printf "   %-60s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "https://www.photovoltaikperformancepro.com/api/leistungscheck/$p"
done
curl -s -o /dev/null -w "   Seite /leistungscheck/ %{http_code}\n" https://www.photovoltaikperformancepro.com/leistungscheck/
echo "Fertig. Zurück: pm2 stop ppp-api; Nginx-Sicherung zurückkopieren; vorherige Website aus /var/www/eid (git) wiederherstellen."
