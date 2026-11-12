---
projekt: eid
ziel: vorschau
---
# Was soll passieren
Probeauftrag zum Testen des Übergabe-Kanals. **Nichts ändern, nichts committen, nichts neu starten.**

Mach eine reine Bestandsaufnahme von /var/www/photovoltaikperformancepro:
1. Ist es ein Git-Repo? Letzte 3 Commits, uncommitted Änderungen?
2. Welche Domain(s) liefern diesen Ordner aus? (nur lesen: `grep -rl photovoltaikperformancepro /etc/nginx/sites-enabled/` und die passenden `server_name`/`root`/`proxy_pass`-Zeilen)
3. Statisch oder Node? Falls Node: welcher PM2-Prozess (`pvpp-landing`, `eid-webhook`?) gehört dazu?
4. Wie unterscheidet sich der Ordner von /var/www/pvpp? Welcher ist die aktuelle EID-/Photovoltaik-Performance-Pro-Seite?
5. Gibt es schon eine Vorschau-Möglichkeit (z. B. preview-Subdomain oder Unterordner)? Falls nein: Vorschlag, wie man sie einrichtet (nur beschreiben).
6. Liste die vorhandenen Seiten/Unterseiten (Startseite, Impressum, Monitoring, Rechner …).

# Abnahmekriterien
- Rückmeldung beantwortet alle 6 Punkte knapp.
- Keine Datei wurde verändert.
