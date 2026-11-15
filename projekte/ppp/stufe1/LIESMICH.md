# PV Performance Pro – Stufe 1 online stellen

Auftrag an Claude Code auf srv1171441:
1. Diesen Ordner liegt in ~/uebergabe/projekte/ppp/stufe1.
2. Vorher prüfen, was heute unter photovoltaikperformancepro.com läuft (nginx -T | grep -A5 photovoltaikperformancepro). Andre kurz Bescheid geben, falls dort etwas Wichtiges läuft. kritis.photovoltaikperformancepro.com NICHT anfassen.
3. `bash online.sh` ausführen. Das Skript sichert die alte Konfiguration, kopiert die Website nach /var/www/eid/ppp-public, richtet Nginx und HTTPS ein.
4. Prüfen: https://www.photovoltaikperformancepro.com und /speicher/ laden, Impressum und Datenschutz öffnen, Formular testen (öffnet eine E-Mail).

Stufe 1 = nur Startseite und Speicher. Keine Datenbank, kein n8n, die Lead-API (eid-leads) noch NICHT starten.
