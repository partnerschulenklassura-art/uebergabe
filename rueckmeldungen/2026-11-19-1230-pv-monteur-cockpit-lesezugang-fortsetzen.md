---
status: erledigt
vorschau_url:
commits: 0541bbca (dazu aus dem abgebrochenen Lauf: 1fcf069a, 420e2ca7, ae1e1fcd)
---
## Umgesetzt
- **Ausgangslage:** Der Zweig `cockpit-lesezugang` gab es schon, und fast alles war bereits committet: Schlüsselart `cockpit` (`pvm_ck_`), das Werkzeug mit `--art cockpit`, der Schalter `PVM_COCKPIT` (steht in `.env.example`), `GET /api/v1/cockpit/zeitraum` und `/offen`, die Begrenzung auf 60/min je Schlüssel, `scripts/cockpit-online.sh` und die Korrekturen aus Gate 2. Offen war nur noch die Aufteilung der Tests. Nichts wurde doppelt gebaut.
- **Tests aufgeteilt:** Werkzeug und Gate-2-Proben stehen jetzt in `tests/cockpit-2.test.js`, damit keine Datei über 200 Zeilen kommt (AK 60). Committet in 0541bbca.
- **Ausführungsrecht:** `scripts/cockpit-online.sh` hatte im Arbeitsbaum sein Ausführungsrecht verloren. Das ist wiederhergestellt, der Inhalt ist unverändert.
- **Inventarwachen nachgezogen** und im Test begründet. Beide waren schon durch die Leistungscheck-Auslieferung vom 18.11. rot, nicht durch das Cockpit:
  - `w6-4-d3-leser`: Die Leser von `zaehleBefunde` sind von 12 auf 13 gestiegen. Neu ist `lib/leistungscheck-status.js`; die Stelle liest nur und lässt gestrichene Einträge weg.
  - `weg-zu-ende` Z8: Die Zahlen sind an `vorzustand-inventar` angepasst (68 → 71 und 62 → 68).
- **Gezielte Tests mit `timeout 300`:** 77 von 77 grün. Gelaufen sind cockpit, cockpit-2, leistungscheck-schluessel, vorzustand-inventar, w2c-e-inventar, auslieferung-wachen, weg-zu-ende, naht-vertrag, w6-4-d3-leser, die zwei Sackgassen-Wachen und satztabelle-wache. Die Gesamtsuite habe ich wie vorgegeben nicht gestartet.
- **Release-Zweig:** Den Zweig `release-2026-11-19-cockpit`, den das Skript erwartet, habe ich lokal auf 0541bbca angelegt. Ausgeliefert ist damit nichts.
- **Nicht gemacht:** keine Auslieferung nach `/root/pv-monteur-live`, kein PM2-Neustart, keine `.env` geändert. Das Skript habe ich nicht ausgeführt, und eine Syntaxprüfung mit `bash -n` war ohne Freigabe nicht möglich.

## Offen für Andre
- **Ausrollen.** Das Skript legt vorher eine Sicherung an und geht bei einem Fehler automatisch zurück. Den Schlüssel schreibt es nur in `/var/www/eid/cockpit/.env`, auf dem Bildschirm erscheint er nicht:
  `bash <(git -C /root/pv-monteur show release-2026-11-19-cockpit:scripts/cockpit-online.sh) release-2026-11-19-cockpit #`
- **Liegengebliebene Datei:** `scratchpad/teile-lauf.sh` stammt aus dem Auftrag vom 18.11. und ist nicht committet. Sie kann gelöscht werden.

## Fragen an Claude Desktop
- Keine.
