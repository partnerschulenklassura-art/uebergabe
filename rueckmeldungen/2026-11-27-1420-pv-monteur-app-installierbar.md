Die Suite läuft; ich melde mich, sobald das Ergebnis da ist.

---
status: erledigt
vorschau_url:
commits: 49cd7cca
---
## Umgesetzt
- **Zweig `kundenbetrieb`** (Worktree `/root/pv-monteur/.wt-kundenbetrieb`), Commit `49cd7cca`. Es ist nichts ausgeliefert, PM2 und `.env` sind unberührt.
- **Symbole:** Es gab nur das Text-Logo „PV“ auf `#f2b705` (CSS `.header-logo`/`.login-logo`), keine Bilddatei. Daraus erzeugt `tools/app-symbole.js` (nur Node, ohne Zusatzpakete, liefert bei jedem Lauf dieselben Bytes) diese Dateien in `public/icons/`:
  - `icon-192.png` und `icon-512.png`, abgerundet
  - `icon-maskable-512.png`, randlos; das Zeichen liegt in der Schutzzone
  - `apple-touch-icon.png` mit 180×180, deckend
  
  Ich habe die Bilder angesehen; nach einer Korrektur am Abstand zwischen P und V sehen sie sauber aus.
- **Manifest:** Neu sind `id: "/"`, `lang: "de"`, `description`, `scope: "/"` und `icons` (192 any, 512 any, 512 maskable).
- **`index.html`:** `theme-color` war schon korrekt. Neu sind `<link rel="apple-touch-icon" sizes="180x180">`, `<link rel="icon">` und `apple-mobile-web-app-title`.
- **Test `tests/app-installierbar.test.js`:** 7 von 7 grün. Er prüft:
  - Pflichtfelder: Name, `start_url`, `display`, `id`, `lang`, `scope`
  - Symbole 192 und 512 sowie maskable vorhanden
  - Pfade gültig und innerhalb von `public/`
  - echte PNG-Maße, gelesen aus der Bilddatei selbst
  - Schutzzone des maskable-Symbols
  - eingecheckte Dateien entsprechen dem Erzeuger
  - Manifest und Symbole kommen über den Server ohne Anmeldung
- **Weitere Tests:** Die Tests, die Manifest, Auslieferung und `index.html` direkt anfassen (offline, auslieferung-wachen, a10j3-alle-panels, ui-rollout, zugang-oberflaeche, optik-fonts), sind 48 von 48 grün. Die **Gesamtsuite war beim Zeitlimit noch nicht fertig**: 229 ok, 0 Fehler bis dahin. Das Protokoll liegt in `scratchpad/app-installierbar-suite.log`.
- **`sw.js`** ist unverändert. Nginx habe ich nur gelesen: Die CSP `default-src 'self'` lässt Manifest und Symbole zu.

**Was ohne Internet funktioniert (laut `sw.js` und dem Code der App):**
1. `sw.js` speichert nur die Oberfläche: `/`, `index.html`, das Manifest und alle JS- und CSS-Dateien aus `index.html`. Sie werden zuerst aus dem Speicher geliefert, deshalb startet die App auch ohne Netz.
2. `/api/` wird nie zwischengespeichert. Daten, die noch nicht geladen sind, und neue Serverdaten fehlen offline also. Der Datenbestand liegt nur im Arbeitsspeicher, nach einem Neustart der App ohne Netz ist also nur die Oberfläche da.
3. Eine **laufende Prüfung mit bereits geladenen Daten kann weiter erfasst werden.** Schreibvorgänge, die am fehlenden Netz scheitern, landen in einer Warteschlange im Browser (`localStorage`, getrennt je Firma und Zugang, bis zu 200 Einträge) und werden als „Vorgemerkt“ angezeigt.
4. **Fotos** werden offline auf dem Gerät gespeichert (IndexedDB, höchstens 50 je Zugang, nur bei genug freiem Speicher).
5. Beides wird **gesendet, sobald wieder Netz da ist und die App offen ist**, der Reihe nach und ohne doppelte Einträge. Eine Synchronisierung im Hintergrund bei geschlossener App gibt es nicht. Vom Server abgelehnte Einträge bleiben sichtbar und werden nicht wiederholt. Eine Anmeldung oder das erste Laden ohne Netz geht nicht.

**PM2-Neuladen: ja, nötig.** Die Dateien selbst liest der Server bei jedem Abruf neu von der Platte. Der Service Worker liefert `index.html` und das Manifest aber aus seinem Speicher, und dieser Speicher wird erst nach einem Prozessneustart erneuert. Ohne `pm2 reload pv-monteur` sehen Geräte, die die App schon einmal geöffnet haben, die Symbole und damit das Angebot „App installieren“ nicht. Mit dem IWS-Release, das ohnehin neu lädt, ist das erledigt.

## Offen für Andre
- Ausrollen mit dem IWS-Release (Release-Zweig, dann `pm2 reload pv-monteur`). Danach am Windows-PC in Chrome/Edge die Installationsanzeige in der Adresszeile prüfen und auf iPhone und Android „Zum Startbildschirm“ einmal ausprobieren.
- Die Gesamtsuite einmal vollständig laufen lassen (`npm test` im Zweig `kundenbetrieb`), weil sie in meinem Zeitfenster nicht fertig wurde.
- Sobald es ein echtes Logo als Datei gibt: in `tools/app-symbole.js` ersetzen oder die PNGs direkt austauschen. Der Test prüft danach weiter Maße und Pfade, nur der Vergleich mit dem Erzeuger muss dann angepasst werden.

## Fragen an Claude Desktop
- Reicht das nachgebaute „PV“-Zeichen als App-Symbol, oder soll ein eigenes Logo kommen?
- `docs/OFFEN-offline.md` §1.4 verbietet in App und Webseite Aussagen über „offline arbeiten“; erlaubt ist nur „startet auch ohne Netz“. Inzwischen gibt es aber Warteschlange und Fotoablage. Soll diese Sprachregel gelockert werden, etwa für die Beschreibung im Manifest oder für Hinweise an Kunden?

(Claude Code beendet mit Fehler/Timeout – siehe Server-Log)
