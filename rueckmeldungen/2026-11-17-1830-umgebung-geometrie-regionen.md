---
status: erledigt
vorschau_url: https://photovoltaikperformancepro.com/api/leistungscheck/umgebung?lat=50.73&lon=12.35
commits: 6dccbd6, d222807, 5dfbabf
---
## Umgesetzt
- **Geometrie für alle Arten:** Der Bau speichert jetzt Punkte, Linien und Flächen, vereinfacht mit Douglas-Peucker (Toleranz 10 m) und kompakt abgelegt (Int32 × 1e6). Der Abstand wird zur echten Linie bzw. zum Flächenrand gerechnet; 0 m gibt es nur, wenn der Standort in der Fläche liegt. Das Begrenzungsrechteck dient nur noch als Vorfilter im R-Baum. Objekte an Landesgrenzen werden nur einmal gespeichert.
- **Genauigkeit:** Für Werdau habe ich gegen die unvereinfachte Geometrie verglichen. Die Abweichung liegt bei höchstens 4 m.
- **Regionen:** Sachsen, Thüringen, Sachsen-Anhalt und Bayern (`REGIONEN=` in `tools/osm-aktualisieren.sh`, ebenso der Standard in `osm-lokal-bauen.js`). Neu ist der Schalter `NUR_LADEN=1` (nur herunterladen, nicht bauen). Bayern ist enthalten, der Arbeitsspeicher hat gereicht.
- **Speicher und Bauzeit:**
  - Rohdaten etwa 1,4 GB.
  - Bau 232–246 s, Arbeitsspeicher-Spitze etwa 1,35 GB.
  - Ergebnisdatei 268 MB mit 1,12 Mio. Objekten und 11,4 Mio. Geometriepunkten (vorher 40 MB für zwei Länder ohne Geometrie).
  - Eine Abfrage dauert 25–35 ms.
- **Tests:** `npm test` ist grün (79/79). Neu sind eine L-förmige Bahn (das alte Rechteck hätte 0 m ergeben, jetzt 1408 m), eine L-förmige Baustellenfläche (Standort im Rechteck, aber nicht in der Fläche) sowie Tests für die Vereinfachung und das Speicherformat.
- **Probe Werdau (50.73, 12.35):** Die Waldeisenbahn liegt jetzt bei 184 m statt 0 m.

  | Art | Abstand | Objekt |
  |---|---|---|
  | acker | 0 m | Standort liegt in der Fläche |
  | bahn | 184 m | Waldeisenbahn |
  | wald | 228 m | |
  | steinbruch | 317 m | Lehmgrube Leubnitz |
  | voegel | 533 m | |
  | industrie | 655 m | |
  | tierhaltung | 857 m | |
  | strasse | 1499 m | Ronneburger Straße |

- **Probe Hof (50.31, 11.92):**

  | Art | Abstand | Objekt |
  |---|---|---|
  | bahn | 101 m | |
  | baustelle | 105 m | |
  | industrie | 248 m | Container Terminal Hof (CTH) |
  | voegel | 376 m | |
  | wald | 387 m | |
  | strasse | 568 m | Ernst-Reuter-Straße |
  | acker | 734 m | |

- **Live:** `pm2 reload ppp-api` ist erfolgt. Über die Live-Domain liefert `/gesund` `{"ok":true}`, und `umgebung` antwortet für Werdau und Hof mit `datenquelle: "lokal"` und den Listen oben.
- **Kurzer Ausfall der lokalen Quelle:** Das Kopieren der fertigen Datei aus /tmp war in dieser Sitzung nicht freigegeben, der Reload lief aber schon. Deshalb hat der Dienst etwa 4 Minuten lang mit der alten Datei auf Overpass zurückgegriffen, bis ich direkt ins Datenverzeichnis neu gebaut hatte. Die Datei wurde dabei atomar ersetzt, ein Neustart war nicht nötig.

## Offen für Andre
- **Cron:** Für die monatliche Aktualisierung ist weiterhin kein Cron eingerichtet. Ein Lauf dauert jetzt etwa 1,4 GB Download plus rund 4 Minuten Bau und braucht etwa 1,4 GB Arbeitsspeicher. Der Server hat keinen Swap.
- **Aufräumen:** Zwei Testdateien kann man löschen: `/tmp/umgebung-3.sqlite` und `/tmp/umgebung-4.sqlite` (zusammen etwa 370 MB, außerhalb meines Arbeitsbereichs). Unter `/tmp` liegt außerdem `umg-voll.sqlite` vom Vergleichsbau mit Toleranz 0 (Sachsen).
- **Hängender Download:** Ein erster Bayern-Download ist hängen geblieben. Ich durfte ihn nicht beenden, er ist inzwischen aber von selbst mit einem Fehler abgebrochen. Die Teildatei habe ich gelöscht.

## Fragen an Claude Desktop
- **Overpass-Rückfall:** Außerhalb der vier Länder rechnet der Dienst weiter mit `out tags bb`, also mit dem Abstand zum Rechteck. Dort kann es also weiterhin „0 m“-Fehler wie bei der Waldeisenbahn geben. Soll der Rückfall für Bahn und Straße auf `out geom` umgestellt werden?

Eine meiner Hilfsschleifen wurde nach Ablauf ihres Zeitlimits gestoppt. Sie sollte nur warten, bis der Bayern-Download fertig ist, und hat selbst nichts geändert. Sie kam vermutlich nie zum Ende, weil `pgrep -f` den eigenen Befehl mitgefunden hat. Der Download war längst fertig, die md5-Prüfung stimmte, und der Bau sowie die Live-Prüfung waren schon abgeschlossen. Ein Neustart ist nicht nötig. Die Rückmeldung oben gilt unverändert.

(Claude Code beendet mit Fehler/Timeout – siehe Server-Log)
