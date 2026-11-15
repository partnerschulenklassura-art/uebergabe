#!/usr/bin/env bash
# PV Performance Pro – Stufe 1 (Startseite + Speicher) auf srv1171441 online stellen.
# Als root in diesem Ordner ausführen:  bash online.sh
set -euo pipefail
DOMAIN=photovoltaikperformancepro.com
WEB=/var/www/eid/ppp-public
BACKUP=/root/backup-ppp-$(date +%Y%m%d-%H%M)
cd "$(dirname "$0")"

echo "== 1. Sicherung von allem, was die Domain heute benutzt -> $BACKUP"
mkdir -p "$BACKUP"
for f in $(grep -Rl "$DOMAIN" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || true); do
  cp -L "$f" "$BACKUP/"; echo "   Konfiguration gesichert: $f"
done
grep -Rh "server_name" /etc/nginx/sites-enabled/ 2>/dev/null | grep "$DOMAIN" | grep -q "kritis\." && echo "   Hinweis: kritis.$DOMAIN bleibt unberührt, nur www und die Hauptdomain werden umgestellt."

echo "== 2. Website kopieren nach $WEB"
mkdir -p "$WEB"; rsync -a --delete website/ "$WEB/"

echo "== 3. Nginx"
# Läuft die Domain schon in einer anderen Konfiguration?
# Bedient die Datei NUR photovoltaikperformancepro.com/www: abschalten (Kopie im Backup). Bedient sie mehr: stoppen und melden.
for f in $(grep -RlE "server_name[^;]*[[:space:]](www\.)?$DOMAIN[[:space:];]" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v '/ppp$' || true); do
  OTHER=$(grep -hE '^\s*server_name' "$f" | sed 's/server_name//; s/;//' | tr ' ' '\n' | grep -vE "^$|^(www\.)?$DOMAIN$" || true)
  if [ -n "$OTHER" ]; then
    echo "   STOPP: $f bedient auch: $OTHER"
    echo "   Dort nur $DOMAIN und www.$DOMAIN aus server_name entfernen (Kopie in $BACKUP), dann das Skript erneut starten."
    exit 1
  fi
  rm -f "$f"; echo "   alte Seite abgeschaltet: $f (Kopie in $BACKUP, Original bleibt in sites-available)"
done
cat > /etc/nginx/sites-available/ppp <<NGX
server {
  listen 80;
  server_name $DOMAIN www.$DOMAIN;
  root $WEB;
  index index.html;
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  location /assets/ { expires 1y; }
  location / { try_files \$uri \$uri/ \$uri.html =404; }
}
NGX
ln -sf /etc/nginx/sites-available/ppp /etc/nginx/sites-enabled/ppp
nginx -t && systemctl reload nginx

echo "== 4. HTTPS"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect --expand --non-interactive --agree-tos -m info@$DOMAIN \
  || echo "   Zertifikat fehlgeschlagen. Zeigt die Domain auf diesen Server? Prüfen: dig +short www.$DOMAIN"

echo "== 5. Test"
curl -sI https://www.$DOMAIN/ | head -1 || true
curl -sI https://www.$DOMAIN/speicher/ | head -1 || true
echo "Fertig. Zurück zum alten Stand: Dateien aus $BACKUP zurückkopieren, /etc/nginx/sites-enabled/ppp löschen, nginx neu laden."
