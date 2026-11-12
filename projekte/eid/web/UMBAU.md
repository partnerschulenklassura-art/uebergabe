# Umbau Startseite nach dem Worth-Making-Vorgehen (04.11.2026)

Vorlage: „Wir pimpen eine 08/15-KI-Website“ (Worth Making, YouTube). Vier Schritte, übertragen auf das EID-Thema.

| Schritt | Video (Rösterei) | EID |
| --- | --- | --- |
| 1 Lenis | weiches Scrollen | aktiv, am GSAP-Ticker (`src/lib/smoothScroll.js`) |
| 2 React Bits | Vollbild-Hero, LiquidEther-Rauch, BlurText | Vollbild-Hero, **LightRays** in Sonnengelb, Überschrift mit SplitText (Blur) |
| 3 GSAP | Bohne röstet beim Scrollen in 5 Phasen, Live-Temperatur, Funken beim First Crack, seitliche Galerie | **Ein Tag im Leben Ihres Stroms**: angepinnt, Sonne läuft 5–21 Uhr, Live-Werte (Uhrzeit, Erzeugung, Börsenpreis, Speicher), Funken, wenn der Preis unter null fällt und der Speicher lädt; Fristen als seitliche Galerie; Überschriften Zeile für Zeile aus der Maske; Inhalte per ScrollTrigger.batch |
| 4 Feinschliff | Handy, Bewegung reduzieren, Ladezeit | WebGL nur ab 900 px Breite und erst nach erster Interaktion (oder 4 s), Handy bekommt CSS-Strahlen; reduzierte Bewegung zeigt die Geschichte als Liste; robots.txt |

## Lighthouse (lokal, `vite preview`)

| Stand | Gerät | Performance | Barrierefreiheit | Best Practices | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| vorher | Handy | 86 | 100 | 100 | 91 | 2,7 s | 310 ms |
| vorher | Desktop | 99 | 100 | 100 | 91 | 0,6 s | 10 ms |
| Effekte ohne Feinschliff | Handy | 65 | 100 | 100 | 91 | 2,8 s | 1.850 ms |
| **nachher** | Handy | **89** | 100 | 100 | **100** | 2,7 s | 230 ms |
| **nachher** | Desktop | **100** | 100 | 100 | **100** | 0,6 s | 20 ms |

Nächste Schritte: Abschnitte Prüfen, Vermarkten, Speichern, Warteliste nacheinander überarbeiten; dann eigene Unterseiten je Bereich.

## Schritt 2 (04.11.2026 abends): eine Seite, zwei Blickwinkel, 3D

- Kern der Seite ist jetzt „Ein Tag im Leben Ihres Stroms“ als 3D-Szene (three.js, `src/three/energyScene.js`): Hof mit PV-Dach, Speicher, drei Käuferhäuser, Leitungen mit Stromfluss als Lichtpunkte, Sonne und Himmel nach Uhrzeit, Fenster gehen abends an.
- Umschalter „Ich habe eine PV-Anlage“ / „Ich kaufe Strom“ mit Live-Geldzählern aus dem Rechenmodell `src/lib/money.js` (Quellen: BDEW 10/2026, Marktwerte Solar 2026).
  - Käufer: Festpreis 37,3 ct vs. dynamischer Tarif mit verschobenem Verbrauch → rund 25 % weniger.
  - Erzeuger 30 kWp + 60 kWh: reiner Börsenerlös ohne vs. mit Speicher → rund das 2,2-Fache.
- Neuer Abschnitt „Zwei Seiten, ein Geschäft“, Formular mit „Günstiger Strom kaufen“.
- 3D lädt erst nach der ersten Interaktion und wenn der Abschnitt in die Nähe kommt.

| Stand | Gerät | Performance | A11y | BP | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mit 3D | Handy | 82 | 100 | 100 | 100 | 2,9 s | 380 ms | 0,044 |
| mit 3D | Desktop | 100 | 100 | 100 | 100 | 0,6 s | 30 ms | 0,02 |
