---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
NUR LESEN, nichts ändern, nichts neu starten. Andre will PV-Monteur mit dem Leistungscheck koppeln (Konzept: https://claude.ai/artifact/WYXq2JdFo97xHWckGoQ8QA). Der Leistungscheck legt später Prüfaufträge in PV-Monteur an und bekommt Status und Befunde zurück, nur über eine Schnittstelle mit Schlüssel. Für die Planung brauchen wir eine Bestandsaufnahme von `/root/pv-monteur`.

Bitte in der Rückmeldung beschreiben:
1. Aufbau: Sprache/Framework, Einstiegspunkt, PM2-Prozess, Port, Datenbank (Typ, Name, wo die Verbindung konfiguriert ist; Passwörter NICHT nennen).
2. Datenmodell: Tabellen oder Sammlungen für Betriebe, Nutzer, Anlagen, Aufträge, Protokolle, Messwerte, Befunde. Je Tabelle die Felder (Name, Typ) und Beziehungen. Gibt es schon so etwas wie einen Auftrag mit Status?
3. Vorhandene Schnittstellen: alle Routen unter /api (Methode, Pfad, Zweck, wie authentifiziert). Gibt es Webhooks oder API-Schlüssel für Fremdsysteme?
4. Wie ein Protokoll abgeschlossen und mit Prüfsumme versehen wird, und in welcher Form Messwerte und Befunde gespeichert sind (Einheiten, Schwere, Maßnahme).
5. Welche Anlagendaten PV-Monteur heute erfasst (Komponenten, Wechselrichter, AC-Kabel, Strings).
6. Vorschlag: Wo würden die zwei Endpunkte (Prüfauftrag anlegen, Status/Befunde abfragen) und ein Webhook am saubersten hinpassen, ohne Regel R1 zu verletzen (KI erzeugt keine Mess-, Grenz- oder Sicherheitswerte)?

# Abnahmekriterien
- Rückmeldung mit den Punkten 1 bis 6, keine Änderung an Dateien, Datenbank oder Prozessen, keine Secrets in der Rückmeldung.
