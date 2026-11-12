'use strict';
// Interessen, Angebote und Weiterreich-Regeln des Energie-Instituts Deutschland.
// Eine Stelle für alles: Website-Formular, API-Validierung, n8n-Folgeangebote.

/** Interessen, die das Formular senden darf. bereich = Unterseite, rolle = für Auswertungen. */
const INTERESTS = {
  kaufen: { label: 'Günstiger Strom kaufen', bereich: 'strom', rolle: 'kaeufer' },
  teilen: { label: 'Strom an Nachbarn verkaufen', bereich: 'strom', rolle: 'erzeuger' },
  bestand: { label: 'Bestandsanlage besser vermarkten', bereich: 'strom', rolle: 'erzeuger' },
  ue20: { label: 'Ü20-Anlage bewerten lassen', bereich: 'bewerten', rolle: 'erzeuger' },
  anlagenwert: { label: 'Anlagenwert prüfen lassen', bereich: 'anlagenwert', rolle: 'erzeuger' },
  neu2027: { label: 'Neuanlage ab 2027 vermarkten', bereich: 'strom', rolle: 'erzeuger' },
  speicher: { label: 'Speicher nachrüsten oder neu planen', bereich: 'speicher', rolle: 'erzeuger' },
  flex: { label: 'Speicherleistung in den Pool geben', bereich: 'speicher', rolle: 'erzeuger' },
  komponenten: { label: 'Komponenten anfragen', bereich: 'komponenten', rolle: 'erzeuger' },
  planen: { label: 'Anlage planen (SolarNavi)', bereich: 'planen', rolle: 'erzeuger' },
  schutz: { label: 'Anlage schützen (Solar Secure)', bereich: 'schutz', rolle: 'erzeuger' },
  wartung: { label: 'Prüfung oder Wartung beauftragen', bereich: 'pruefen', rolle: 'erzeuger' },
  performance: { label: 'Performance kostenlos rechnen lassen', bereich: 'pruefen', rolle: 'erzeuger' },
  fehlersuche: { label: 'Untersuchung vor Ort anfragen', bereich: 'pruefen', rolle: 'erzeuger' },
  monitoring: { label: 'Anlage überwachen lassen (Pilot)', bereich: 'ueberwachen', rolle: 'erzeuger' },
  pruefen: { label: 'PV-Monteur für meinen Betrieb', bereich: 'pruefen', rolle: 'betrieb' },
  installateur: { label: 'Als Installateur Kunden vermitteln', bereich: 'pruefen', rolle: 'betrieb' }
};

/** Folgeangebote: Titel, Seite, ein Satz für die E-Mail. */
const OFFERS = {
  komponenten: { title: 'Module, Wechselrichter und Speicher zu Partnerkonditionen', path: '/komponenten/' },
  speicher: { title: 'Mittagsstrom abends verkaufen: Speicher nachrüsten', path: '/speicher/' },
  flex: { title: 'Speicherleistung bündeln für den Kapazitätsmarkt', path: '/speicher/#pool' },
  teilen: { title: 'Strom an Nachbarn verkaufen statt zum Mittagspreis', path: '/strom/' },
  bestand: { title: 'Vermarktungsvertrag Ihrer Anlage prüfen lassen', path: '/strom/' },
  schutz: { title: 'Anlage gegen Ausfall, Diebstahl und Angriffe schützen', path: '/schutz/' },
  wartung: { title: 'Prüfung und Wartung nach VDE durch Partnerbetriebe', path: '/pruefen/' },
  performance: { title: 'Kostenlos nachrechnen: liefert Ihre Anlage, was sie soll?', path: '/anlagenwert/#fehlersuche' },
  fehlersuche: { title: 'Untersuchung vor Ort: den Fehler finden', path: '/anlagenwert/#fehlersuche' },
  monitoring: { title: 'Teilausfälle früh erkennen: Überwachung für Anlagen ab 100 kWp', path: '/ueberwachen/' },
  pruefen: { title: 'Prüfprotokolle nach VDE mit PV-Monteur, 14 Tage kostenlos', path: '/pruefen/' },
  installateur: { title: 'Ihre Kunden an uns vermitteln: Vermarktung und Speicher', path: '/pruefen/#partner' },
  planen: { title: 'Eigene Anlage planen mit SolarNavi', path: '/planen/' },
  ue20: { title: 'Was ist Ihre Solaranlage nach 20 Jahren wert?', path: '/bewerten/' },
  anlagenwert: { title: 'Was ist Ihre Solaranlage wert? Ertragswert und Substanzwert', path: '/anlagenwert/' }
};

/** Wer sich für X einträgt, bekommt nach N Tagen Angebot Y (nur mit Werbe-Einwilligung). */
const FOLLOWUPS = {
  planen: [['komponenten', 3], ['speicher', 7], ['schutz', 21]],
  komponenten: [['speicher', 5], ['wartung', 14], ['schutz', 21]],
  neu2027: [['komponenten', 2], ['speicher', 5], ['teilen', 10]],
  bestand: [['speicher', 3], ['teilen', 7], ['wartung', 14], ['schutz', 21]],
  teilen: [['speicher', 7], ['bestand', 14]],
  speicher: [['flex', 14], ['wartung', 21]],
  flex: [['speicher', 3]],
  ue20: [['wartung', 3], ['anlagenwert', 5], ['speicher', 7], ['bestand', 14]],
  anlagenwert: [['performance', 3], ['ue20', 7]],
  performance: [['fehlersuche', 5], ['monitoring', 14], ['teilen', 21]],
  fehlersuche: [['monitoring', 14], ['teilen', 21], ['schutz', 30]],
  kaufen: [['planen', 21]],
  schutz: [['wartung', 7]],
  wartung: [['monitoring', 5], ['schutz', 7], ['speicher', 14]],
  monitoring: [['wartung', 7], ['schutz', 21]],
  pruefen: [['installateur', 7], ['komponenten', 14]],
  installateur: [['pruefen', 2], ['komponenten', 7]]
};

module.exports = { INTERESTS, OFFERS, FOLLOWUPS };
