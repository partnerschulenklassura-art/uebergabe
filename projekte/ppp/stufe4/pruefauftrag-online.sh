#!/usr/bin/env bash
# Prüfaufträge aus dem Leistungscheck live schalten (PV-Monteur ⇄ ppp-api ⇄ Website).
# Als root:  cd ~/uebergabe && git pull && bash projekte/ppp/stufe4/pruefauftrag-online.sh
# Fragt einmal nach der Firma (Nummer aus einer Liste). Schlüssel und Geheimnis erscheinen nie am Bildschirm.
set -euo pipefail
export PATH="$PATH:/usr/sbin:/sbin"
HIER="$(cd "$(dirname "$0")" && pwd)"
PVM_DEV=/root/pv-monteur
PVM=/root/pv-monteur-live
API=/var/www/eid/ppp-api
WEB=/var/www/eid/ppp-public
RELEASE=release-2026-11-18-lc
DOMAIN=https://www.photovoltaikperformancepro.com
STAMP=$(date +%Y%m%d-%H%M)
SICHER=/root/sicherung-pruefauftrag-$STAMP

setze() { # setze DATEI NAME WERT  (ersetzt oder hängt an, ohne Ausgabe)
  local f="$1" k="$2" v="$3"
  touch "$f"; chmod 600 "$f"
  if grep -q "^$k=" "$f"; then
    python3 - "$f" "$k" "$v" <<'PY'
import sys
f,k,v=sys.argv[1:]
z=open(f).read().splitlines()
open(f,'w').write('\n'.join((k+'='+v) if l.startswith(k+'=') else l for l in z)+'\n')
PY
  else printf '%s=%s\n' "$k" "$v" >> "$f"; fi
}

echo "== 0. Vorprüfung"
git -C "$PVM_DEV" rev-parse --verify -q "$RELEASE" >/dev/null || { echo "   STOPP: Zweig $RELEASE fehlt in $PVM_DEV"; exit 1; }
for d in index.html leistungscheck/index.html leistungscheck/status/index.html leistungscheck/status/status.js datenschutz.html googleaabfa9e2fda2d539.html; do
  [ -e "$HIER/website/$d" ] || { echo "   STOPP: website/$d fehlt. Erst 'git pull'."; exit 1; }
done
curl -fsS --max-time 10 http://127.0.0.1:3140/api/leistungscheck/gesund >/dev/null || { echo "   STOPP: ppp-api antwortet nicht"; exit 1; }
echo "   in Ordnung"

echo "== 1. Sicherung nach $SICHER"
mkdir -p "$SICHER"; chmod 700 "$SICHER"
[ -f "$PVM/.env" ] && cp "$PVM/.env" "$SICHER/pv-monteur.env"
[ -f "$API/.env" ] && cp "$API/.env" "$SICHER/ppp-api.env"
cp -a "$WEB" "$SICHER/ppp-public"
echo "   gesichert"

echo "== 2. Gemeinsames Geheimnis und Schalter (ohne Anzeige)"
if grep -q '^PVM_LC_WEBHOOK_GEHEIMNIS=.' "$PVM/.env" 2>/dev/null; then
  GEHEIM=$(grep '^PVM_LC_WEBHOOK_GEHEIMNIS=' "$PVM/.env" | head -1 | cut -d= -f2-)
else
  GEHEIM=$(openssl rand -hex 32)
fi
setze "$PVM/.env" PVM_LEISTUNGSCHECK an
setze "$PVM/.env" PVM_LC_WEBHOOK_URL http://127.0.0.1:3140/api/leistungscheck/pvm-hinweis
setze "$PVM/.env" PVM_LC_WEBHOOK_GEHEIMNIS "$GEHEIM"
setze "$API/.env" PVM_LC_WEBHOOK_GEHEIMNIS "$GEHEIM"
unset GEHEIM
echo "   gesetzt"

echo "== 3. PV-Monteur ausliefern ($RELEASE)"
bash "$PVM_DEV/scripts/auslieferung-leistungscheck.sh" "$RELEASE"
for i in $(seq 1 15); do curl -fsS --max-time 5 http://127.0.0.1:3821/api/gesundheit >/dev/null 2>&1 && break; sleep 2; done
curl -fsS --max-time 5 http://127.0.0.1:3821/api/gesundheit >/dev/null || { echo "   STOPP: PV-Monteur antwortet nicht. Rückweg: bash $PVM/scripts/rueckweg-leistungscheck.sh"; exit 1; }
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3821/api/v1/leistungscheck/pruefauftraege/LC-PROBE)
[ "$CODE" = "401" ] && echo "   PV-Monteur läuft, Schnittstelle an (ohne Schlüssel 401)" || { echo "   STOPP: Schnittstelle antwortet $CODE statt 401"; exit 1; }

echo "== 4. Schlüssel für deinen Betrieb ausstellen"
cd "$PVM"
node -e 'const f=require("./data/firmen.json");const l=Array.isArray(f)?f:(f.eintraege||Object.values(f));l.forEach((x,i)=>console.log("   ["+(i+1)+"] "+x.name+"  ("+x.id+")"))'
read -rp "   Nummer deines Betriebs aus der Liste: " NR
FIRMA=$(node -e 'const f=require("./data/firmen.json");const l=Array.isArray(f)?f:(f.eintraege||Object.values(f));const x=l[Number(process.argv[1])-1];if(!x)process.exit(1);process.stdout.write(String(x.id))' "$NR") || { echo "   STOPP: ungültige Nummer"; exit 1; }
SCHLUESSEL=$(node tools/schluessel-ausstellen.js --firma "$FIRMA" | grep -oE '^pvm_lc_[0-9a-f]{8}_[0-9a-f]{32}$' | head -1) || true
[ -n "$SCHLUESSEL" ] || { echo "   STOPP: Schlüssel nicht erhalten"; exit 1; }
setze "$API/.env" PVM_LC_SCHLUESSEL "$SCHLUESSEL"
unset SCHLUESSEL
cd "$HIER"
echo "   Schlüssel ausgestellt und in ppp-api eingetragen (nicht angezeigt)"

echo "== 5. ppp-api neu laden"
pm2 reload ppp-api --update-env >/dev/null
for i in $(seq 1 10); do curl -fsS --max-time 5 http://127.0.0.1:3140/api/leistungscheck/gesund >/dev/null 2>&1 && break; sleep 1; done
curl -fsS --max-time 5 http://127.0.0.1:3140/api/leistungscheck/gesund >/dev/null && echo "   ppp-api läuft" || { echo "   STOPP: ppp-api antwortet nach Reload nicht. Rückweg: .env aus $SICHER zurück, pm2 reload ppp-api --update-env"; exit 1; }

echo "== 6. Website ausliefern"
rsync -a --delete "$HIER/website/" "$WEB/"
git -C /var/www/eid add -A ppp-public >/dev/null 2>&1 && git -C /var/www/eid commit -qm "Prüfauftrag aus dem Leistungscheck online" -- ppp-public >/dev/null 2>&1 || true
echo "   ausgeliefert"

echo "== 7. Testauftrag"
NUM="LC-TEST-$(date +%Y%m%d%H%M)"
ANTWORT=$(curl -s --max-time 30 -H 'content-type: application/json' -X POST "$DOMAIN/api/leistungscheck/pruefauftrag" -d @- <<JSON
{"fremdnummer":"$NUM","website":"","eigentuemer":{"name":"TEST Leistungscheck (bitte löschen)","telefon":"0000000000","email":"info@photovoltaikperformancepro.com"},
 "anlage":{"adresse":"Teststraße 1, 08412 Werdau","lat":50.73,"lon":12.35,"art":"dach","kwp":10,"inbetriebnahme_jahr":2015,"teilflaechen":[{"azimut":0,"neigung":30,"kwp":10}]},
 "einschaetzung":{"stufe":"auffaellig","performance":0.85,"soll_kwh":11142,"ist_kwh":9500,"zerlegung":{"alterung":839,"planung":0,"ac":0,"rest":1642},"ursachen":["Verschmutzung"],"pruefpunkte":[],"protokoll_pruefsumme":"$(printf %s "$NUM" | sha256sum | cut -d' ' -f1)"},
 "wunschtermin":"Test","einwilligung":{"datenschutz":true,"zeitpunkt":"$(date -u +%FT%TZ)","fassung":"ppp-datenschutz-2026-11-18"}}
JSON
)
AUFTRAG=$(printf %s "$ANTWORT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.auftragsnummer||"")}catch{}})')
LINK=$(printf %s "$ANTWORT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.statuslink||"")}catch{}})')
if [ -n "$AUFTRAG" ]; then
  echo "   Testauftrag angelegt: $AUFTRAG ($NUM)"
  printf "   Status abrufbar: "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 20 "$DOMAIN/api/leistungscheck/pruefauftrag/$NUM?${LINK#*\?}" | sed 's/^/HTTP /' || true
  echo "   Bitte in PV-Monteur den Auftrag $AUFTRAG („TEST Leistungscheck“) löschen. Die Mail dazu sollte bei der Leitung angekommen sein."
else
  echo "   STOPP: Testauftrag nicht angelegt. Antwort: $(printf %s "$ANTWORT" | head -c 300)"
  exit 1
fi
curl -s -o /dev/null -w "   Seite /leistungscheck/status/ %{http_code}\n" "$DOMAIN/leistungscheck/status/"
echo "Fertig. Sicherung: $SICHER"
echo "Zurück: bash $PVM/scripts/rueckweg-leistungscheck.sh; .env-Dateien und ppp-public aus $SICHER zurückkopieren; pm2 reload ppp-api --update-env"
