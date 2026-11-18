---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
Teil 2 zu den Bauteilen als Vorschlag (Zweig `leistungscheck-komponenten` in `/root/pv-monteur`). Limit 20 Minuten.

1. **Anzeige nicht neu bauen**, nur abnehmen: `public/js/panels/auftraege/komponenten-vorschlag.js` lesen, prüfen, dass es nur anzeigt (keine Übernahme in Stammdaten), Überschrift „Angaben des Eigentümers (ungeprüft)“, Texte escaped (kein innerHTML mit Eigentümer-Text), und den zugehörigen Test laufen lassen. Fehler beheben, sonst nichts ändern.
2. `scripts/komponenten-online.sh`: Ausführungsrecht wiederherstellen (`chmod 755`), committen. `scratchpad/teile-lauf.sh` nicht committen, nicht löschen.
3. Das Skript so ergänzen bzw. prüfen, dass es für Andre **in einem Aufruf** alles erledigt:
   - Sicherung, neues Release von PV-Monteur aus dem Zweig, PM2-Neustart, Gesundheitsprüfung, Rücksprung bei Fehler (Muster `projekte/ppp/stufe4/pruefauftrag-online.sh`, liegt im Übergabe-Repo).
   - Danach in `/var/www/eid/ppp-api/.env` `PVM_LC_KOMPONENTEN=1` setzen (Zeile ersetzen oder anhängen, Sicherung der .env vorher, Werte nie ausgeben) und `pm2 restart ppp-api --update-env`, Gesundheit `/api/leistungscheck/gesund` prüfen; bei Fehler .env zurück und erneut neu starten.
   - Ein Probelauf: ein Prüfauftrag mit Block `komponenten` über ppp-api (Fremdnummer `LC-TEST-KOMP-<Zeit>`, Telefon „0000000000“, Einwilligung true), danach prüfen, dass in PV-Monteur am Auftrag `komponenten_vorschlag` mit `ungeprueft: true` liegt und Stammdaten unverändert sind. Auftragsnummer ausgeben, damit Andre den Testauftrag löschen kann.
   - Ende mit „Fertig. Sicherung: …“ oder klarer Fehlermeldung.
   - `bash -n` auf das Skript, falls erlaubt.
4. Commit auf dem Zweig. Das Skript **nicht** ausführen.
5. In die Rückmeldung den **vollständigen Inhalt** von `scripts/komponenten-online.sh` als Codeblock (nichts kürzen), damit Claude Desktop ihn prüfen kann.

# Abnahmekriterien
- Anzeige-Test grün, Skript mit 755 committet, vollständiger Skriptinhalt in der Rückmeldung.
