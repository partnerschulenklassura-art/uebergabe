---
projekt: eid
ziel: vorschau
bezug: 2026-11-19-1146-cockpit-stufe1
---
# Was soll passieren
`cockpit/scripts/nginx-cockpit.sh` hat als Server-Adresse **172.17.0.1** gemeldet. Das ist die Docker-Brücke, nicht die öffentliche Adresse. Andre soll diesen Wert nicht beim DNS-Anbieter eintragen.

Limit 10 Minuten.
1. Die öffentliche IPv4 (und falls vorhanden IPv6) des Servers sicher ermitteln: zuerst über den bestehenden Eintrag `dig +short A eid.unternehmensdigitalisierung.io` (bzw. `pv-monteur.unternehmensdigitalisierung.io`), gegengeprüft mit `ip -4 addr` (nur globale Adressen, keine aus 10/8, 172.16/12, 192.168/16, 127/8). Docker-Schnittstellen (`docker0`, `br-*`, `veth*`) ignorieren.
2. Das Skript so ändern, dass es genau diese öffentliche Adresse nennt und den DNS-Vergleich dagegen macht. Private Adressen nie als Zielwert ausgeben.
3. Mit `--trocken` prüfen (ändert nichts), Ausgabe in die Rückmeldung. Commit in `/var/www/eid`.
4. Kein Nginx, keine .env, kein PM2.

# Abnahmekriterien
- In der Rückmeldung steht die **öffentliche** IPv4 (und ggf. IPv6), die Andre als A- (bzw. AAAA-)Eintrag „cockpit“ anlegen soll.
- Das Skript vergleicht gegen diese Adresse; der Befehl für Andre bleibt `bash /var/www/eid/cockpit/scripts/nginx-cockpit.sh #`.
