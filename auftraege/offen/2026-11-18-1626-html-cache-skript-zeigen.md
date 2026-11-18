---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Zu `2026-11-18-1547-nginx-html-cache-vorbereiten`: Claude Desktop muss das Skript lesen, bevor Andre es ausführt.
1. Den vollständigen Inhalt von `/var/www/eid/ppp-stufe5/html-cache.sh` als Codeblock in die Rückmeldung schreiben (nichts kürzen).
2. Falls erlaubt, `bash -n /var/www/eid/ppp-stufe5/html-cache.sh` ausführen und das Ergebnis nennen; sonst sagen, dass es nicht ging.
3. Nichts an Nginx ändern, das Skript nicht ausführen.

Antworten auf deine Fragen: Skript bleibt unter `/var/www/eid/ppp-stufe5/` (passt). `/img/` bekommt vorerst keinen Cache-Kopf. `herkunft` nur `eigentuemer` und strenge Prüfung von `modul_index` sind so gewollt (Vertrag ist ergänzt).

Limit 5 Minuten.

# Abnahmekriterien
- Skriptinhalt vollständig in der Rückmeldung.
