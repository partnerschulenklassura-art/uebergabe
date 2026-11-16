// Zentrale Einstellungen. Alles, was sich ändern kann, steht hier – nicht im Code verstreut.
export const site = {
  name: 'PV Performance Pro',
  short: 'PPP',
  tagline: 'Energie-Netzwerk',
  domain: 'https://www.photovoltaikperformancepro.com',
  email: 'info@photovoltaikperformancepro.com',
  // Gemeinsame Lead-API (eid-leads). Antwortet sie nicht, öffnet das Formular eine vorausgefüllte E-Mail.
  // Stufe 1: null = Formular öffnet eine vorausgefüllte E-Mail. Stufe Datenbank: '/api/leads'.
  leadEndpoint: null,
  pvMonteurUrl: 'https://pv-monteur.unternehmensdigitalisierung.io/#registrierung',
  pvMonteurAnfrageUrl: 'https://pv-monteur.unternehmensdigitalisierung.io/anfrage.html',
  solarSecureUrl: 'https://solarsecure.pro',
  stand: '5. November 2026'
};

// Die Bereiche des Netzwerks – Navigation, Übersicht und Fußzeile lesen von hier.
// live: false = Seite ist noch nicht freigeschaltet (nicht im Menü, nicht verlinkt, nicht in der Sitemap).
export const PAGES = [
  { id: 'strom', live: false, href: '/strom/', nav: 'Strom', title: 'Strom kaufen und verkaufen', text: 'Stromgemeinschaft, Direktvermarktung, dynamischer Tarif' },
  { id: 'speicher', live: true, href: '/speicher/', nav: 'Speicher', title: 'Speicher grün und grau', text: 'Mittagsstrom abends verkaufen, Pool für den Kapazitätsmarkt' },
  { id: 'komponenten', live: false, href: '/komponenten/', nav: 'Komponenten', title: 'Komponenten', text: 'Module, Wechselrichter und Speicher über Fachpartner' },
  { id: 'planen', live: false, href: '/planen/', nav: 'Planen', title: 'Planen', text: 'Solar-Check in fünf Minuten, genaue Planung mit SolarNavi' },
  { id: 'pruefen', live: true, href: '/pruefen/', nav: 'Prüfen', title: 'Prüfen und warten', text: 'Prüfprotokolle nach VDE mit PV-Monteur' },
  { id: 'schutz', live: false, href: '/schutz/', nav: 'Schutz', title: 'Schützen mit SolarSecure', text: 'Gegen Angriffe, Sabotage und Drohnenaufklärung' }
];

// Bestehende Anwendungen, die die Bereiche einbinden. public: false = noch nicht öffentlich verlinken
// (Gründe in 00_Leitstand/WEBSEITEN-INVENTAR.md). Links bekommen utm_source=eid, damit Zugriffe zählbar sind.
export const LIVE_PAGES = PAGES.filter(p => p.live);
export const isLive = id => !!PAGES.find(p => p.id === id && p.live);

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
