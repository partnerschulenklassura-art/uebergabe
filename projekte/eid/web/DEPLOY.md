# EID-Website – Bauen und veröffentlichen

Sieben Seiten, jede mit eigener HTML-Datei: `/`, `/strom/`, `/speicher/`, `/komponenten/`, `/planen/`, `/pruefen/`, `/schutz/`. Dazu Impressum, Datenschutz und die Rückmeldeseiten `bestaetigt.html`, `link-ungueltig.html`, `abgemeldet.html`.

Alle Formulare schreiben über `/api/leads` in die gemeinsame Lead-Datenbank (`../eid-leads`).

## Lokal
```bash
npm ci
npm run dev        # http://localhost:5173, /api wird an 127.0.0.1:3120 weitergereicht
npm run build      # Ergebnis in dist/
```

## Auf srv1171441
1. Lead-API einrichten: siehe `../eid-leads/README.md` (läuft auf 127.0.0.1:3120).
2. Website hochladen:
```bash
rsync -av --delete dist/ root@72.62.53.87:/var/www/eid/
```
3. Nginx, einmalig:
```nginx
server {
  server_name eid.unternehmensdigitalisierung.io;   # später eigene Domain
  root /var/www/eid;
  index index.html;
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;

  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location /api/ {
    proxy_pass http://127.0.0.1:3120;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location / { try_files $uri $uri/ $uri.html =404; }
}
```
```bash
nginx -t && systemctl reload nginx
certbot --nginx -d eid.unternehmensdigitalisierung.io
```
Achtung: Auf dieser Subdomain liegt derzeit die alte Warteschlange-Seite. Vorher sichern.

## Formulare
- Jede Seite zeigt nur die Interessen, die zu ihr passen. Vorauswahl per Link: `/strom/?interesse=kaufen#warteliste`.
- UTM-Parameter aus Kampagnen-Links werden mitgespeichert.
- Antwortet die API nicht, bietet das Formular eine vorausgefüllte E-Mail an.
- Interessen-Liste: `src/lib/catalog.js` – muss mit `eid-leads/src/catalog.js` übereinstimmen.

## Technik
React 19 + Vite (Multi-Page), GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, three.js (3D-Szene nur auf der Startseite, lädt erst bei Interaktion), React Bits (SplitText, SpotlightCard, LightRays; MIT + Commons Clause). Schriften lokal, keine Cookies, keine externen Requests.

## Lighthouse (lokal, 05.11.2026)
| Seite | Handy | Desktop | A11y / BP / SEO |
| --- | --- | --- | --- |
| Start (mit 3D) | 85 | 100 | 100 / 100 / 100 |
| Strom | 93 | 100 | 100 / 100 / 100 |
| Prüfen | 92 | 100 | 100 / 100 / 100 |
