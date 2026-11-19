Andre kann den echten Betrieb jetzt mit einem Befehl anlegen: Werkzeug und Ausroll-Skript stehen, die 5 Werkzeugtests sind grün. Ausgeführt habe ich nichts: keine Auslieferung, kein PM2, keine `.env` angefasst. Eine Lücke: Die reine Syntaxprüfung des Skripts (`bash -n`) wurde mir verweigert und ist nicht gelaufen.

Die Arbeitsanweisung aus dem Skill „prime“ gibt es unter dem angegebenen Pfad nicht, ein Projektgedächtnis auch nicht. Ich habe mich nach `ENTSCHEIDUNGEN.md` gerichtet.

---
status: erledigt
vorschau_url:
commits: 121cf65b, 956dc8ee
---
## Umgesetzt

**Bestandsaufnahme** (nur gelesen)
- **Wie Betriebe und Zugänge entstehen:** Über `/api/registrierung` entsteht ein Betrieb mit dem Vermerk `herkunft: 'registrierung'`. Ohne Stripe-Abo und ohne Freischaltung ist er dann in der Probezeit, und die PDF-Ausgabe ist gesperrt. Die vorhandenen Werkzeuge `scripts/seed-firma.js` und `scripts/passwort-neu.js` geben das Passwort am Bildschirm aus. `tools/schluessel-ausstellen.js` zeigt den Schlüssel an. Für diesen Auftrag taugen sie also nicht, deshalb gibt es ein neues Werkzeug, das ihre Speicherfunktionen mitbenutzt.
- **Woran der Code Demo-Betriebe erkennt:** gar nicht, es gibt kein Merkmal dafür. Live gibt es genau einen Betrieb, `001d744e2777786dcc8fa844` „Solarwartung Kubitz“. Laut `docs/AUSLIEFERUNG-NOTIZ-NAECHSTE.md` sind das die bereinigten Live-Testdaten, also der Demo-Betrieb.
- **Wie ein Betrieb dauerhaft nutzbar wird, ohne Stripe:** wie bei einem angelegten (geseedeten) Betrieb, also ohne `herkunft`, mit `status: 'aktiv'` und ohne Laufzeitende (`abo_ende: null`). Dann greift keine Probezeit und keine Laufzeitsperre. Stripe fasst nur Betriebe mit Stripe-Kennungen an.
- **Wem der heutige Leistungscheck-Schlüssel gehört:** dem Demo-Betrieb. Der Schlüssel in `ppp-api/.env` hat das Präfix `816f6edd`, firma_id `001d744e…`. Der Cockpit-Schlüssel (Präfix `1e52cd8a`) gehört demselben Betrieb.

**Werkzeug `tools/betrieb-anlegen.js`** (Zweig `echter-betrieb`, abgezweigt vom Live-Stand `release-2026-11-19-cockpit`)
- Legt „PV Performance Pro“ ohne Anschrift an, dazu den Zugang André Häupl mit Rolle `leitung` und `info@photovoltaikperformancepro.com`.
- Das Passwort wird zweimal verdeckt abgefragt, ohne jede Anzeige. Es gilt die Mindestlänge der App (12 Zeichen). Gespeichert wird nur der bcrypt-Hash, über die vorhandenen Speicherfunktionen mit Schreib-Warteschlange.
- Hat die E-Mail schon einen Zugang (auch einen unbestätigten), bricht es ab, noch vor der Passwortfrage, mit Hinweis auf „Passwort vergessen“.
- Am Ende gibt es nur `firma_id` und die Anmeldeadresse aus.
- **Mit `--schluessel-umstellen`:**
  - Es sichert beide `.env` nach `/root/betrieb-env-sicherung-<Zeit>/`.
  - Es stellt den Leistungscheck- und den Cockpit-Schlüssel aus und schreibt sie nur in die beiden Dateien. Rechte und Eigentümer der Dateien bleiben erhalten.
  - Danach `pm2 reload ppp-api --update-env` und `pm2 restart cockpit`, und zwar ohne die Einstellungen von PV-Monteur, damit nichts davon in die anderen Dienste gelangt.
  - Erst wenn beide Dienste wieder laufen, sperrt es die alten Schlüssel des Demo-Betriebs.
  - Geht vorher etwas schief, stellt es beide `.env` zurück, sperrt die neuen Schlüssel und lädt die Dienste neu.
  - Die Demo-Daten selbst bleiben unverändert.

**Tests:** `tests/betrieb-anlegen.test.js`, 5 von 5 grün, alle mit Attrappen-Datenpfad, -`.env` und -pm2. Geprüft werden:
- Anlegen und Nutzbarkeit ohne Abo
- doppelte E-Mail und zu kurzes Passwort
- Hash statt Klartext, auch über die Kommandozeile
- Schlüssel nur in der Datei
- Demo-Betrieb unverändert, fremder Betrieb unberührt
- Rückweg

Die Wachen (Quelltext, Auslieferung, Inventar, Seed, Schlüssel) sind ebenfalls grün.

**Ausrollen:** Der Release-Zweig `release-2026-11-19-betrieb` liegt lokal (956dc8ee), dazu `scripts/betrieb-online.sh`. Es arbeitet der Reihe nach:
1. Vorprüfung:
   - Aufruf am Terminal
   - E-Mail noch frei
   - Release ändert nur Werkzeug, Tests und Skripte
2. Sicherung von Daten, `.env` und Zweig
3. Auslieferung nach `/root/pv-monteur-live`
4. Gesundheitsprüfung
5. Werkzeug mit `--schluessel-umstellen`
6. Prüfung, ob die neuen Schlüssel greifen

Bei einem Fehler geht es zurück auf den vorherigen Zweig. PV-Monteur selbst wird nicht neu geladen, weil sich am Servercode nichts ändert.

## Offen für Andre
Ein Befehl als root am Server, direkt am Terminal. Dabei tippst du dein Passwort **zweimal** ein, es wird nicht angezeigt:

```
bash <(git -C /root/pv-monteur show release-2026-11-19-betrieb:scripts/betrieb-online.sh) release-2026-11-19-betrieb #
```

Danach ist das Cockpit mit dem neuen, noch leeren Betrieb verbunden, und der Leistungscheck legt Prüfaufträge dort an. Bei der ersten Anmeldung fragt die App nach der Zustimmung zu AGB und Datenschutz, das ist so gewollt.

## Fragen an Claude Desktop
1. **Zugänge:** Ich habe 5 Zugänge (Sitzplätze) eingetragen, ohne Stripe lassen sich keine dazubuchen. Reicht das, oder soll eine andere Zahl hinein?
2. **Was passiert mit dem Demo-Betrieb „Solarwartung Kubitz“?** Er bleibt bestehen und ist weiter anmeldbar; nur seine Schlüssel werden gesperrt. Soll er später gelöscht werden?
