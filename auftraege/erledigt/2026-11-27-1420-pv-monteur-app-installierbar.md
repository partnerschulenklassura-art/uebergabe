---
projekt: pv-monteur
ziel: vorschau
---
# Was soll passieren
PV-Monteur soll sich auf Windows-PC (Chrome/Edge „App installieren“) und Handy (Android/iOS „Zum Startbildschirm“) sauber als App installieren lassen. Live hat `manifest.webmanifest` **keine `icons`** – Chrome/Edge bieten die Installation dann nicht an. Limit 20 Minuten, nichts ausliefern, kein PM2, keine .env.

1. Icons ergänzen: 192×192, 512×512 (auch `purpose: "maskable"`), `apple-touch-icon` 180×180, aus dem vorhandenen Logo/der Markenfarbe `#f2b705`. Im Manifest außerdem `id`, `lang: "de"`, `description`, `scope`. `<link rel="apple-touch-icon">` und `<meta name="theme-color">` im HTML prüfen.
2. `sw.js` lesen und in der Rückmeldung in 3–5 Sätzen beschreiben, **was ohne Internet funktioniert** (Oberfläche? laufende Prüfung erfassen? Fotos? später synchronisieren?) und was nicht. Nichts daran ändern.
3. Test oder Prüfskript, dass das Manifest die Installationskriterien erfüllt (Name, start_url, display, Icons 192/512, gültige Pfade).
4. Commit auf dem Zweig `kundenbetrieb` (geht mit dem IWS-Release mit) und in der Rückmeldung sagen, ob dafür ein PM2-Neuladen nötig ist.

# Abnahmekriterien
- Manifest mit Icons, Test grün, Beschreibung des Offline-Verhaltens.
