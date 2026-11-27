---
projekt: pv-monteur
ziel: vorschau
bezug: 2026-11-27-1320-pv-monteur-auslieferung-kunde
---
# Was soll passieren
Erster Kunde (Weihnachtsgeschenk von Andre, **kostenlos**): Betrieb für **IWS GmbH**, genau **ein Zugang** für `d.christof@iwsgmbh.com`. Baut auf dem Werkzeug „Kundenbetrieb anlegen“ aus `…1320…` auf (Zweig `kundenbetrieb`). Limit 20 Minuten. Nichts ausliefern, kein PM2, keine .env.

Vorgaben:
- Betrieb „IWS GmbH“, `status: aktiv`, ohne Stripe, ohne Laufzeitende (`abo_ende: null`), Vermerk `notiz: "Geschenk PV Performance Pro, kostenlos, Weihnachten 2026"`.
- **Sitzplätze: 1.** Es darf nur genau ein Zugang existieren; weitere Zugänge anlegen/einladen muss in der App für diesen Betrieb gesperrt sein (vorhandene Sitzplatz-Logik nutzen, prüfen dass sie greift, Test dazu).
- Der eine Zugang muss **sowohl Aufträge anlegen als auch Prüfungen durchführen** können (Leitung, die auch als Monteur prüfen darf). Prüfe im Code, welche Rolle das abdeckt; falls Leitung nicht prüfen darf, die kleinste Änderung vorschlagen (nicht still Rechte ausweiten) und in der Rückmeldung begründen.
- Passwort setzt Herr Christof **selbst** über „Passwort vergessen“ auf der Anmeldeseite. Das Werkzeug schickt **keine** E-Mail an ihn (Andre überreicht eine Weihnachtskarte). Kein Passwort, kein Link am Bildschirm.
- Prüfen, dass „Passwort vergessen“ für einen frisch angelegten Zugang ohne Passwort funktioniert (Test), und dass bei der ersten Anmeldung AGB/AVV/Datenschutz abgefragt werden.
- Befehl für Andre (ein Aufruf, als root, mit ` #` am Ende), der Release ausrollt (falls nötig) und den Betrieb anlegt; Rückweg beschrieben. Ausgabe am Ende nur firma_id und Anmeldeadresse.

# Abnahmekriterien
- Tests grün (Sitzplatz-Sperre, Rolle, Passwort-vergessen-Weg), Befehl in der Rückmeldung.
