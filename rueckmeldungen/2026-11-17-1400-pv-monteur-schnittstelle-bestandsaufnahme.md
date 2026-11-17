Punkt 1 ist geklärt. Ich warte jetzt auf die vier Lese-Agenten (Datenmodell, Routen, Abschluss/Messwerte/Befunde, Anlagendaten).

Routen-Katalog liegt vor. Ich warte noch auf die drei übrigen Agenten.

Die Anlagendaten sind erfasst. Zwei Agenten laufen noch: Datenmodell sowie Abschluss/Messwerte/Befunde.

Datenmodell liegt vor. Es fehlt nur noch der Agent für Abschluss, Prüfsumme, Messwerte und Befunde.

---
status: erledigt
vorschau_url:
commits: keine (reine Bestandsaufnahme, nichts geändert)
---

## Umgesetzt

Ich habe nur gelesen. Ich habe keine Datei, keine Daten und keinen Prozess geändert, und das Arbeitsverzeichnis ist sauber. `.env` habe ich nur nach einzelnen Namen durchsucht, ohne Werte zu übernehmen. Aus `data/*.json` habe ich keine Inhalte gelesen.

### 1. Aufbau
- **Sprache und Framework:** Node.js mit Express 5 und express-session. Weitere Bibliotheken: bcryptjs, pdf-lib, nodemailer. Ein Frontend-Framework gibt es nicht, die Oberfläche ist reines JS unter `public/`, mit Offline-Speicher im Browser (IndexedDB).
- **Einstiegspunkt:** `server.js`. Die Fachlogik liegt in `lib/` (rund 400 Dateien) und `routes/`.
- **PM2-Prozess:** `pv-monteur`, im Fork-Modus mit genau einer Instanz. Der Code verlangt das ausdrücklich (`lib/eine-instanz.js`).
  - **Wichtig:** PM2 startet nicht aus `/root/pv-monteur`, sondern aus **`/root/pv-monteur-live`**, einer eigenen Kopie auf dem Zweig `release-2026-11-15c` mit eigenem `data/`.
- **Port:** 3821. Der Wert ist in `server.js:17` hinterlegt, ein `PORT` steht nicht in der `.env`. Nginx leitet `pv-monteur.unternehmensdigitalisierung.io` an `127.0.0.1:3821` weiter.
- **Datenbank:** Es gibt keine. Alles liegt in JSON-Dateien unter `data/<bestand>.json` im Format `{eintraege:[…]}`.
  - Zugriff über `lib/datei.js` und `lib/speicher*.js`. Schreiben läuft nacheinander durch eine Warteschlange je Datei.
  - Der Ablageort wird über `PVM_DATEN_PFAD` eingestellt, Vorgabe ist `./data`.
  - Mandantentrennung über `firma_id` in `lib/mandant.js`. Die Firma kommt nur aus der Sitzung, eine fremde id ergibt 404.

### 2. Datenmodell
Jeder Eintrag hat diese Felder, die der Server setzt: `id`, `firma_id`, `erstellt_am`, `erstellt_von`, `geaendert_am`. Welche Felder je Bestand erlaubt sind, steht in `routes/store/felder-listen.js`.

| Bestand | Wichtige Felder | Beziehungen |
|---|---|---|
| **firmen** (Betriebe) | name, anschrift, status, sitzplaetze_gebucht, Abo-Daten (`stripe_*`, abo_*) | Mandantenschlüssel |
| **zugaenge** (Nutzer) | name, email, rolle `leitung`\|`monteur`, aktiv, passwort_hash (bcrypt), befaehigungen[] | firma_id |
| **teams** | name, leiter, region, mitglieder[] | über auftraege.team_id |
| **auftraege** | kunde, adresse, lat/lng, betreiber, leistung_kwp, module, anlagenschluessel, wechselrichter_seriennummer, termin, beginn/ende, monteur, **status**, fortschritt, **fremdnummer**, **fremdnummer_stelle**, auftragsnummer (Server, `PV-<Jahr>-NNNN`), teilflaechen[] | team_id |
| **anlagen** | Technikfelder, positionen[], Netzbetreiber-Felder, Prüfintervall (siehe 5.) | auftrag_id (wird geprüft) |
| **protokolle** (= „Vorgang“) | typ, datum, pruefanlass_vorbelegung, witterung, **messreihen[]**, **messwerte[]**, **befunde[]**, beobachtungen; Server: abgeschlossen_*, abdruck, verifikationskennung, fassung, vorgaenger_id, gesamtergebnis, eingefrorene `*_fassung`-Kopien | auftrag_id (absichtlich ungeprüft, offline-sicher), anlage_id |
| **tickets** | herkunft `befund`\|`beobachtung`, status, schritte, verlauf | protokoll_id, befund_id, messwert_id |
| **folgemessungsauftraege** | verfahren, bedingung, frist, erfuellt_am, aufhebungsgrund; Zustand berechnet: offen/verfristet/erfuellt/aufgehoben | anlage_id, positionsinstanz_id, messpunkt_id |
| **termine** | titel, datum, status `offen`\|`abgearbeitet`\|`abgesagt` | auftrag_id, ticket_id |
| **messmittel** | typ, hersteller, seriennummer, geraeteklassen, kalibrierungen[] | über messreihe.messmittel_id |
| **empfaenger / abrufkennungen** | Adressat bzw. Abruf-Code (bcrypt), 90 Tage gültig | fassung_id → protokolle |

**Auftrag mit Status:**
- `auftraege.status` gibt es, aber es ist **ein freies Textfeld**. Der Server prüft weder die Werte noch die Übergänge.
- Die Werte `planung`, `in_arbeit`, `montage`, `abnahme`, `fertig`, `problem` stehen nur im Browser (`public/js/app/format.js:20`).
- Feste Statusregeln gibt es nur bei Tickets (`offen → in_arbeit → geprueft`, `lib/ticket-zustand.js`), bei Terminen und bei Folgemessungsaufträgen.
- Ob ein Protokoll fertig ist, hängt an `abgeschlossen_am`, nicht an einem Status.

### 3. Vorhandene Schnittstellen
**Normale App-Routen:** Sitzungs-Cookie `pvm.sid` plus CSRF-Header `x-csrf-token` bei schreibenden Aufrufen. Davor prüft `zugangs-abgleich` den Header `x-pvm-zugang`. Es gibt zwei Rollen, Leitung und Monteur, und zusätzlich eine Rechte-Tabelle je Bestand.

- **Allgemeiner Speicher:** `GET/POST/PUT/DELETE /api/store/:bestand[/:id]`.
- **Protokoll-Unterwege:**
  - `POST …/protokolle/:id/abschluss`, `…/fassung`, `GET …/abschluss/bedingungen`
  - befunde, beobachtungen, tickets, bildaufnahmen, arbeitsgang, messort, messdaten-vorschau, abrufkennung
- **Anlagen:** `…/anlagen/:id/positionen`, `plaene`, `plaene/:pid/auswertung` (KI), `zeichnung-uebernahme`, `herkunft/:eid/bestaetigung`.
- **Weitere Bereiche:** `/api/dokument/protokolle/:id[/pdf]`, `/api/eingabemaske/*` (Listen), `/api/regelwerk/:art/:id`, `/api/fuehrung/*`, `/api/auswertung/*` (Bildprüfung), `/api/uebersicht/*`, `/api/benutzer*`, `/api/abo*`, `/api/kennwort/*`, `/api/registrierung*`, `/api/anmeldung`, `/api/abmeldung`, `/api/sitzung`.

**Öffentlich, vor der CSRF-Prüfung:**
- `POST /api/pruefstelle` prüft die Echtheit eines Protokolls (Kennung und Prüfsumme). Begrenzt auf 10 Aufrufe pro Minute und 60 pro Stunde.
- `POST /api/abruf` gibt einem Empfänger das PDF heraus (Kennung und Code, Sperre nach 5 Fehlversuchen).
- `POST /api/lead` ist das Formular der Webseite.
- `GET /api/gesundheit` meldet, ob der Dienst läuft.

**Webhooks und Schlüssel:**
- Eingehend gibt es nur `POST /api/abo/webhook` von Stripe (HMAC-SHA256-Signatur, 5 Minuten Toleranz).
- Ausgehend gibt es einen Webhook an n8n für Anfragen von der Webseite (`lib/lead-weitergabe.js`). Er sendet den Kopf `x-pvm-schluessel`, versucht es bis zu 5-mal und folgt keinen Weiterleitungen.
- **Für Fremdsysteme gibt es keinen eingehenden API-Schlüssel-Mechanismus.** Weder Bearer noch Schlüssel-Header werden irgendwo geprüft.

### 4. Abschluss, Prüfsumme, Messwerte, Befunde
**Abschluss:**
- `POST /api/store/protokolle/:id/abschluss`. Im Rumpf sind nur das Unterschriftsbild (PNG, höchstens 200 KB) und `vorschau_abdruck` erlaubt.
- Zuerst prüft der Server die Sperrgründe aus `lib/abschluss-pruefliste.js`, zum Beispiel offener KI-Gefahrhinweis, Befund ohne Foto, fehlendes Urteil, Betreiber nicht unterrichtet oder offene Checkliste.
- Dann stempelt er in einem einzigen Schreibvorgang: `verifikationskennung` (16 Zufallsbytes), `abgeschlossen_am/_von/_von_name`, eingefrorene Kopien von Anlage, Netzbetreiber und Auftragsnummer, `naechste_pruefung`.
- Danach ist das Protokoll unveränderlich (409). Eine Korrektur läuft nur über `…/fassung`: eine neue Fassung mit `fassung+1` und `vorgaenger_id`.

**Prüfsumme** (`lib/abdruck.js`):
- SHA-256 als Hex über den ganzen Datensatz. Die Schlüssel werden rekursiv sortiert, dazu kommt `schema:'fassung-1'`.
- **Ausgenommen** sind abdruck, abgeschlossen_am, abgeschlossen_von, abgeschlossen_von_name und unterschrift_bild. Zeitpunkt und Unterschrift sind also nicht durch die Prüfsumme geschützt.
- Es gibt keine Kette über die Prüfsummen der Vorfassungen und keinen qualifizierten Zeitstempel.
- Das PDF ist PDF/A-3b und enthält `fassung.json` als Anhang, sodass ein Empfänger die Prüfsumme selbst nachrechnen kann.

**Messwerte** (`protokolle[].messwerte[]`):
- Felder: `messpunkt_id` (aus dem Regelwerk), `positionsinstanz_id`, `wert`, `einheit`, `messreihe_id`, `messmittel_id`, `kalibrierstand_id`, `geraetezeit`, `serverzeit_eingang`.
- **`urteil`** ∈ `in_ordnung | befund | gefahr | nicht_bewertbar`. Das Urteil setzt nur der Server.
- Zulässige Einheiten: Ohm, MOhm, V, A, mA, kW, W/m², m, m/s, ms, s, min, h, C, K, %, Grad. Die Einheit muss zum Grenzwert passen.
- Grenzwerte kommen fest aus dem Regelwerk (`lib/regelwerk/messpunkte-*.js`, Auswahl in `grenzschema-auswahl.js`).
- **Am Messwert gibt es kein Feld, das zeigt, woher er stammt** (Hand, Import, …).

**Befunde** (an Protokoll oder Messwert):
- Felder: `befund_id` aus einem Katalog mit 34 Einträgen, `foto_ids`, `positionsinstanz_id`.
- Vom Server aus dem Katalog: **`schwere`** ∈ `kritisch|hoch|mittel|niedrig`, **`sicherheitsklasse`** ∈ `gefahr_im_verzug|erheblich|gering`, **`massnahme`** (Katalogtext), `sofortmassnahme`, `ebene` AC/DC/beides.
- Am Befund gibt es keine Frist. Fristen hängen an Folgemessungsaufträgen.

**KI:**
- Die KI liefert nur Auswahlen aus festen Listen, als Vorschlag in `auswertungen`.
- Jeder Vorschlag muss einzeln bestätigt werden. Ein KI-Gefahrhinweis sperrt den Abschluss.
- Von der KI führt kein Weg zu `messwerte` oder zu Grenzwerten.

### 5. Anlagendaten heute
- **Am Auftrag:** Adresse, lat/lng, Betreiber, leistung_kwp, Modulanzahl, `modul_kwp`, `datum_ibs`, teilflaechen[] (Azimut, Neigung, Module, kWp), WR-Seriennummer, Anlagenschlüssel.
- **An der Anlage:**
  - Netzform, Außenleiter (1/3), Systemspannungsklasse, RCD-Bauart und -Typ, MLPE-Art, Steckverbinder, Kontaktwerkstoff
  - WR-Typ (Freitext, wird einem WR-Katalog zugeordnet), CPU-Version, `wr_u_dc_max`, `wr_u_mpp_min/max`, `wr_u_start`
  - Modul- und WR-Hersteller, -Typ und -Leistung
  - 12 Netzbetreiber-Felder (`nb_*`: Leistungsgrenzen, Blindleistungsverfahren, Datum der Inbetriebsetzung, Zählernummer, Eichjahr)
  - DC-Erdungskonzept, Prüfintervall
- **Komponenten:** `positionen[]` aus 66 festen Typen. An diese Liste wird nur angehängt.
- **Strings:** Position `STRANG-DC` mit `module_in_reihe`, Uoc, Isc und Temperaturkoeffizienten von Hand. `strang_zuordnung` legt fest, welcher String an welchem WR hängt.
- **AC/DC-Kabel:** `leitungsabschnitte[]` mit von/nach, Seite, Werkstoff, Querschnitt, Länge, Verlegeart und weiteren Angaben. Spannungsfall und Belastbarkeit rechnet der Server.
- **Teilanlagen:** eigene Anlagen am selben Auftrag.
- **Pläne und Unterlagen:** Stromlaufplan, Stringplan, Datenblätter, IBS-Protokoll und andere. Aus ihnen kann die KI Vorschläge mit Herkunftsmarke machen.
- **Es fehlen:** Zählpunkt, Speicher bzw. Batterie, MPPT-Zuordnung, Modulkatalog, Absicherung am Leitungsabschnitt.
- Viele der neueren Felder sind nur aktiv, wenn der Schalter `PVM_ANLAGENDATEN=an` gesetzt ist.

### 6. Vorschlag zur Kopplung
**Grundsätzlich:**
- Ein eigener Router `routes/leistungscheck.js` unter `/api/v1/leistungscheck`.
- Eingehängt in `server.js` **vor** `zugangs-abgleich` und CSRF, so wie `pruefstelle` und `abruf`. Mit eigenem Größenlimit für den Rumpf und eigener Aufrufbegrenzung.
- Schutz über einen Schlüssel **je Betrieb**:
  - Neuer Bestand `schnittstellenschluessel` mit firma_id, Präfix, SHA-256-Hash, aktiv, gesperrt_am, letzte_nutzung.
  - Die Leitung stellt ihn aus, angezeigt wird er nur einmal (wie bei der Abrufkennung).
  - Daraus entsteht ein eigener Mandanten-Kontext `kontextAusSchluessel` in `lib/mandant.js`, der nur diese Schnittstelle nutzen darf.
  - Eingeschaltet über einen Schalter `PVM_LEISTUNGSCHECK`, Vorgabe aus.

**a) `POST /api/v1/leistungscheck/pruefauftraege`:**
- Legt einen Eintrag in `auftraege` an. Die Nummer aus dem Leistungscheck kommt in die vorhandenen Felder `fremdnummer` und `fremdnummer_stelle='leistungscheck'`.
- Sie dient zugleich dazu, doppelte Anlage zu verhindern: dieselbe Nummer ergibt dieselbe Antwort.
- Übernommen werden Adresse, Betreiber, kWp und WR-Seriennummer.
- Der Prüfanlass bekommt einen Wert aus `enums.js`, zum Beispiel `fehlersuche`.
- Die Auffälligkeit aus dem Leistungscheck kommt nur als **gekennzeichneter Anlass-Hinweis** dazu („Anlass laut Leistungscheck“), **nie** in messwerte, Grenzwerte oder befunde.
- Technische Anlagenwerte aus dem Leistungscheck gehen als Vorschlag mit Herkunftsmarke an die Anlage, nach dem Muster `herkunft_zeichnung` (zum Beispiel `herkunft_leistungscheck`). Die Leitung bestätigt sie.

**b) `GET /api/v1/leistungscheck/pruefauftraege/:fremdnummer`:**
- Der Status wird **auf dem Server abgeleitet**, nicht aus dem freien `status`-Text: angelegt → terminiert → in Prüfung (Protokoll offen) → abgeschlossen → neue Fassung.
- Befunde werden **nur aus abgeschlossenen, nicht überholten Fassungen** herausgegeben:
  - befund_id, label, schwere, sicherheitsklasse, massnahme, ebene
  - auf Wunsch messpunkt_id, wert, einheit und urteil
  - dazu `abdruck` und `verifikationskennung`, damit der Leistungscheck die Echtheit über die vorhandene Prüfstelle nachprüfen kann
- Entwürfe, gestrichene Einträge und KI-Vorschläge werden nie herausgegeben.

**c) Webhook (ausgehend):**
- Ein schmaler Hinweis nach dem Muster `lead-weitergabe`, also mit Warteschlange, Wiederholungen und ohne Weiterleitungen.
- Ausgelöst **nach** dem erfolgreichen Schreiben in `schliesseProtokollAb` bzw. bei neuer Fassung, nicht innerhalb des Schreibvorgangs.
- Inhalt nur `{ereignis, fremdnummer, auftragsnummer, fassung, abdruck, zeitpunkt}`, signiert mit HMAC-SHA256 nach Stripe-Art (`t.rumpf`). Die Einzelheiten holt der Leistungscheck danach per GET ab.

**Warum das R1 einhält:** In beiden Richtungen fließen nur vom Server geprüfte Daten. Der Leistungscheck kann keine Messwerte, Grenzwerte oder Befunde in PV-Monteur schreiben, und PV-Monteur gibt nur Werte heraus, die ein Monteur bestätigt und der Server beurteilt hat.

## Offen für Andre
- **Neue Secrets in `.env`, später:** ein Signaturschlüssel für den ausgehenden Webhook und die Ziel-URL des Leistungschecks. Die Schnittstellenschlüssel selbst würden nur als Hash in `data/` liegen.
- **Neuer Bestand** `schnittstellenschluessel.json` sowie neue Felder am Auftrag (Herkunft, Anlass-Hinweis). Das ist zwar keine Datenbank, ändert aber das Datenmodell und sollte ausdrücklich freigegeben werden.
- **Nginx:** Es ist keine Änderung nötig, denn `location /` leitet `/api/v1/…` schon weiter. Eine IP-Freigabeliste für den Leistungscheck wäre möglich, ist aber deine Entscheidung.
- **Live und Entwicklung sind getrennt:** Live läuft aus `/root/pv-monteur-live` mit eigenem `data/`. Eine Kopplung muss dort ankommen und mit diesen Daten zusammenpassen.
- **Kleinigkeit am Rande:** Der Startschritt (`prime`) verweist auf eine Arbeitsanweisung unter `/home/andre/.claude/…`, die es nicht gibt.

## Fragen an Claude Desktop
1. **Welchem Betrieb gehört ein Prüfauftrag?** Bekommt jeder Betrieb einen eigenen Schlüssel und der Leistungscheck wählt den Betrieb, oder gibt es einen zentralen Schlüssel mit Zuteilung in PV-Monteur? Davon hängt die Mandanten-Logik ab.
2. **Welches System ist der Leistungscheck auf dem Server?** Zum Beispiel `solar_core_v35` oder `pvpp-landing`? Und ruft er PV-Monteur intern über `127.0.0.1:3821` oder über die öffentliche Adresse auf?
3. **Sollen Messwerte überhaupt zurückgehen**, oder nur Status, Befunde und Prüfsumme? Weniger Daten heißt weniger Datenschutz-Fragen.
4. **Das Konzept unter claude.ai/artifact habe ich nicht gelesen**, der Link ist von hier aus nicht erreichbar. Falls dort schon Feldnamen oder Status-Werte festgelegt sind, bitte mitschicken.
