---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Fortsetzung von `2026-11-18-1240-pv-monteur-schnittstelle-leistungscheck`. Der Lauf ist nach 30 Minuten abgebrochen, während er auf das Ende der gesamten Testsuite wartete. Vertrag: `projekte/ppp/schnittstelle/leistungscheck-pv-monteur.md`.

**Zeitplan, damit es diesmal durchläuft (Gesamtlimit 30 min):**
1. Zuerst Stand prüfen (`git -C /root/pv-monteur status --short`, `git log -5 --oneline`): Was ist schon gebaut, was ist schon committet? Nichts doppelt bauen. Uncommittete, sinnvolle Arbeit sichern (Commit „WIP Schnittstelle Leistungscheck“), bevor du weitermachst.
2. Fehlende Teile fertigstellen (Router, Schlüsselbestand, Kontext, Schalter, Werkzeug `tools/schluessel-ausstellen.js`, Webhook, E-Mail an die Leitung).
3. **Tests in zwei Stufen:**
   - Nur die neuen und direkt betroffenen Tests (Router, Mandant, Schlüssel, Webhook, Auftragsfelder) gezielt laufen lassen, jeweils mit `timeout 300`.
   - Die gesamte Suite **einmal** mit `timeout 900` im Vordergrund starten, Ausgabe in eine Datei (`> /tmp/pvm-suite.log 2>&1`), danach nur Zusammenfassung lesen. **Nicht** auf Monitore, Benachrichtigungen oder Hintergrundprozesse warten. Läuft sie in das Zeitlimit, das melden und die gezielten Tests als Nachweis nehmen.
4. Commit, Rückmeldung schreiben, **spätestens nach 25 Minuten**, auch wenn etwas offen ist (dann `status: teilweise` mit klarer Liste).
- Weiterhin: nicht nach `/root/pv-monteur-live` ausliefern, kein PM2-Neustart des Live-Dienstes, keine `.env` ändern.

# Abnahmekriterien
Wie im ursprünglichen Auftrag: Commit, gezielte Tests grün, Ergebnis der Gesamtsuite (oder Zeitüberschreitung gemeldet), Auslieferungsweg und „Offen für Andre“ mit `.env`-Variablen, firma_id von Andres Betrieb und den Befehlen.
