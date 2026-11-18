## Bauteile Teil 3: Release-Zweig liegt bereit, Skript ist überarbeitet und wurde nicht ausgeführt

---
status: erledigt
vorschau_url:
commits: 9e423517 (leistungscheck-komponenten), b463b1de (release-2026-11-18-komp, baut auf 9e423517 auf)
---

## Umgesetzt

**1. Release-Zweig `release-2026-11-18-komp`**
- Angelegt aus `leistungscheck-komponenten` (Stand 9e423517). Die Stichtage sind nach demselben Muster gesetzt wie beim letzten Release (54e27915), Ausgangszeit `date -u` = 2026-11-18T16:04:35Z:
  - `RCD_WELLE_AB` = …16:04:35.000Z
  - `GILT_AB` = …16:04:36.000Z
  - `GILT_AB_A10G` = …16:04:37.000Z
  - `GILT_AB_A10W` = …16:04:38.000Z
- Zwischen den beiden Zweigen unterscheiden sich nur `lib/regelstand.js` und `lib/dokument/textstaende.js`. Das Skript ist also in beiden Zweigen gleich.
- Der Live-Baum `/root/pv-monteur-live` kann den Zweig auschecken:
  - Er ist ein Worktree desselben Repos und sieht den Zweig (`rev-parse` → b463b1de).
  - Der Zweig ist in keinem Worktree ausgecheckt. Das Entwicklungsverzeichnis steht wieder auf `leistungscheck-komponenten`.
  - Der Live-Baum hat keine Änderungen an versionierten Dateien und läuft derzeit auf `release-2026-11-18-lc`.

**2. Nachweis: Probe in Schritt 4**

Der Probe-Rumpf ist jetzt bis auf `wp = 0` vollständig gültig: Telefon „0000000000“, Adresse, Art, ein Feld mit Teilfläche, Einschätzung mit allen Feldern samt Prüfsumme, Einwilligung. Eine E-Mail ist in PV-Monteur keine Pflicht; für ppp-api reicht das Telefon. Den Rumpf habe ich direkt aus dem Skript geladen (über `KOMP_NUR_DEFINITIONEN=1 source …`) und gegen beide Prüfer laufen lassen:
```
2a PV-Monteur pruefe(probe)                  → komponenten.module[0].wp
2b PV-Monteur pruefe(probe, wp=250)          → kein Fehler
2c PV-Monteur pruefe(probe ohne komponenten) → kein Fehler
2d ppp-api pruefeAuftrag(probe)              → komponenten.module[0].wp
```
2b zeigt: Außer `wp` ist nichts am Rumpf ungültig, die Prüfung scheitert also sicher erst am Bauteil-Block.

**3. Nachweis: Prüfung in Schritt 6**

Dafür lief ein Test-Server mit Testfirma im Datenpfad `/tmp/pvm-komp-nachweis-*`, also nicht live. Der Testrumpf aus dem Skript ging erst durch `pruefeAuftrag` von ppp-api, so wie ppp-api ihn an PV-Monteur weitergibt, und dann per POST an PV-Monteur:
```
3a Anlegen (Testpfad)                → HTTP 201 PV-2026-0001
3b gespeicherte teilflaechen         → [{"azimut":180,"neigung":30,"module":0,"kwp":10}]
3c anlass_hinweis.fremdnummer / fremdnummer → LC-TEST-KOMP-NACHWEIS / LC-TEST-KOMP-NACHWEIS / herkunft leistungscheck
3d BEFUND_JS (Schritt 6)             → ok PV-2026-0001
3e mit falscher Nummer               → anzahl 0
3f Teilfläche ohne Feld module       → ok PV-2026-0001
3g Teilfläche mit module 40          → Bauteile in Teilflächen übernommen
```
- **Teilflächen:** `lib/leistungscheck-auftrag.js` legt sie immer mit `module: 0` an, deshalb hätte die alte Bedingung bei korrektem Ablauf nicht angeschlagen. Ich habe sie trotzdem auf `(t.module??0)!==0` umgestellt. Damit gilt ein fehlendes Feld wie 0 (Fall 3f), und echte Übernahmen werden weiter erkannt (Fall 3g).
- **Fremdnummer:** `anlass_hinweis.fremdnummer` ist der richtige Ort. Darüber bindet `istLeistungscheck()` den Auftrag, und das Feld ist über die Maske nicht änderbar. Das sichtbare Feld `fremdnummer` kann dagegen über die Maske geändert werden. Die Prüfung verlangt jetzt zusätzlich `anlass_hinweis.herkunft === "leistungscheck"`.

**4. Kommentarkopf** zeigt den bereitliegenden Zweig und den Aufruf `bash /root/pv-monteur/scripts/komponenten-online.sh release-2026-11-18-komp`. Probe-Rumpf, Testauftrag und Schritt-6-Prüfung stehen jetzt als Definitionen (`probe_rumpf`, `testrumpf`, `BEFUND_JS`) vor `set -e`. Nur mit `source` und `KOMP_NUR_DEFINITIONEN=1` kehrt das Skript danach zurück; beim normalen Aufruf läuft es unverändert durch.

**5. Skript-Diff gegenüber 65a57d2d** (`git diff 65a57d2d leistungscheck-komponenten -- scripts/komponenten-online.sh`):
```diff
@@ -3,14 +3,63 @@
-# Vorher in /root/pv-monteur: Release-Zweig aus dem freigegebenen Stand anlegen und die Stichtage neu setzen
-# (wie für release-2026-11-18-lc: lib/regelstand.js GILT_AB, GILT_AB_A10G, GILT_AB_A10W; lib/dokument/textstaende.js RCD_WELLE_AB auf `date -u`).
-# Aufruf als root:  bash komponenten-online.sh release-JJJJ-MM-TT-komp
+# Der Release-Zweig release-2026-11-18-komp liegt in /root/pv-monteur bereit (aus leistungscheck-komponenten, Stichtage
+# lib/regelstand.js GILT_AB, GILT_AB_A10G, GILT_AB_A10W und lib/dokument/textstaende.js RCD_WELLE_AB frisch gesetzt;
+# Schritt 0 verlangt, dass GILT_AB höchstens 48 h zurückliegt — sonst die Stichtage neu setzen).
+# Aufruf als root (ein Befehl):  bash /root/pv-monteur/scripts/komponenten-online.sh release-2026-11-18-komp
+#
+# Nachweis ohne Live-Eingriff: `KOMP_NUR_DEFINITIONEN=1 source komponenten-online.sh` lädt nur probe_rumpf, testrumpf
+# und BEFUND_JS (Probe Schritt 4, Testauftrag und Prüfung Schritt 6) und kehrt dann zurück.
 #
 # Ablauf: … (unverändert)
+# Probe Schritt 4: bis auf komponenten.module[0].wp = 0 vollständig gültig (PV-Monteur lib/leistungscheck-eingabe.js
+# und ppp-api pruefeAuftrag), damit die Prüfung sicher erst am Bauteil-Block scheitert. Der alte Stand antwortet „komponenten“.
+probe_rumpf() {
+  cat <<JSON
+{"fremdnummer":"LC-PROBE-KOMP","eigentuemer":{"name":"Probe Bauteile","telefon":"0000000000"},
+ "anlage":{"adresse":"Probestraße 1, 08412 Werdau","lat":50.73,"lon":12.35,"art":"dach","kwp":10,"inbetriebnahme_jahr":2015,"teilflaechen":[{"azimut":0,"neigung":30,"kwp":10}]},
+ "einschaetzung":{"stufe":"gut","performance":1,"soll_kwh":10000,"ist_kwh":10000,"zerlegung":{"alterung":0,"planung":0,"ac":0,"rest":0},"ursachen":[],"pruefpunkte":[],"protokoll_pruefsumme":"$(printf '0%.0s' $(seq 1 64))"},
+ "wunschtermin":"Probe","einwilligung":{"datenschutz":true,"zeitpunkt":"$(date -u +%FT%TZ)","fassung":"probe"},
+ "komponenten":{"herkunft":"eigentuemer","module":[{"hersteller":"Probe","typ":"mono","wp":0,"anzahl":1}]}}
+JSON
+}
+
+# Testauftrag Schritt 6 (über ppp-api, das den Rumpf auf die PV-Monteur-Form bringt).
+testrumpf() { # testrumpf FREMDNUMMER
+  local num="$1"
+  cat <<JSON
+ … (Rumpf inhaltlich unverändert aus dem alten Heredoc, $NUM → $num)
+JSON
+}
+
+# Prüfung Schritt 6 (DATEI = auftraege.json, NUM = Fremdnummer). Bindung über anlass_hinweis.fremdnummer
+# (lib/leistungscheck-auftrag.js istLeistungscheck; das sichtbare Feld fremdnummer ist über die Maske änderbar).
+# Teilflächen legt lib/leistungscheck-auftrag.js immer mit module: 0 an; ein fehlendes Feld zählt wie 0.
+BEFUND_JS='
+ … (wie bisher, mit zwei Änderungen:)
+const a=(d.eintraege||[]).filter(x=>x.anlass_hinweis&&x.anlass_hinweis.herkunft==="leistungscheck"&&x.anlass_hinweis.fremdnummer===process.env.NUM);
+if((a[0].teilflaechen||[]).some(t=>(t.module??0)!==0)){…}
+ …'
+
+if [ "${KOMP_NUR_DEFINITIONEN:-}" = 1 ] && [ "${BASH_SOURCE[0]}" != "$0" ]; then return 0; fi
+
 set -euo pipefail
@@ Schritt 4
-FELD=$(grep '^PVM_LC_SCHLUESSEL=' "$API/.env" | head -1 | cut -d= -f2- | node -e '
+FELD=$(grep '^PVM_LC_SCHLUESSEL=' "$API/.env" | head -1 | cut -d= -f2- | PROBE="$(probe_rumpf)" node -e '
 let k="";…
-const r={fremdnummer:"LC-PROBE-KOMP",eigentuemer:{name:"Probe"},anlage:{adresse:"Probe 1",lat:50,lon:12,kwp:1},einschaetzung:{stufe:"gut"},
- einwilligung:{datenschutz:true,zeitpunkt:new Date().toISOString(),fassung:"probe"},komponenten:{module:[{wp:0}]}};
+const r=JSON.parse(process.env.PROBE);
@@ Schritt 6
-ANTWORT=$(curl -s … -d @- <<JSON || true
-{ … Heredoc mit Testrumpf … }
-JSON
-)
+ANTWORT=$(testrumpf "$NUM" | curl -s --max-time 30 -w '\n%{http_code}' -H 'content-type: application/json' -X POST "$API_URL/pruefauftrag" -d @- || true)
@@
-BEFUND=$(DATEI="$DATEN/auftraege.json" NUM="$NUM" node -e '
- … (11 Zeilen Prüfcode, jetzt in BEFUND_JS)
-process.stdout.write("ok "+(a[0].auftragsnummer||""))' 2>&1 || true)
+BEFUND=$(DATEI="$DATEN/auftraege.json" NUM="$NUM" node -e "$BEFUND_JS" 2>&1 || true)
```
Den vollständigen, ungekürzten Diff zeigt `git diff 65a57d2d leistungscheck-komponenten -- scripts/komponenten-online.sh`.

Das Skript habe ich **nicht ausgeführt**. Eine Syntaxprüfung mit `bash -n` war nicht möglich, weil der Aufruf eine Freigabe verlangt hat. Die beiden Funktionen und `BEFUND_JS` sind aber über `source` gelaufen und haben die Nachweise oben geliefert.

## Offen für Andre
- **Ein Befehl:** `bash /root/pv-monteur/scripts/komponenten-online.sh release-2026-11-18-komp`
- **Frist:** Schritt 0 bricht ab, wenn `GILT_AB` mehr als 48 h zurückliegt. Der Aufruf muss also **vor dem 2026-11-20 um 16:04 UTC** laufen, sonst müssen die Stichtage neu gesetzt werden.
- Nach dem Lauf den Testauftrag „TEST Leistungscheck Bauteile“ in PV-Monteur von Hand löschen. Das Skript nennt die Nummer.
- Das Skript ändert `/var/www/eid/ppp-api/.env` (`PVM_LC_KOMPONENTEN=1`) und startet ppp-api über pm2 neu. Beides ist bisher nicht passiert und bleibt bei dir.

## Fragen an Claude Desktop
- keine
