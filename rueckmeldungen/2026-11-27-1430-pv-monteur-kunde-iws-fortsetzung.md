---
status: erledigt
vorschau_url:
commits: bc7c9f26, f08a5c8f (dazu schon vorhanden auf `kundenbetrieb`: 199f939f, fae803ec, 8a02ea90, 49cd7cca)
---
## Umgesetzt
Alles liegt im Arbeitsbaum `.wt-kundenbetrieb` auf dem Zweig `kundenbetrieb`. Das Skript ist **nicht ausgeführt**, live hat sich nichts geändert.

- **Der neue Betrieb startet leer.** Ein neuer Test prüft, dass das Werkzeug beim Anlegen genau einen Eintrag für IWS schreibt, nämlich den Zugang. Es entstehen keine Aufträge, Anlagen, Kunden, Messmittel, Termine oder Einstellungen. Geprüft wird über alle Datendateien.
- **IWS sieht keine fremden Daten.** Der Test legt die Betriebe „Solarwartung Kubitz“ und „PV Performance Pro“ an, jeweils mit Aufträgen (mit Kunde), Anlagen, Messmitteln, Terminen und Einstellungen. Der IWS-Zugang ist angemeldet und hat AGB, AVV und Datenschutz zugestimmt. Er sieht:
  - in keiner Liste fremde Einträge, Aufträge, Anlagen, Messmittel und Termine sind leer,
  - beim gezielten Abruf eines fremden Eintrags über seine Kennung nur 403 oder 404,
  - im Datenexport nichts Fremdes.
- **Werkzeug:** Es gibt jetzt nur `firma_id`, `sitzplaetze` und `anmeldeadresse` aus. Ein Passwort oder Link erscheint nirgends, eine Mail geht nicht raus.
- **Skript `scripts/kundenbetrieb-iws-online.sh`:**
  - Es prüft vorher, ob die E-Mail schon einen Zugang hat. Wenn ja, bricht es mit Hinweis ab und legt nichts doppelt an. Dasselbe gilt, wenn es den Betrieb „IWS GmbH“ schon gibt.
  - Es sichert Daten, `.env` und den aktuellen Zweig, stellt dann auf das Release um.
  - `pm2 reload` läuft nur, wenn sich Servercode geändert hat.
  - Danach prüft es, ob der Dienst antwortet, die Startseite und das Manifest erreichbar sind, und legt erst dann den Betrieb an.
  - Bei einem Fehler geht es zurück auf den vorherigen Zweig, lädt pm2 neu und prüft den Dienst.
- **Release-Zweig** `release-2026-11-27-iws` ist aus `kundenbetrieb` angelegt (f08a5c8f). Er enthält den jetzigen Live-Stand 956dc8ee.
- **Tests** (gezielt, jeweils mit `timeout 300`), alle grün:
  - `kundenbetrieb-iws`, `kundenbetrieb-anlegen` und `app-installierbar`: 20 von 20,
  - `hygiene-fixtures-secrets`: 6 von 6.
  - Die Gesamtsuite habe ich nicht gestartet.
- **pm2-Neuladen ist nötig.** Gegenüber live hat sich Servercode geändert: die Sitzplatz-Sperre (`lib/lizenz.js`, `lib/firmen.js`, `routes/abo.js`, `routes/benutzer.js`) sowie Manifest, Icons und `index.html`. Das Skript erkennt das selbst.

## Offen für Andre
**Befehl** (als root):
```
bash <(git -C /root/pv-monteur show release-2026-11-27-iws:scripts/kundenbetrieb-iws-online.sh) release-2026-11-27-iws #
```
- **Rückweg von Hand,** falls der Betrieb schon angelegt ist und danach etwas schiefgeht: Das Skript entfernt einen angelegten Betrieb nicht. Die Sicherung liegt unter `/root/sicherung-kunde-iws-<Zeitstempel>/`. Sie enthält die Daten, die `.env` und in der Datei `zweig-vorher` den vorherigen Zweig.
- **Reihenfolge der Releases:** Wird vorher das Steinpleis-Release (`steinpleis-online.sh`) ausgerollt, stoppt dieses Skript sicher mit „Live-Stand nicht enthalten“. Dann muss das IWS-Release erst auf den neuen Stand gesetzt werden.
- **Mailversand:** In `/root/pv-monteur-live/.env` müssen `PVM_POST_MODUS=smtp` und `PVM_OEFFENTLICHE_URL` gesetzt sein, sonst kommt die Mail von „Kennwort vergessen“ nicht an. Das Skript prüft das vorab und bricht sonst ab.

## Fragen an Claude Desktop
- Der interne Vermerk am Betrieb („Geschenk PV Performance Pro, kostenlos, Weihnachten 2026“) steht im Datenexport, den der Kunde selbst abrufen kann. Herr Christof könnte ihn also sehen. Soll der Vermerk aus dem Export heraus oder neutraler formuliert werden? Bisher habe ich nichts daran geändert.
