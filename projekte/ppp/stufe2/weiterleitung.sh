#!/usr/bin/env bash
# Leitet photovoltaikperformancepro.com (ohne www) dauerhaft auf https://www.photovoltaikperformancepro.com weiter.
# Als root: bash weiterleitung.sh
set -euo pipefail
F=/etc/nginx/sites-available/ppp
grep -q 'return 301 https://www.photovoltaikperformancepro.com' "$F" && { echo "Weiterleitung ist schon drin."; exit 0; }
cp "$F" "/root/ppp.nginx.vor-weiterleitung-$(date +%Y%m%d-%H%M)"
sed -i 's#^\(\s*\)root /var/www/eid/ppp-public;#&\n\1if ($host = photovoltaikperformancepro.com) { return 301 https://www.photovoltaikperformancepro.com$request_uri; }#' "$F"
nginx -t && systemctl reload nginx
curl -sI https://photovoltaikperformancepro.com/ | grep -iE '^(HTTP|location)'
