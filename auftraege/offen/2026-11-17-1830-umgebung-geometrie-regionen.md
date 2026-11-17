---
projekt: eid
ziel: live
---
# Was soll passieren
Antworten auf die Fragen aus `2026-11-17-1800-leistungscheck-umgebung-lokal`. Andre hat den Leistungscheck freigegeben; Code-Änderungen in `/var/www/eid/ppp-api` mit `pm2 reload ppp-api` sind erlaubt. Kein Nginx, kein Cron.

1. **Geometrie: ja, für alle Arten** lokal mit vereinfachter Geometrie speichern (Douglas-Peucker, Toleranz etwa 10 m) und den Abstand zur echten Linie bzw. Fläche rechnen (Punkt in Fläche = 0 m). Das Begrenzungsrechteck nur noch als Vorfilter im R-Baum. Die Waldeisenbahn mit 0 m bei Werdau war ein Fehler, der falsche Verschmutzungswarnungen erzeugt.
2. **Regionen:** Sachsen, Thüringen, Sachsen-Anhalt und Bayern (`REGIONEN=` im Skript). Speicher und Bauzeit melden. Falls der Arbeitsspeicher beim Bau nicht reicht, Bayern weglassen und melden.
3. Tests anpassen, Probe Werdau (50.73, 12.35) und eine Probe in Bayern (Hof, 50.31, 11.92) mit Ergebnisliste.
4. `pm2 reload ppp-api`, danach `/gesund` und `umgebung` über die Live-Domain prüfen.

# Abnahmekriterien
- Abstände entlang echter Geometrie, Werdau-Liste ohne „bahn 0 m“, vier Länder lokal, `npm test` grün, Commit, Dienst gesund.
