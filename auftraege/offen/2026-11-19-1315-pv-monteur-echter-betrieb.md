---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Andre hat in PV-Monteur bisher nur Demo-Zugänge. Er braucht jetzt einen **echten Betrieb mit eigenem Leitungs-Zugang**. Das Passwort tippt Andre selbst am Server ein; es darf nie in einer Datei, im Repo, in einer Rückmeldung oder auf dem Bildschirm erscheinen.

Gesamtlimit 30 Minuten, Rückmeldung spätestens nach 25 Minuten (sonst `status: teilweise`). Nur gezielte Tests mit `timeout 300`, keine Gesamtsuite.

## 1. Bestandsaufnahme (nur lesen, im Repo `/root/pv-monteur`)
- Wie entstehen Betriebe und Zugänge heute (`/api/registrierung`, Setup, vorhandene Werkzeuge unter `tools/`)? Gibt es schon ein Werkzeug zum Anlegen? Dann das nutzen statt neu bauen.
- Woran erkennt der Code Demo-Betriebe? Braucht ein Betrieb ein Stripe-Abo oder eine Testphase, um nutzbar zu sein? Wie lässt sich ein eigener Betrieb dauerhaft frei schalten (eigener Status o. ä.), ohne Stripe?

## 2. Werkzeug `tools/betrieb-anlegen.js` (neuer Zweig `echter-betrieb`, vom aktuellen Release-Stand)
Aufruf durch Andre in `/root/pv-monteur-live`, interaktiv:
- Legt einen Betrieb an: Name „PV Performance Pro“, Anschrift leer lassen (später in der App), Status dauerhaft nutzbar ohne Abo (Weg aus 1.).
- Legt einen Zugang mit Rolle `leitung` an: Name „André Häupl“, E-Mail `info@photovoltaikperformancepro.com`.
- Fragt das Passwort **verdeckt** zweimal ab (keine Anzeige, Mindestlänge wie die App), speichert nur den bcrypt-Hash über die vorhandenen Speicherfunktionen (Schreib-Warteschlange).
- Bricht ab, wenn die E-Mail schon einen Zugang hat (dann Hinweis auf „Passwort vergessen“ in der App).
- Gibt am Ende nur `firma_id` und die Anmeldeadresse aus.
- Option `--schluessel-umstellen`: stellt für den neuen Betrieb je einen Schlüssel der Art `leistungscheck` und `cockpit` aus und schreibt sie **nur** in die Dateien `/var/www/eid/ppp-api/.env` (`PVM_LC_SCHLUESSEL`) bzw. `/var/www/eid/cockpit/.env` (`PVM_COCKPIT_SCHLUESSEL`), vorher Sicherung beider Dateien nach `/root/`. Alte Schlüssel des Demo-Betriebs sperren (`gesperrt_am`). Danach `pm2 reload ppp-api --update-env` und `pm2 restart cockpit`. Schlüssel nie anzeigen.
- Demo-Betriebe und ihre Daten nicht anfassen.

## 3. Ausliefern vorbereiten
- Tests für das Werkzeug (Anlegen, doppelte E-Mail, Hash statt Klartext, Schlüssel nur in Datei, Demo unverändert) mit Attrappen-Datenpfad.
- Release-Zweig `release-2026-11-19-betrieb` lokal anlegen und ein Skript `scripts/betrieb-online.sh` wie bei `cockpit-online.sh` (Sicherung, Auslieferung nach `/root/pv-monteur-live`, Gesundheitsprüfung, Rückweg). Das Skript startet am Ende das Werkzeug mit `--schluessel-umstellen`.
- Nicht selbst ausführen, nicht nach `/root/pv-monteur-live` ausliefern, kein PM2, keine .env.

# Abnahmekriterien
- Ergebnis der Bestandsaufnahme kurz in der Rückmeldung (insbesondere: Zu welchem Betrieb gehört der heutige Leistungscheck-Schlüssel – Demo oder nicht? Nur Präfix/firma_id nennen, falls lesbar).
- Werkzeug, Tests grün, Release-Zweig und Skript bereit.
- Unter „Offen für Andre“ genau **ein** Befehl mit ` #` am Ende, und der Hinweis, dass er dabei sein Passwort zweimal eintippt.
