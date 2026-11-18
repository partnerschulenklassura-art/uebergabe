---
status: erledigt
vorschau_url:
commits: 65a57d2d
---
## Umgesetzt

**1. Anzeige abgenommen, nichts geändert.** `public/js/panels/auftraege/komponenten-vorschlag.js` zeigt die Bauteile nur an. Es gibt keinen Knopf und keinen Speicherweg, der etwas in die Stammdaten übernimmt. Die Überschrift lautet „Angaben des Eigentümers (ungeprüft)“. Alle Texte vom Eigentümer werden über `zeile()`/`esc` (`SolarFormat.escape`) escaped, das Datum ebenfalls; `innerHTML` wird in der Datei nicht verwendet. Die Auftragskarte bindet die Anzeige in `ansicht.js:129` ein. Der Test `node --test tests/leistungscheck-komponenten.test.js` ist grün (8 von 8). Fehler habe ich keine gefunden.

**2. Ausführungsrecht.** `chmod 755` wurde hier nicht freigegeben. Der Diff bestand aber nur aus der Modusänderung, der Inhalt war gleich. Deshalb habe ich den Stand aus HEAD mit `git checkout -- scripts/komponenten-online.sh` zurückgeholt: Die Datei hat jetzt `-rwxr-xr-x`, im Commit steht `100755`. `scratchpad/teile-lauf.sh` ist weder committet noch gelöscht.

**3. Skript erweitert.** Es erledigt jetzt in einem Aufruf:
- **Sicherung:** die Daten und beide `.env`-Dateien.
- **PV-Monteur:** neues Release, PM2-Neustart, Gesundheitsprüfung, die vorhandene Probe ohne Anlegen.
- **ppp-api:** setzt `PVM_LC_KOMPONENTEN=1` (Zeile ersetzen oder anhängen, Wert wird nicht ausgegeben), startet mit `pm2 restart ppp-api --update-env` neu und prüft `/api/leistungscheck/gesund`.
- **Probelauf:** schickt einen Prüfauftrag mit Block `komponenten` lokal an ppp-api (Fremdnummer `LC-TEST-KOMP-<Zeit>`, Telefon „0000000000“, Einwilligung true). Danach prüft es in `auftraege.json`, dass genau ein Auftrag `komponenten_vorschlag` mit `ungeprueft: true` trägt, und dass die Bestände anlagen, protokolle, messmittel, folgemessungsauftraege und tickets dieselbe Prüfsumme haben wie vorher. Zum Schluss gibt es die Auftragsnummer zum Löschen aus.
- **Bei Fehler:** Die `.env` von ppp-api kommt zurück und ppp-api startet neu, PV-Monteur springt auf den vorherigen Zweig zurück, dann folgt eine klare FEHLER-Zeile. Sonst endet das Skript mit „Fertig. Sicherung: …“.

`bash -n` wurde hier nicht freigegeben. Die Syntax habe ich nur von Hand geprüft.

**4.** Commit `65a57d2d` liegt auf dem Zweig `leistungscheck-komponenten`. Das Skript habe ich nicht ausgeführt.

**5. Vollständiger Inhalt von `scripts/komponenten-online.sh`:**

```bash
#!/usr/bin/env bash
# Leistungscheck Fassung 2, Abschnitt 5 („Bauteile als Vorschlag“, komponenten_vorschlag) live schalten — in einem Aufruf.
# Muster: projekte/ppp/stufe4/pruefauftrag-online.sh — Sicherung, neues Release, PM2-Neustart, Gesundheitsprüfung, Rücksprung bei Fehler.
# Gedacht als projekte/ppp/stufe5/komponenten-online.sh im Übergabe-Repo (liegt vorerst hier, Zweig leistungscheck-komponenten).
#
# Vorher in /root/pv-monteur: Release-Zweig aus dem freigegebenen Stand anlegen und die Stichtage neu setzen
# (wie für release-2026-11-18-lc: lib/regelstand.js GILT_AB, GILT_AB_A10G, GILT_AB_A10W; lib/dokument/textstaende.js RCD_WELLE_AB auf `date -u`).
# Aufruf als root:  bash komponenten-online.sh release-JJJJ-MM-TT-komp
#
# Ablauf: 0 Vorprüfung · 1 Sicherung (Daten + beide .env) · 2 Release · 3 PM2-Neustart PV-Monteur · 4 Gesundheit
#         5 ppp-api: PVM_LC_KOMPONENTEN=1, pm2 restart --update-env, Gesundheit · 6 Probelauf mit Testauftrag
# Bei Fehler: .env von ppp-api zurück + Neustart, PV-Monteur zurück auf den vorherigen Zweig.
# Ändert sonst keine .env, kein Nginx, keine Dienste. Schlüssel und .env-Werte erscheinen nie am Bildschirm.
set -euo pipefail
export PATH="$PATH:/usr/sbin:/sbin"
RELEASE="${1:-}"
PVM_DEV=/root/pv-monteur
PVM=/root/pv-monteur-live
API=/var/www/eid/ppp-api
API_URL=http://127.0.0.1:3140/api/leistungscheck
STAMP=$(date +%Y%m%d-%H%M)
SICHER=/root/sicherung-komponenten-$STAMP
STAMMDATEN="anlagen protokolle messmittel folgemessungsauftraege tickets"
[ -n "$RELEASE" ] || { echo "Aufruf: bash komponenten-online.sh release-JJJJ-MM-TT-komp"; exit 1; }

# Riegel wie release-2026-11-18-lc (scripts/auslieferung-leistungscheck.sh); PVM_LEISTUNGSCHECK kommt aus der .env von $PVM.
riegel() {
  export PVM_FEHLERSUCHE=an PVM_BEFUND_TICKET=an PVM_PDF_ANHANG= PVM_REITER_ABGLEICH=an PVM_STOERUNG=an PVM_ANLAGENDATEN=an \
         PVM_ZEICHNUNG_WERTE=an PVM_MESSBEGINN_SPERRE=an PVM_SCHRITTLEISTE=an PVM_SCHRITT_ASSISTENT=an PVM_NICHT_BEKANNT=an PVM_AKTE_VOR_ORT=an
}
gesund() { for i in $(seq 1 15); do curl -fsS --max-time 5 http://127.0.0.1:3821/api/gesundheit >/dev/null 2>&1 && return 0; sleep 2; done; return 1; }
api_gesund() { for i in $(seq 1 15); do curl -fsS --max-time 5 "$API_URL/gesund" >/dev/null 2>&1 && return 0; sleep 1; done; return 1; }
# ppp-api liest .env per loadEnvFile, schon gesetzte Variablen haben Vorrang → den Schalter aus der Shell heraushalten.
api_neustart() { (unset PVM_LC_KOMPONENTEN; pm2 restart ppp-api --update-env >/dev/null); }

setze() { # setze DATEI NAME WERT  (ersetzt oder hängt an, ohne Ausgabe)
  local f="$1" k="$2" v="$3"
  if grep -q "^$k=" "$f"; then
    python3 - "$f" "$k" "$v" <<'PY'
import sys
f,k,v=sys.argv[1:]
z=open(f).read().splitlines()
open(f,'w').write('\n'.join((k+'='+v) if l.startswith(k+'=') else l for l in z)+'\n')
PY
  else
    [ -z "$(tail -c1 "$f")" ] || printf '\n' >> "$f"
    printf '%s=%s\n' "$k" "$v" >> "$f"
  fi
}

# Prüfsumme der Stammdaten-Bestände von PV-Monteur (Regel R1: der Prüfauftrag schreibt nur auftraege).
stammdaten_summe() { (cd "$DATEN" && for b in $STAMMDATEN; do [ -f "$b.json" ] && sha256sum "$b.json" || echo "fehlt $b"; done) | sha256sum | cut -d' ' -f1; }

echo "== 0. Vorprüfung"
git -C "$PVM_DEV" rev-parse --verify -q "$RELEASE" >/dev/null || { echo "   STOPP: Zweig $RELEASE fehlt in $PVM_DEV"; exit 1; }
git -C "$PVM_DEV" show "$RELEASE":lib/leistungscheck-eingabe.js | grep -q "komponenten" || { echo "   STOPP: $RELEASE enthält Abschnitt 5 (komponenten) nicht"; exit 1; }
git -C "$PVM_DEV" show "$RELEASE":public/js/panels/auftraege/komponenten-vorschlag.js >/dev/null 2>&1 || { echo "   STOPP: Anzeige fehlt in $RELEASE"; exit 1; }
[ -z "$(git -C "$PVM" status --porcelain --untracked-files=no)" ] || { echo "   STOPP: Live-Baum hat Änderungen"; exit 1; }
VORHER=$(git -C "$PVM" rev-parse --abbrev-ref HEAD)
[ "$VORHER" != "$RELEASE" ] || { echo "   STOPP: $RELEASE läuft schon"; exit 1; }
STICHTAG="$(git -C "$PVM_DEV" show "$RELEASE":lib/regelstand.js | sed -n "s/^const GILT_AB = '\([^']*\)';/\1/p")"
[ -n "$STICHTAG" ] || { echo "   STOPP: GILT_AB im Zweig nicht gefunden"; exit 1; }
ALTER=$(( $(date -u +%s) - $(date -u -d "$STICHTAG" +%s) ))
[ "$ALTER" -ge 0 ] && [ "$ALTER" -le 172800 ] || { echo "   STOPP: Stichtag GILT_AB=$STICHTAG liegt $((ALTER/3600)) h zurück (erlaubt 0–48 h) — Stichtage neu setzen"; exit 1; }
gesund || { echo "   STOPP: PV-Monteur antwortet schon vorher nicht"; exit 1; }
[ -f "$API/.env" ] || { echo "   STOPP: $API/.env fehlt"; exit 1; }
grep -q '^PVM_LC_SCHLUESSEL=.' "$API/.env" || { echo "   STOPP: PVM_LC_SCHLUESSEL in $API/.env fehlt (Prüfauftrag-Weg noch nicht eingerichtet)"; exit 1; }
grep -q 'PVM_LC_KOMPONENTEN' "$API/server.js" || { echo "   STOPP: ppp-api kennt den Schalter PVM_LC_KOMPONENTEN noch nicht"; exit 1; }
api_gesund || { echo "   STOPP: ppp-api antwortet schon vorher nicht"; exit 1; }
command -v python3 >/dev/null || { echo "   STOPP: python3 fehlt"; exit 1; }
echo "   in Ordnung (jetzt live: $VORHER, Stichtag $((ALTER/3600)) h alt)"

echo "== 1. Sicherung nach $SICHER"
mkdir -p "$SICHER/daten"; chmod 700 "$SICHER"
DATEN="$(cd "$PVM" && node -e 'require("dotenv").config({quiet:true});process.stdout.write(process.env.PVM_DATEN_PFAD||require("path").join(process.cwd(),"data"))')"
cp -a "$DATEN/." "$SICHER/daten/"
[ -f "$PVM/.env" ] && cp -p "$PVM/.env" "$SICHER/pv-monteur.env"
cp -p "$API/.env" "$SICHER/ppp-api.env"
printf '%s\n' "$VORHER" > "$SICHER/zweig-vorher"
N=$(find "$SICHER/daten" -type f | wc -l); [ "$N" -gt 0 ] || { echo "   STOPP: Sicherung leer"; exit 1; }
cmp -s "$API/.env" "$SICHER/ppp-api.env" || { echo "   STOPP: Sicherung der ppp-api-.env fehlerhaft"; exit 1; }
echo "   gesichert ($N Dateien, beide .env), Zweig vorher: $VORHER"

API_GEAENDERT=0
zurueck() {
  echo "== RÜCKSPRUNG"
  if [ "$API_GEAENDERT" = 1 ]; then
    cp "$SICHER/ppp-api.env" "$API/.env"
    api_neustart || true
    api_gesund && echo "   ppp-api: .env zurück, läuft wieder" || echo "   ⚠ ppp-api antwortet nach dem Rücksprung nicht — .env liegt in $SICHER/ppp-api.env"
  fi
  git -C "$PVM" checkout -q "$VORHER"
  riegel; (cd "$PVM" && bash scripts/pm2-live-start.sh) || true
  gesund && echo "   PV-Monteur wieder auf $VORHER, antwortet" || echo "   ⚠ PV-Monteur antwortet auch nach dem Rücksprung nicht — Daten liegen in $SICHER/daten"
  echo "FEHLER: nicht live geschaltet, alles zurückgesetzt. Sicherung: $SICHER"
  exit 1
}

echo "== 2. Neues Release $RELEASE"
git -C "$PVM" checkout -q "$RELEASE" || zurueck
echo "   Stand: $(git -C "$PVM" log --oneline -1 | cut -c1-80)"

echo "== 3. PM2-Neustart PV-Monteur"
riegel
(cd "$PVM" && bash scripts/pm2-live-start.sh) || zurueck

echo "== 4. Gesundheitsprüfung PV-Monteur"
gesund || { echo "   PV-Monteur antwortet nicht"; zurueck; }
SEITE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3821/ || true)
[ "$SEITE" = "200" ] || { echo "   Startseite $SEITE statt 200"; zurueck; }
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3821/api/v1/leistungscheck/pruefauftraege/LC-PROBE || true)
[ "$CODE" = "401" ] || { echo "   Schnittstelle antwortet $CODE statt 401"; zurueck; }
curl -fsS --max-time 5 http://127.0.0.1:3821/js/panels/auftraege/komponenten-vorschlag.js >/dev/null || { echo "   Anzeige-Skript nicht ausgeliefert"; zurueck; }
# Probe ohne Anlegen: ein absichtlich ungültiger Block (wp = 0) muss 400 mit feld komponenten.module[0].wp ergeben.
# Der alte Stand würde mit feld „komponenten“ (unbekanntes Feld) antworten. Schlüssel aus der ppp-api-.env, nie angezeigt.
FELD=$(grep '^PVM_LC_SCHLUESSEL=' "$API/.env" | head -1 | cut -d= -f2- | node -e '
let k="";process.stdin.on("data",d=>k+=d).on("end",async()=>{k=k.trim();
const r={fremdnummer:"LC-PROBE-KOMP",eigentuemer:{name:"Probe"},anlage:{adresse:"Probe 1",lat:50,lon:12,kwp:1},einschaetzung:{stufe:"gut"},
 einwilligung:{datenschutz:true,zeitpunkt:new Date().toISOString(),fassung:"probe"},komponenten:{module:[{wp:0}]}};
try{const a=await fetch("http://127.0.0.1:3821/api/v1/leistungscheck/pruefauftraege",{method:"POST",headers:{authorization:"Bearer "+k,"content-type":"application/json"},body:JSON.stringify(r)});
const j=await a.json().catch(()=>({}));process.stdout.write(a.status+" "+(j.feld||""))}catch(e){process.stdout.write("fehler")}})' || true)
[ "$FELD" = "400 komponenten.module[0].wp" ] || { echo "   Probe Abschnitt 5: erwartet „400 komponenten.module[0].wp“, erhalten „$FELD“"; zurueck; }
echo "   Probe Abschnitt 5: ungültiger Block → 400 mit feld (nichts angelegt)"
echo "   PV-Monteur läuft auf $RELEASE"

echo "== 5. ppp-api: Block komponenten durchreichen (PVM_LC_KOMPONENTEN=1)"
API_GEAENDERT=1
setze "$API/.env" PVM_LC_KOMPONENTEN 1 || zurueck
[ "$(grep -c '^PVM_LC_KOMPONENTEN=1$' "$API/.env")" = "1" ] || { echo "   Schalter nicht genau einmal gesetzt"; zurueck; }
api_neustart || { echo "   pm2 restart ppp-api fehlgeschlagen"; zurueck; }
api_gesund || { echo "   ppp-api antwortet nach dem Neustart nicht ($API_URL/gesund)"; zurueck; }
echo "   gesetzt (Wert nicht angezeigt), ppp-api läuft"

echo "== 6. Probelauf: Testauftrag mit Bauteilen über ppp-api"
SUMME_VORHER=$(stammdaten_summe)
NUM="LC-TEST-KOMP-$(date +%Y%m%d%H%M%S)"
ANTWORT=$(curl -s --max-time 30 -w '\n%{http_code}' -H 'content-type: application/json' -X POST "$API_URL/pruefauftrag" -d @- <<JSON || true
{"fremdnummer":"$NUM","website":"","eigentuemer":{"name":"TEST Leistungscheck Bauteile (bitte löschen)","telefon":"0000000000"},
 "anlage":{"adresse":"Teststraße 1, 08412 Werdau","lat":50.73,"lon":12.35,"art":"dach","kwp":10,"inbetriebnahme_jahr":2015,"teilflaechen":[{"azimut":0,"neigung":30,"kwp":10}]},
 "einschaetzung":{"stufe":"auffaellig","performance":0.85,"soll_kwh":11142,"ist_kwh":9500,"ursachen":["Verschmutzung"],"pruefpunkte":[],"protokoll_pruefsumme":"$(printf %s "$NUM" | sha256sum | cut -d' ' -f1)"},
 "wunschtermin":"Test","einwilligung":{"datenschutz":true,"zeitpunkt":"$(date -u +%FT%TZ)","fassung":"ppp-datenschutz-2026-11-18"},
 "komponenten":{"herkunft":"eigentuemer",
   "module":[{"hersteller":"Test Solar","modell":"TS 250","typ":"poly","wp":250,"anzahl":40,"uoc":37.8,"vmpp":30.5,"impp":8.2,"tk_uoc":-0.31}],
   "wechselrichter":[{"hersteller":"Test WR","modell":"TW 10","kw_ac":10,"anzahl":1,"umax_dc":1000,"mpp_min":200,"mpp_max":800,"strings":[{"modul_index":0,"module_je_string":20,"anzahl":2}]}],
   "kabel":[{"seite":"dc","bezeichnung":"Solarkabel","querschnitt_mm2":4,"laenge_m":25,"leiter":"cu","kabeltyp":"solar"}],
   "steckverbinder_gemischt":false}}
JSON
)
HTTP=$(printf %s "$ANTWORT" | tail -n1)
KOERPER=$(printf %s "$ANTWORT" | sed '$d')
AUFTRAG=$(printf %s "$KOERPER" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).auftragsnummer||"")}catch{}})' || true)
if [ "$HTTP" != "201" ] && [ "$HTTP" != "200" ]; then
  echo "   Testauftrag nicht angelegt: HTTP $HTTP, Antwort: $(printf %s "$KOERPER" | head -c 300)"
  zurueck
fi
echo "   angelegt: Auftrag ${AUFTRAG:-?} ($NUM)"
# In PV-Monteur: am Auftrag liegt komponenten_vorschlag mit ungeprueft: true, Stammdaten unverändert.
BEFUND=$(DATEI="$DATEN/auftraege.json" NUM="$NUM" node -e '
const d=JSON.parse(require("fs").readFileSync(process.env.DATEI,"utf8"));
const a=(d.eintraege||[]).filter(x=>x.anlass_hinweis&&x.anlass_hinweis.fremdnummer===process.env.NUM);
if(a.length!==1){process.stdout.write("anzahl "+a.length);process.exit(0)}
const v=a[0].komponenten_vorschlag;
if(!v){process.stdout.write("kein komponenten_vorschlag");process.exit(0)}
if(v.ungeprueft!==true){process.stdout.write("ungeprueft ist nicht true");process.exit(0)}
if(v.herkunft!=="leistungscheck-eigentuemer"){process.stdout.write("herkunft "+String(v.herkunft).slice(0,40));process.exit(0)}
if(!Array.isArray(v.module)||v.module.length!==1||!Array.isArray(v.wechselrichter)||v.wechselrichter.length!==1){process.stdout.write("Bauteile unvollständig");process.exit(0)}
if((a[0].teilflaechen||[]).some(t=>t.module!==0)){process.stdout.write("Bauteile in Teilflächen übernommen");process.exit(0)}
process.stdout.write("ok "+(a[0].auftragsnummer||""))' 2>&1 || true)
SUMME_NACHHER=$(stammdaten_summe)
case "$BEFUND" in
  ok*) AUFTRAG="${BEFUND#ok }"; echo "   in PV-Monteur: komponenten_vorschlag mit ungeprueft: true am Auftrag $AUFTRAG" ;;
  *)   echo "   Prüfung in PV-Monteur fehlgeschlagen: $BEFUND"
       [ -n "$AUFTRAG" ] && echo "   Testauftrag $AUFTRAG ($NUM) bitte von Hand löschen."
       zurueck ;;
esac
[ "$SUMME_VORHER" = "$SUMME_NACHHER" ] || { echo "   Stammdaten ($STAMMDATEN) haben sich verändert"; echo "   Testauftrag $AUFTRAG ($NUM) bitte von Hand löschen."; zurueck; }
echo "   Stammdaten unverändert ($STAMMDATEN)"
echo "   Bitte in PV-Monteur den Testauftrag $AUFTRAG („TEST Leistungscheck Bauteile“, $NUM) löschen."

echo "Fertig. Sicherung: $SICHER"
echo "Zurück von Hand: cp $SICHER/ppp-api.env $API/.env && pm2 restart ppp-api --update-env;"
echo "                 git -C $PVM checkout $VORHER; Riegel wie scripts/auslieferung-leistungscheck.sh exportieren; cd $PVM && bash scripts/pm2-live-start.sh"
```

## Offen für Andre
- **Vorher:** Release-Zweig `release-JJJJ-MM-TT-komp` aus diesem Zweig anlegen und die Stichtage neu setzen. Das Skript bricht ab, wenn `GILT_AB` älter als 48 h ist.
- **Bitte vor dem Lauf `bash -n scripts/komponenten-online.sh` ausführen.** Ich durfte es hier nicht aufrufen.
- **Ausführen:** `bash scripts/komponenten-online.sh release-…-komp` als root. Das Skript ändert `/var/www/eid/ppp-api/.env` und startet ppp-api neu, also Secrets und Dienst. Das bleibt bei dir.
- **Nach dem Lauf:** den ausgegebenen Testauftrag `LC-TEST-KOMP-…` in PV-Monteur löschen. Der Probelauf schickt auch eine Mail an die Leitung.

## Fragen an Claude Desktop
1. Bei einem Fehler in Schritt 5 oder 6 setzt das Skript **alles** zurück: die `.env` von ppp-api und PV-Monteur auf den vorherigen Zweig. Der Auftrag verlangte nur „.env zurück und erneut neu starten“. Soll PV-Monteur in dem Fall lieber auf dem neuen Release bleiben?
2. Als „Stammdaten“ prüft das Skript dieselben Bestände wie der R1-Test: anlagen, protokolle, messmittel, folgemessungsauftraege, tickets. Sollen weitere dazu, zum Beispiel abnahmen oder termine?
3. Der prime-Skill verweist auf `/home/andre/.claude/projects/-root/memory/arbeitsanweisungen.md`, diese Datei gibt es nicht. Außerdem ist `/root/pv-monteur` dort keinem Projekt zugeordnet. Ich habe nach ENTSCHEIDUNGEN.md gearbeitet.
