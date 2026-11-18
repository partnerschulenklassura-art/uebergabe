Die Arbeitsanweisung unter `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md` gibt es nicht. Maßgeblich waren deshalb `ENTSCHEIDUNGEN.md` und der Auftrag.

---
status: erledigt
vorschau_url:
commits: keine (nichts geändert)
---
## Umgesetzt
1. Vollständiger Inhalt von `/var/www/eid/ppp-stufe5/html-cache.sh` (Stand Commit `bb9323a`, 126 Zeilen, nichts gekürzt):

```bash
#!/usr/bin/env bash
# Cache-Köpfe für www.photovoltaikperformancepro.com:
#   HTML (/, /…/, *.html)  → Cache-Control: no-cache
#   /assets/ (gehasht)      → Cache-Control: public, max-age=31536000, immutable
# Die Sicherheitsköpfe (CSP, X-Content-Type-Options, Referrer-Policy) werden aus dem
# server-Block in ein Snippet übernommen und in jeder geänderten location eingebunden,
# weil ein add_header in einer location alle add_header des server-Blocks aufhebt.
# /api/ wird nicht verändert (der Block wird vorher/nachher verglichen).
#
# Als root:      bash html-cache.sh
# Nur Diff zeigen (ändert nichts): bash html-cache.sh --trocken
set -euo pipefail

F=/etc/nginx/sites-available/ppp
SNIP=/etc/nginx/snippets/ppp-sicherheit.conf
HOST=https://www.photovoltaikperformancepro.com
TROCKEN=0; [ "${1:-}" = "--trocken" ] && TROCKEN=1

fehler() { echo "FEHLER: $*" >&2; exit 1; }

[ -f "$F" ] || fehler "$F fehlt."
grep -q 'ppp_html_cache' "$F" && { echo "Änderung ist schon drin – nichts zu tun."; exit 0; }

# Erwartete Zeilen genau einmal vorhanden?
ASSETS_ALT='  location /assets/ { expires 1y; }'
ROOT_ALT='  location / { try_files $uri $uri/ $uri.html =404; }'
[ "$(grep -cxF "$ASSETS_ALT" "$F")" = 1 ] || fehler "Zeile '$ASSETS_ALT' nicht genau einmal gefunden – Konfiguration hat sich geändert, bitte von Hand prüfen."
[ "$(grep -cxF "$ROOT_ALT" "$F")" = 1 ]   || fehler "Zeile '$ROOT_ALT' nicht genau einmal gefunden – Konfiguration hat sich geändert, bitte von Hand prüfen."

# Sicherheitsköpfe aus dem server-Block (Zeilen vor der ersten location) übernehmen
KOEPFE=$(awk '/^[[:space:]]*location /{exit} /^[[:space:]]*add_header /' "$F" | sed 's/^[[:space:]]*//')
for k in Content-Security-Policy X-Content-Type-Options Referrer-Policy; do
  grep -q "add_header $k " <<<"$KOEPFE" || fehler "Kopf $k im server-Block nicht gefunden."
done

api_block() { awk '/location \/api\//{p=1} p{print} p&&/^  }/{exit}' "$1"; }

# Neue Fassung in Arbeitsdatei bauen
NEU=$(mktemp); trap 'rm -f "$NEU"' EXIT
awk -v assets_alt="$ASSETS_ALT" -v root_alt="$ROOT_ALT" -v snip="$SNIP" '
  NR==1 {
    print "# HTML immer neu prüfen lassen; leerer Wert = Kopf wird nicht gesetzt"
    print "map $sent_http_content_type $ppp_html_cache {"
    print "  ~^text/html  \"no-cache\";"
    print "  default      \"\";"
    print "}"
    print ""
  }
  $0 == assets_alt {
    print "  location /assets/ {"
    print "    add_header Cache-Control \"public, max-age=31536000, immutable\" always;"
    print "    include " snip ";"
    print "  }"
    next
  }
  $0 == root_alt {
    print "  location / {"
    print "    add_header Cache-Control $ppp_html_cache always;"
    print "    include " snip ";"
    print "    try_files $uri $uri/ $uri.html =404;"
    print "  }"
    next
  }
  { print }
' "$F" > "$NEU"

[ "$(api_block "$F")" = "$(api_block "$NEU")" ] || fehler "/api/-Block würde sich ändern – Abbruch."

if [ "$TROCKEN" = 1 ]; then
  echo "=== Neues Snippet $SNIP ==="; echo "$KOEPFE"
  echo "=== Diff $F ==="; diff -u "$F" "$NEU" || true
  exit 0
fi

[ "$(id -u)" = 0 ] || fehler "Bitte als root ausführen."

# Sicherung
STEMPEL=$(date +%Y%m%d-%H%M%S)
SICH="/root/ppp.nginx.vor-html-cache-$STEMPEL"
cp -a "$F" "$SICH"
SNIP_NEU=0; [ -e "$SNIP" ] || SNIP_NEU=1
[ "$SNIP_NEU" = 1 ] || cp -a "$SNIP" "$SICH.snippet"
echo "Sicherung: $SICH"

zurueck() {
  echo "Setze zurück …" >&2
  cp -a "$SICH" "$F"
  if [ "$SNIP_NEU" = 1 ]; then rm -f "$SNIP"; else cp -a "$SICH.snippet" "$SNIP"; fi
  if nginx -t 2>/dev/null; then systemctl reload nginx; else echo "ACHTUNG: nginx -t schlägt auch nach dem Zurücksetzen fehl!" >&2; fi
}

# Änderung
printf '# Sicherheitsköpfe für photovoltaikperformancepro.com (aus %s übernommen, %s)\n%s\n' "$F" "$STEMPEL" "$KOEPFE" > "$SNIP"
cat "$NEU" > "$F"

if ! nginx -t; then
  zurueck; fehler "nginx -t fehlgeschlagen – Sicherung wiederhergestellt, nichts neu geladen."
fi
systemctl reload nginx
sleep 1

# Prüfung
ASSET=$(cd /var/www/eid/ppp-public/assets && ls -1 main-*.css 2>/dev/null | head -1)
[ -n "$ASSET" ] || ASSET=$(cd /var/www/eid/ppp-public/assets && ls -1 | head -1)
pruefe() { # url erwarteter-cache-control
  local url=$1 soll=$2 h
  h=$(curl -sSI "$url" | tr -d '\r')
  echo "--- $url"; grep -iE '^(HTTP|cache-control|expires|content-security-policy|x-content-type-options|referrer-policy):?' <<<"$h" || true
  grep -q '^HTTP/[0-9.]* 200' <<<"$h"                                   || { echo "kein 200"; return 1; }
  [ "$(grep -ic '^cache-control:' <<<"$h")" = 1 ]                       || { echo "Cache-Control fehlt oder doppelt"; return 1; }
  grep -qix "cache-control: $soll" <<<"$h"                              || { echo "Cache-Control ist nicht '$soll'"; return 1; }
  grep -qi "^content-security-policy: default-src 'self'" <<<"$h"       || { echo "CSP fehlt"; return 1; }
  grep -qi '^x-content-type-options: nosniff' <<<"$h"                   || { echo "X-Content-Type-Options fehlt"; return 1; }
  grep -qi '^referrer-policy: strict-origin-when-cross-origin' <<<"$h"  || { echo "Referrer-Policy fehlt"; return 1; }
}
OK=1
pruefe "$HOST/leistungscheck/"     "no-cache" || OK=0
pruefe "$HOST/"                    "no-cache" || OK=0
pruefe "$HOST/impressum"           "no-cache" || OK=0
pruefe "$HOST/assets/$ASSET"       "public, max-age=31536000, immutable" || OK=0

if [ "$OK" = 1 ]; then
  echo "Fertig."
else
  zurueck; fehler "Prüfung fehlgeschlagen – alte Konfiguration wiederhergestellt (Sicherung: $SICH)."
fi
```

2. **`bash -n` ging nicht:** Der Befehl wurde in dieser Sitzung nicht freigegeben. Die Syntax ist also maschinell nicht geprüft.
3. An Nginx habe ich nichts geändert und das Skript nicht ausgeführt.

Die Antworten zu `/img/`, `herkunft` und `modul_index` sind angekommen. Am Code war dafür nichts zu ändern.

## Offen für Andre
- Vor dem Ausführen selbst `bash -n /var/www/eid/ppp-stufe5/html-cache.sh` starten. Danach `bash html-cache.sh --trocken` aufrufen und Diff sowie Snippet ansehen. Erst dann als root ohne `--trocken` ausführen.

## Fragen an Claude Desktop
- Keine.
