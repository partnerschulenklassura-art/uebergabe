---
status: erledigt
vorschau_url: https://www.photovoltaikperformancepro.com/api/leistungscheck/umgebung?lat=50.73&lon=12.35
commits: 88735e4
---
## Umgesetzt
**1. IndexNow:** Gemeldet sind `/leistungscheck/`, `/datenschutz.html` und `/`, mit dem bisherigen Schlüssel und der bisherigen keyLocation. Antwort: **HTTP 200**.

**2. Overpass-Diagnose** (nur lesend, jeder Aufruf höchstens 30 s):
- **overpass-api.de:** Ohne User-Agent, also mit dem Standard von curl, kommt **HTTP 406**. Mit `User-Agent: Leistungscheck/1.0` kommt **HTTP 502** mit dem Text „server is currently at capacity … request queue is full“. Das passiert über IPv4 und IPv6 gleich, und auch die Mini-Abfrage `node(1);out;` bekommt sofort diese 502.
- **overpass.kumi.systems:** Die TCP-Verbindung zu 193.219.97.30:443 kommt zustande, danach bleibt es 25 s still und es kommen **0 Byte**. Das gilt für `/api/status` und für die Mini-Abfrage.
- **Bewertung:** Es gibt keine 429 und keinen Hinweis „rate limited“. Unsere Server-IP ist also nicht erkennbar gesperrt. Der eine Server ist überlastet, der andere antwortet gar nicht. Der Dienst schickt seinen eigenen User-Agent mit, die 406 betrifft ihn also nicht.

**3. Lokale Quelle**
- **Auszüge:** Sachsen (270 MB) und Thüringen (160 MB) von Geofabrik, md5 geprüft, mit Stand 16.11.2026 21:22 UTC. Dazu die Geofabrik-`.poly`-Dateien.
- **osmium fehlt.** Ich habe einen eigenen schlanken PBF-Leser geschrieben (`src/pbf-leser.js`). Er nutzt das npm-Paket `pbf` ohne weitere Abhängigkeiten und das zlib von Node, eine Systemänderung war nicht nötig. Der Filter übernimmt genau die Merkmale aus der Overpass-Abfrage: Straße und Bahn nur als Weg, alles andere als Knoten, Weg und Relation.
- **Ergebnis:** eine SQLite-Datei (`data/osm/umgebung.sqlite`, **39,7 MB**). Sie enthält Arten, Name und Begrenzungsrechteck je Objekt, wie bei `out tags bb`, und sucht über einen R-Baum aus dem eingebauten `node:sqlite`. Sie ist **eine** Datei mit Spalte „Art“ statt einer Datei je Art. Bauzeit 63 s.
- **Objekte je Art (285 318 insgesamt):**

| Art | Objekte |
|---|---|
| wald | 77 336 |
| acker | 74 109 |
| voegel | 47 253 |
| strasse | 33 667 |
| bahn | 25 556 |
| tierhaltung | 16 039 |
| industrie | 12 123 |
| steinbruch | 1 154 |
| baustelle | 891 |

- **Ablauf in `umgebung`:** Lokal wird nur geantwortet, wenn der ganze 2-km-Umkreis in Sachsen oder Thüringen liegt. Geprüft werden der Mittelpunkt und 16 Randpunkte gegen die `.poly`-Grenzen. Sonst, oder wenn die Datei fehlt, wird wie bisher Overpass gefragt. Die Antwort hat ein neues Feld `datenquelle: "lokal"` oder `"overpass"`.
- **Aktualisierung:** Wird die Datei ersetzt, liest der Dienst sie bei der nächsten Abfrage von selbst neu, ohne Neustart.
- **Monatliches Skript:** `tools/osm-aktualisieren.sh` lädt die Auszüge, prüft md5, baut neu und ersetzt die Datei atomar. Es liegt bereit, ist aber nicht eingerichtet.

**4. Tests und Werdau**
- `npm test` ist **grün, 77 von 77**. Die neuen Tests laufen ohne Netz mit einer selbst erzeugten Mini-PBF. Sie prüfen Leser, Filter, Löcher in den Grenzen, das Zusammenführen an der Grenze und den Rückfall auf Overpass.
- **Probe Werdau (50.73, 12.35)** aus der lokalen Quelle, Antwort in 18–30 ms:

| Art | Abstand | Objekt |
|---|---|---|
| acker | 0 m | way/381557265 |
| bahn | 0 m | way/198174707 „Waldeisenbahn“ |
| wald | 132 m | way/90120508 |
| steinbruch | 279 m | way/1102419656 „Lehmgrube Leubnitz“ |
| voegel | 526 m | way/32487364 |
| industrie | 655 m | node/8095231871 |
| tierhaltung | 857 m | way/477685884 |
| strasse | 1 359 m | way/627275749 „Ronneburger Straße“ |

**5. Dienst:** `pm2 reload ppp-api` ist erfolgt. `/gesund` meldet `{"ok":true}`, der Dienst ist online und braucht 76 MB. `umgebung` für Werdau liefert lokal 200 in 0,03 s, über die Live-Domain 200 in 0,11 s. Nginx habe ich nicht angefasst.

## Offen für Andre
- **osmium:** Mit dem eigenen Leser wird es nicht mehr gebraucht. Falls du es trotzdem willst, heißt das Paket `osmium-tool` (`apt install osmium-tool`).
- **Cron einrichten**, zum Beispiel: `17 4 3 * * bash /var/www/eid/ppp-api/tools/osm-aktualisieren.sh >> /var/log/ppp-osm.log 2>&1`. Ein Lauf dauert etwa 2–3 Minuten und braucht rund 1 GB Arbeitsspeicher.
- **`chmod +x tools/osm-aktualisieren.sh`** hat eine Freigabe verlangt, deshalb habe ich es nicht gemacht. Mit `bash …` aufgerufen läuft das Skript auch so.
- **Warnung im PM2-Log:** `node:sqlite` schreibt beim Start einmal „ExperimentalWarning“. Das ist harmlos. Wer sie loswerden will, setzt `node_args: '--no-warnings'` in `ecosystem.config.cjs` und lädt mit `pm2 reload … --update-env` neu, das ist eine Dienstkonfiguration.
- **Speicherplatz:** Die Rohauszüge (430 MB) bleiben in `data/osm/roh/` liegen (per `.gitignore` nicht im Repo). Das monatliche Skript überschreibt sie.

## Fragen an Claude Desktop
- **Rechtecke statt Geometrie:** Werdau zeigt die Grenze von „nur Begrenzungsrechteck“ deutlich. „bahn 0 m“ (Waldeisenbahn) und „acker 0 m“ entstehen, weil der Standort im Rechteck einer langen Linie bzw. großen Fläche liegt. Overpass mit `out tags bb` liefert dasselbe, und laut ENTSCHEIDUNGEN „reicht das vorerst“. Lokal liegen die Knotenkoordinaten beim Bau aber ohnehin vor. Sollen Straße und Bahn (oder alle Arten) lokal mit voller, vereinfachter Geometrie gespeichert werden? Die Datei würde damit größer, schätzungsweise 100–200 MB. Dafür würden die Abstände genau statt nur als Untergrenze.
- **Weitere Länder:** Sollen außer Sachsen und Thüringen noch andere Länder lokal abgedeckt werden, etwa Bayern oder Sachsen-Anhalt? Im Skript ist das nur eine Zeile (`REGIONEN=…`). Overpass ist zurzeit praktisch nicht nutzbar, daher scheitert die Umgebung außerhalb der beiden Länder weiterhin.
