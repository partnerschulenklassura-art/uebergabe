---
projekt: eid
ziel: live
---
# Was soll passieren
Antwort auf die Frage aus `2026-11-17-1830-…`: **Ja**, im Overpass-Rückfall (außerhalb der vier Länder) für `bahn` und `strasse` `out geom` verwenden und den Abstand wie lokal zur echten Linie rechnen; die übrigen Arten bleiben bei `out tags bb`. Tests anpassen, `pm2 reload ppp-api`, `/gesund` prüfen. Kurz und mit festen Zeitlimits, keine Wartschleifen mit `pgrep -f`.

# Abnahmekriterien
- `npm test` grün, Commit, Dienst gesund.
