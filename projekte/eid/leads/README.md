# EID-Leads – gemeinsame Lead-Datenbank

Eine API für alle Bereiche des Energie-Instituts Deutschland. Jede Seite (Start, Strom, Speicher, Komponenten, Prüfen, Planen, Schutz) schickt ihre Anfragen hierher, markiert mit dem Interesse. Daraus entstehen automatisch Folgeangebote für die anderen Bereiche.

Express 5 + PostgreSQL, abgeleitet aus dem Nachbarwatt-Backend. 13 Tests gegen eine echte Datenbank.

## Was drin ist

| Bereich | Umsetzung |
| --- | --- |
| Interessen und Regeln | `src/catalog.js` – Interessen, Angebote, Weiterreich-Regeln an einer Stelle |
| Leads | `POST /api/leads` – Validierung mit deutschen Meldungen, Honeypot, Rate-Limit |
| DSGVO / UWG | Double-Opt-in, drei versionierte Einwilligungen (Datenschutz, Rückruf, Angebote), IP nur gesalzen gehasht, unbestätigte Leads nach 30 Tagen gelöscht, Abmeldelink in jeder E-Mail |
| Weiterreichen | `GET /api/admin/followups` liefert fällige Angebote – **nur** bestätigt, mit Angebots-Einwilligung, nicht abgemeldet, nicht „verloren“ |
| Admin | `GET /api/admin/leads?bereich=strom&interest=kaufen&confirmed=true&callback=true&format=csv`, `GET /api/admin/stats`, `PATCH /api/admin/leads/:id {status}`, `POST /api/admin/leads/:id/followups {offer}`, `DELETE /api/admin/leads/:id` |
| Katalog | `GET /api/catalog` (öffentlich) |

## Weiterreich-Regeln (Auszug)

| Wer sich einträgt für … | bekommt danach (Tage nach Bestätigung) |
| --- | --- |
| Anlage planen | Komponenten (3), Speicher (7), Schutz (21) |
| Komponenten | Speicher (5), Wartung (14), Schutz (21) |
| Neuanlage 2027 | Komponenten (2), Speicher (5), Strom an Nachbarn verkaufen (10) |
| Bestandsanlage vermarkten | Speicher (3), Strom an Nachbarn (7), Wartung (14), Schutz (21) |
| Speicher | Pool/Kapazitätsmarkt (14), Wartung (21) |
| Strom kaufen | Eigene Anlage planen (21) |
| PV-Monteur | Kunden vermitteln (7), Komponenten (14) |
Vollständig in `src/catalog.js`.

## Installation auf srv1171441

```bash
sudo -u postgres psql -c "CREATE USER eid WITH PASSWORD '...';"
sudo -u postgres psql -c "CREATE DATABASE eid OWNER eid;"

cd /var/www && tar xzf eid-leads.tar.gz && cd eid-leads
npm ci --omit=dev
cp .env.example .env && nano .env      # Tokens: openssl rand -hex 32
mkdir -p logs
pm2 start ecosystem.config.cjs && pm2 save
curl -s 127.0.0.1:3120/api/health      # {"ok":true}
```

In der Nginx-Konfiguration der Website (siehe `eid-web/DEPLOY.md`):
```nginx
location /api/ { proxy_pass http://127.0.0.1:3120; proxy_set_header X-Forwarded-For $remote_addr; proxy_set_header Host $host; }
```

## n8n

`n8n/eid-folgeangebote.json` importieren, zwei Zugangsdaten anlegen:
- **EID Admin**: Header Auth, Name `Authorization`, Wert `Bearer <ADMIN_TOKEN>`
- **EID SMTP**: dein Mailserver

Läuft werktags 9:17, verschickt jedes fällige Angebot einmal und markiert es als gesendet.

Für Astrid (Rückrufe): `GET /api/admin/leads?confirmed=true&callback=true&status=neu`. Nur Leads mit Rückruf-Einwilligung anrufen.

## Tests

```bash
TEST_DATABASE_URL=postgres://user:pass@127.0.0.1:5432/eid_test npm test
```
Löscht die Tabelle `eid_leads` in der Testdatenbank. Nie gegen Produktion.
