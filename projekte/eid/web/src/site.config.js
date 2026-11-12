// Zentrale Einstellungen. Alles, was sich ändern kann, steht hier – nicht im Code verstreut.
export const site = {
  name: 'Energie-Institut Deutschland',
  // [OFFEN] Eigene EID-Adresse anlegen, bis dahin bekannte Kontaktadresse.
  email: 'info@photovoltaikperformancepro.com',
  // Gemeinsame Lead-API (eid-leads). Antwortet sie nicht, öffnet das Formular eine vorausgefüllte E-Mail.
  leadEndpoint: '/api/leads',
  pvMonteurUrl: 'https://pv-monteur.unternehmensdigitalisierung.io',
  pvMonteurAnfrageUrl: 'https://pv-monteur.unternehmensdigitalisierung.io/anfrage.html',
  solarSecureUrl: 'https://solarsecure.pro',
  stand: '5. November 2026'
};

// Die Bereiche des Instituts – Navigation, Übersicht und Fußzeile lesen von hier. menu: false = nur Fußzeile, nicht im Hauptmenü.
export const PAGES = [
  { id: 'bewerten', href: '/bewerten/', nav: 'Bewerten', title: 'Anlage bewerten', text: 'Was Ihre Solaranlage nach 20 Jahren wert ist' },
  { id: 'anlagenwert', href: '/anlagenwert/', nav: 'Anlagenwert', title: 'Anlagenwert berechnen', text: 'Ertragswert und Substanzwert für Verkauf, Erbe oder Kauf', menu: false },
  { id: 'strom', href: '/strom/', nav: 'Strom', title: 'Strom kaufen und verkaufen', text: 'Stromgemeinschaft, Direktvermarktung, dynamischer Tarif' },
  { id: 'speicher', href: '/speicher/', nav: 'Speicher', title: 'Speicher grün und grau', text: 'Mittagsstrom abends verkaufen, Pool für den Kapazitätsmarkt' },
  { id: 'komponenten', href: '/komponenten/', nav: 'Komponenten', title: 'Komponenten', text: 'Module, Wechselrichter und Speicher über Fachpartner' },
  { id: 'planen', href: '/planen/', nav: 'Planen', title: 'Planen', text: 'Solar-Check in fünf Minuten, genaue Planung mit SolarNavi' },
  { id: 'pruefen', href: '/pruefen/', nav: 'Prüfen', title: 'Prüfen und warten', text: 'Prüfprotokolle nach VDE mit PV-Monteur' },
  { id: 'ueberwachen', href: '/ueberwachen/', nav: 'Überwachen', title: 'Anlagen überwachen', text: 'Teilausfälle früh erkennen, Nachweise für den Direktvermarkter' },
  { id: 'schutz', href: '/schutz/', nav: 'Schutz', title: 'Schützen mit SolarSecure', text: 'Gegen Angriffe, Sabotage und Drohnenaufklärung' }
];

// Bestehende Anwendungen, die die Bereiche einbinden. public: false = noch nicht öffentlich verlinken
// (Gründe in 00_Leitstand/WEBSEITEN-INVENTAR.md). Links bekommen utm_source=eid, damit Zugriffe zählbar sind.
export const TOOLS = [
  {
    id: 'check',
    bereich: 'planen',
    name: 'ECONEnergie-Check',
    url: 'https://unternehmensdigitalisierung.io/enerdie/',
    text: 'Adresse eingeben, Dach im Satellitenbild sehen: Leistung, Eigenverbrauch, Speicher und Ersparnis in fünf Minuten.',
    status: 'live',
    public: true
  },
  {
    id: 'solarnavi',
    bereich: 'planen',
    name: 'SolarNavi',
    url: null,
    text: 'Dachfläche genau einzeichnen, Belegung planen, Ertrag nach PVGIS, Ergebnis als PDF.',
    status: 'in Entwicklung',
    public: true
  },
  {
    id: 'pvmonteur',
    bereich: 'pruefen',
    name: 'PV-Monteur',
    url: 'https://pv-monteur.unternehmensdigitalisierung.io',
    text: 'Prüfprotokolle nach VDE: 53 Messpunkte, Urteil aus dem Regelwerk, Prüfsumme auf jeder Seite.',
    status: 'live',
    public: true
  },
  {
    id: 'baustellenmanager',
    bereich: 'pruefen',
    name: 'Baustellenmanager',
    url: 'https://baustellenmanager.unternehmensdigitalisierung.io',
    text: 'Baustellen planen, Pläne und Stücklisten ablegen, Abnahme dokumentieren.',
    status: 'live',
    public: false
  },
  {
    id: 'solarsecure',
    bereich: 'schutz',
    name: 'SolarSecure',
    url: 'https://solarsecure.pro',
    text: 'Guardian Gateway gegen Angriffe auf die Anlagensteuerung, physischer Anlagenschutz, Drohnen-Früherkennung.',
    status: 'live',
    public: true
  },
  {
    id: 'arealschutz',
    bereich: 'schutz',
    name: 'Aktiver Arealschutz',
    url: 'https://arealschutz.solarsecure.pro',
    text: 'Zaun als Sensor, Luftraumüberwachung und Spezifikation für Betreiber kritischer Infrastruktur.',
    status: 'live',
    public: true
  },
  {
    id: 'kritis',
    bereich: 'schutz',
    name: 'KRITIS-Lagezentrum',
    url: 'https://kritis.photovoltaikperformancepro.com',
    text: 'Live-Demo des Lagezentrums mit Modul Active Land Defense.',
    status: 'Demo',
    public: false
  },
  {
    id: 'nachbarwatt',
    bereich: 'strom',
    name: 'Nachbarwatt',
    url: null,
    text: 'Stromgemeinschaft mit Rechner für Stromverkäufer: Was ist Ihr Solarstrom wert?',
    status: 'startet bald',
    public: true
  }
];

export const toolUrl = (t, page) =>
  t.url ? `${t.url}${t.url.includes('?') ? '&' : '?'}utm_source=eid&utm_medium=website&utm_campaign=${page}` : null;
