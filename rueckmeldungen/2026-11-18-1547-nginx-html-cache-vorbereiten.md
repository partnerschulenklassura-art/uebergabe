---
status: teilweise
vorschau_url:
commits: bb9323a
---
## Umgesetzt
- **Die Konfiguration ist `/etc/nginx/sites-available/ppp`.** Ich habe sie nur gelesen. Im `server`-Block stehen drei `add_header`-Zeilen mit `always`: CSP, `X-Content-Type-Options: nosniff` und `Referrer-Policy: strict-origin-when-cross-origin`. `location /assets/` setzt nur `expires 1y`. Weil dort kein `add_header` steht, kommen die Sicherheitsköpfe heute auf allen Seiten an.
- **Aktuelle Köpfe (curl, 18.11.2026 15:14):**
  - `/` und `/leistungscheck/`: 200, `text/html`, **kein Cache-Control**, CSP, nosniff und Referrer-Policy vorhanden.
  - `/assets/main-BezU4Gw1.css`: 200, `Expires: Thu, 18 Nov 2027`, `Cache-Control: max-age=31536000`, CSP, nosniff und Referrer-Policy vorhanden.
- **Das Skript ist geschrieben, aber noch nie gelaufen:** `/var/www/eid/ppp-stufe5/html-cache.sh`. Den Probelauf (`--trocken`) und `bash -n` durfte ich in dieser Sitzung nicht starten. Der Diff unten ist deshalb aus dem Skript abgeleitet und nicht maschinell erzeugt.
- **Was das Skript macht:**
  1. Es bricht ab, wenn die Änderung schon drin ist oder sich die erwarteten Zeilen geändert haben.
  2. Es übernimmt die drei Sicherheitsköpfe aus dem `server`-Block in `/etc/nginx/snippets/ppp-sicherheit.conf`.
  3. Es vergleicht den `/api/`-Block vorher und nachher und bricht ab, wenn er sich ändern würde.
  4. Es sichert die Datei nach `/root/ppp.nginx.vor-html-cache-<Zeit>`.
  5. Danach schreibt es die neue Fassung und führt `nginx -t` aus. Schlägt das fehl, setzt es die Sicherung zurück; sonst folgt `systemctl reload nginx`.
  6. Zum Schluss prüft es per curl `/leistungscheck/`, `/`, `/impressum` und eine Datei unter `/assets/`. Erwartet werden 200, genau ein passender Cache-Control-Kopf und alle drei Sicherheitsköpfe.
  7. Es endet mit „Fertig.“. Schlägt die Prüfung fehl, setzt es automatisch zurück und meldet einen klaren Fehler.
- **Geplante Änderung:**
```diff
--- /etc/nginx/sites-available/ppp
+++ /etc/nginx/sites-available/ppp (neu)
@@ -1,3 +1,9 @@
+# HTML immer neu prüfen lassen; leerer Wert = Kopf wird nicht gesetzt
+map $sent_http_content_type $ppp_html_cache {
+  ~^text/html  "no-cache";
+  default      "";
+}
+
 server {
   server_name photovoltaikperformancepro.com www.photovoltaikperformancepro.com;
   root /var/www/eid/ppp-public;
@@
-  location /assets/ { expires 1y; }
+  location /assets/ {
+    add_header Cache-Control "public, max-age=31536000, immutable" always;
+    include /etc/nginx/snippets/ppp-sicherheit.conf;
+  }
   location /api/leistungscheck/ {
@@
-  location / { try_files $uri $uri/ $uri.html =404; }
+  location / {
+    add_header Cache-Control $ppp_html_cache always;
+    include /etc/nginx/snippets/ppp-sicherheit.conf;
+    try_files $uri $uri/ $uri.html =404;
+  }
```
  Das neue Snippet enthält die drei `add_header`-Zeilen (CSP, nosniff, Referrer-Policy) wörtlich wie im `server`-Block. Dort bleiben sie auch stehen, `/api/` erbt sie also unverändert.
- **Zwei Designentscheidungen:**
  - `expires 1y` fällt weg, sonst käme Cache-Control doppelt.
  - HTML wird über den Content-Type erkannt, nicht über den Pfad. So bekommen auch `/impressum` (über `$uri.html`) und `/…/index.html` den Kopf `no-cache`. Bilder, `favicon.svg` und `robots.txt` außerhalb von `/assets/` bleiben ohne Cache-Control, wie bisher.

## Offen für Andre
- **Skript ausführen, als root:** zuerst `bash /var/www/eid/ppp-stufe5/html-cache.sh --trocken`, um den echten Diff zu sehen, danach ohne `--trocken`. Das ist ein Nginx-Eingriff und liegt deshalb bei dir.
- **Der `map`-Block steht ganz oben in `sites-available/ppp`.** Das klappt nur, wenn die Datei über `sites-enabled` im `http`-Kontext eingebunden ist; das ist der Standard unter Ubuntu. Ich konnte das nicht prüfen, `nginx -t` im Skript würde es aber melden.
- **Die Weiterleitung aus Stufe 2 fehlt in der aktuellen Konfiguration.** Gemeint ist die Weiterleitung von „ohne www“ auf www (`projekte/ppp/stufe2/weiterleitung.sh`). Sie wurde offenbar nie angewendet oder später überschrieben.

## Fragen an Claude Desktop
- **Ablageort:** Der Rahmen verbietet Änderungen im Übergabe-Repo, der Auftrag verlangt dort einen Commit. Ich habe das Skript deshalb nach `/var/www/eid/ppp-stufe5/` gelegt, analog zu `ppp-stufe3`. Bitte bei Bedarf nach `projekte/ppp/stufe5/html-cache.sh` übernehmen.
- **Bilder unter `/img/`:** Sollen sie auch einen Cache-Control-Kopf bekommen, z. B. `max-age=86400`? Sie sind nicht gehasht und daher nicht `immutable`-fähig.
