// Historische Werte, nach Inbetriebnahme. Nur belegte Zahlen; Lücken bleiben null ("laut Abrechnung").
// Jede Zeile nennt ihre Quelle (Schlüssel in QUELLEN).

export const QUELLEN = {
  wiki: { titel: 'Wikipedia: Feed-in tariffs in Germany (Tabelle je Klasse und Freifläche)', url: 'https://en.wikipedia.org/wiki/Feed-in_tariffs_in_Germany' },
  sbz: { titel: 'SBZ 7/2006: Einspeisevergütung 2006 und 2007', url: 'https://www.sbz-online.de/sites/default/files/ulmer/de-sbz/document/file_155904.pdf' },
  vz: { titel: 'immowelt: Einspeisevergütung 2027 (Wert 2000)', url: 'https://www.immowelt.de/ratgeber/news/einspeiseverguetung-2027-pv-anlagen' },
  saar: { titel: 'Stadtwerke Saarbrücken: EEG-Bericht 2013 (Sätze 2010–2012 je Klasse)', url: 'https://www.saarbahn.de/media/download-545a297775c55' },
  lfl: { titel: 'LfL Bayern: Fördersätze 2023', url: 'https://lfl.bayern.de/mam/cms07/iba/dateien/information_pv_001_fördersätze_photovoltaik_20230101.pdf' },
  yello: { titel: 'Yello: Einspeisevergütung (Sätze ab August 2026)', url: 'https://www.yello.de/wissen/solar/einspeiseverguetung/' },
  iw2025: { titel: 'immowelt: Einspeisevergütung 2025 (sonstige Anlagen)', url: 'https://www.immowelt.de/ratgeber/news/abschied-von-der-einspeiseverguetung-was-solaranlagen-besitzer-2025-erwartet' },
  pvde: { titel: 'pv.de: EEG-Vergütungssätze 2012', url: 'https://www.pv.de/media/eeg_verguetungssaetze_2012.11.pdf' },
  ffe: { titel: 'FfE: Vergütung Januar 2013', url: 'https://idw-online.de/en/attachmentdata30062.pdf' },
  ibc2016: { titel: 'IBC Solar: Vergütungssätze 2016', url: 'https://www.elektrokaiser.de/wp-content/uploads/IBC-SOLAR-Aktuelle-EEG-Verguetungssaetze_April.pdf' },
  ibc2017: { titel: 'Vergütungssätze 2017', url: 'https://www.elektrokaiser.de/wp-content/uploads/Vergütungssätze_2017_ab_01.06.2017.pdf' },
  has: { titel: 'homeandsmart: Einspeisevergütung je Januar 2018–2021', url: 'https://www.homeandsmart.de/photovoltaik-einspeisen-vs-eigenverbrauch-einspeiseverguetung' },
  bsw: { titel: 'BSW-Solar: EEG-Vergütungsübersicht ab Nov. 2019', url: 'https://www.solarwirtschaft.de/datawall/uploads/2021/02/EEG-Verguetungsuebersicht-Basis.pdf' },
  echt: { titel: 'echtsolar: Einspeisevergütung 2022 bis 2024', url: 'https://echtsolar.de/?p=5308' },
  red: { titel: 'solar.red: Einspeisevergütung 2022 bis 2026', url: 'https://solar.red/einspeiseverguetung/' },
  bnetza: { titel: 'Bundesnetzagentur: Archiv der Vergütungssätze', url: 'https://bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Foerderung/Archiv_VergSaetze/start.html' },
  gh: { titel: 'gruenes.haus: Photovoltaik-Preisentwicklung', url: 'https://gruenes.haus/photovoltaik-preisentwicklung/' },
  ah: { titel: 'aroundhome: Preisentwicklung Solaranlagen (nach gruenes.haus, Stand 01/2026)', url: 'https://www.aroundhome.de/solaranlage/preisentwicklung/' },
  hs: { titel: 'homeandsmart: Photovoltaik-Preisentwicklung seit 2006', url: 'https://www.homeandsmart.de/preisentwicklung-photovoltaik' }
};

// EEG-Vergütung nach Inbetriebnahme, Art und Größenklasse. Je Zeile die Klassen als [bis kWp, ct/kWh] für die feste
// Einspeisevergütung (ab August 2022 Teileinspeisung; voll = Volleinspeisung). Die Vergütung einer Anlage ergibt sich
// leistungsanteilig aus den Klassen (z. B. 120 kWp 2006: 30/120 × 51,80 + 70/120 × 49,28 + 20/120 × 48,74 = 49,82 ct).
// null = kein belegter Wert: Satz laut Abrechnung. Wo eine Klasse fehlt, gibt es für diese Größe keine feste Vergütung
// (Direktvermarktung oder Ausschreibung, ab 2016 über 100 kWp).
const I = Infinity;
export const EEG = [
  { ab: '2000-04', dach: [[I, 50.6]], frei: [[I, 50.6]], quelle: 'vz', text: 'Start des EEG, ein Satz für alle' },
  { ab: '2001-01', dach: null, frei: null, quelle: 'bnetza', text: 'jährlich gesunken' },
  { ab: '2004-01', dach: [[30, 57.4], [100, 54.6], [I, 54.0]], frei: [[I, 45.7]], quelle: 'wiki', text: 'PV-Vorschaltgesetz' },
  { ab: '2005-01', dach: [[30, 54.53], [100, 51.87], [I, 51.3]], frei: [[I, 43.4]], quelle: 'wiki' },
  { ab: '2006-01', dach: [[30, 51.8], [100, 49.28], [I, 48.74]], frei: [[I, 40.6]], quelle: 'sbz' },
  { ab: '2007-01', dach: [[30, 49.21], [100, 46.82], [I, 46.3]], frei: [[I, 37.96]], quelle: 'sbz' },
  { ab: '2008-01', dach: [[30, 46.75], [100, 44.48], [I, 43.99]], frei: [[I, 35.49]], quelle: 'wiki' },
  { ab: '2009-01', dach: [[30, 43.01], [100, 40.91], [1000, 39.58], [I, 33.0]], frei: [[I, 31.94]], quelle: 'wiki', text: 'EEG 2009' },
  { ab: '2010-01', quelleKlassen: 'saar', dach: [[30, 39.14], [100, 37.23], [1000, 35.23], [I, 29.37]], frei: [[I, 28.43]], quelle: 'wiki' },
  { ab: '2010-07', dach: [[30, 34.05], [100, 32.39], [1000, 30.65], [I, 25.55]], frei: [[I, 25.02]], quelle: 'wiki', text: 'Sonderabsenkung' },
  { ab: '2010-10', dach: [[30, 33.03], [100, 31.42], [1000, 29.73], [I, 24.79]], frei: [[I, 24.26]], quelle: 'wiki' },
  { ab: '2011-01', dach: [[30, 28.74], [100, 27.33], [1000, 25.86], [I, 21.56]], frei: [[I, 21.11]], quelle: 'wiki' },
  { ab: '2012-01', dach: [[30, 24.43], [100, 23.23], [1000, 21.98], [I, 18.33]], frei: [[I, 17.94]], quelle: 'wiki' },
  { ab: '2012-04', dach: null, frei: null, quelle: 'bnetza', text: 'PV-Novelle, ab jetzt monatliche Absenkung' },
  { ab: '2012-10', dach: [[10, 18.36], [40, 17.42], [1000, 15.53], [10000, 12.71]], frei: [[10000, 12.71]], quelle: 'pvde' },
  { ab: '2013-01', dach: [[10, 17.02], [40, null], [1000, null], [10000, null]], frei: [[10000, null]], quelle: 'ffe' },
  { ab: '2013-02', dach: null, frei: null, quelle: 'bnetza', text: 'monatliche Absenkung' },
  { ab: '2014-07', dach: [[10, 12.88], [40, 12.22], [1000, 10.9], [10000, 8.92]], frei: [[10000, 8.92]], quelle: 'wiki' },
  { ab: '2014-08', dach: null, frei: null, quelle: 'bnetza', text: 'EEG 2014' },
  { ab: '2016-01', dach: [[10, 12.31], [40, 11.97], [100, 10.71]], frei: [[100, 8.53]], quelle: 'ibc2016', text: 'über 100 kWp nur noch Direktvermarktung' },
  { ab: '2017-01', dach: [[10, 12.3], [40, 11.96], [100, 10.69]], frei: [[100, 8.51]], quelle: 'ibc2017' },
  { ab: '2017-07', dach: [[10, 12.2], [40, 11.87], [100, 10.61]], frei: [[100, 8.44]], quelle: 'ibc2017' },
  { ab: '2019-01', dach: [[10, 11.47], [40, 11.15], [100, 9.96]], frei: [[100, null]], quelle: 'has' },
  { ab: '2019-11', dach: [[10, 10.08], [40, 9.79], [100, 7.7]], frei: [[100, 6.95]], quelle: 'bsw', text: 'monatliche Absenkung' },
  { ab: '2020-01', dach: [[10, 9.87], [40, 9.59], [100, 7.54]], frei: [[100, 6.8]], quelle: 'bsw' },
  { ab: '2021-01', dach: [[10, 8.16], [40, 7.93], [100, 6.22]], frei: [[100, 5.61]], quelle: 'bsw' },
  { ab: '2022-01', dach: [[10, 6.83], [40, 6.63], [100, 5.19]], frei: [[100, 4.67]], quelle: 'bsw' },
  { ab: '2022-07', dach: [[10, 6.24], [40, 6.06], [100, 4.74]], frei: [[100, 4.26]], quelle: 'bsw', text: 'Tiefstwert' },
  { ab: '2022-08', dach: [[10, 8.2], [40, 7.1], [100, 5.8]], voll: [[10, 13.0], [100, 10.9]], frei: [[100, null]], quelle: 'echt', text: 'EEG 2023, ab 30.07.2022, Teil- und Volleinspeisung' },
  { ab: '2023-01', dach: [[10, 8.2], [40, 7.1], [100, 5.8]], voll: [[10, 13.0], [100, 10.9]], frei: [[100, 6.6]], quelle: 'lfl' },
  { ab: '2024-02', dach: [[10, 8.11], [40, 7.03], [100, 5.74]], voll: [[10, 12.87], [100, null]], frei: [[100, null]], quelle: 'red', text: 'halbjährlich −1 %' },
  { ab: '2024-08', dach: [[10, 8.03], [40, 6.95], [100, 5.68]], voll: [[10, 12.74], [100, null]], frei: [[100, null]], quelle: 'red' },
  { ab: '2025-02', quelleFrei: 'iw2025', dach: [[10, 7.94], [40, 6.88], [100, 5.62]], voll: [[10, 12.6], [100, 10.56]], frei: [[100, 6.39]], quelle: 'red' },
  { ab: '2025-08', quelleFrei: 'iw2025', dach: [[10, 7.86], [40, 6.8], [100, 5.56]], voll: [[10, 12.47], [100, 10.45]], frei: [[100, 6.33]], quelle: 'red' },
  { ab: '2026-02', quelleFrei: 'iw2025', dach: [[10, 7.78], [40, 6.73], [100, 5.5]], voll: [[10, 12.34], [100, 10.35]], frei: [[100, 6.27]], quelle: 'red' },
  { ab: '2026-08', dach: [[10, 7.7], [40, 6.66], [100, 5.44]], voll: [[10, 12.22], [100, 10.24]], frei: [[100, null]], quelle: 'yello' }
];

/** Leistungsanteiliger Satz aus Klassen [[bis, ct], ...]. Ergebnis { ct } oder { ct: null, grund }. */
export function mischSatz(klassen, kwp) {
  let rest = kwp, unten = 0, summe = 0;
  for (const [bis, ct] of klassen) {
    if (rest <= 0) break;
    const teil = Math.min(rest, bis - unten);
    if (ct == null) return { ct: null, grund: 'luecke' };
    summe += teil * ct;
    rest -= teil;
    unten = bis;
  }
  if (rest > 1e-9) return { ct: null, grund: 'groesse' };
  return { ct: Math.round((summe / kwp) * 100) / 100 };
}

/** Zeile der Tabelle zum Inbetriebnahmemonat. */
export function eegZeile(jahr, monat = 1) {
  const key = `${jahr}-${String(monat).padStart(2, '0')}`;
  let zeile = null;
  for (const z of EEG) if (z.ab <= key) zeile = z;
  return zeile;
}

/**
 * Satz für eine Anlage. art: 'dach' | 'frei'; voll: Volleinspeisung (nur ab August 2022 eigener Satz).
 * Ergebnis: { ct, zeile } oder { ct: null, zeile, grund: 'vor2000' | 'luecke' | 'groesse' }
 */
export function eegSatz(jahr, monat = 1, kwp = 1, art = 'dach', voll = false) {
  const zeile = eegZeile(jahr, monat);
  if (!zeile) return { ct: null, zeile: null, grund: 'vor2000' };
  const klassen = art === 'frei' ? zeile.frei : voll && zeile.voll ? zeile.voll : zeile.dach;
  if (!klassen) return { ct: null, zeile, grund: 'luecke' };
  return { ...mischSatz(klassen, kwp), zeile };
}

// Durchschnittlicher Anlagenpreis je kWp, kleine Dachanlagen (um 10 kWp). Vor 2006 keine belegten Werte.
export const BAUPREIS = [
  [2006, 6000, 'hs'], [2007, 5400, 'gh'], [2008, 5200, 'gh'], [2009, 4300, 'gh'], [2010, 3500, 'gh'],
  [2011, 2900, 'gh'], [2012, 2300, 'gh'], [2013, 2100, 'gh'], [2014, 2000, 'gh'], [2015, 1900, 'ah'],
  [2016, 1700, 'ah'], [2017, 1600, 'ah'], [2018, 1500, 'ah'], [2019, 1450, 'ah'], [2020, 1350, 'ah'],
  [2021, 1400, 'ah'], [2022, 1350, 'ah'], [2023, 1450, 'ah'], [2024, 1200, 'ah'], [2025, 1060, 'ah'], [2026, 1015, 'ah']
];

/** Baupreis je kWp im Jahr (klein). Vor 2006: Wert 2006 als Untergrenze, danach letzter bekannter Wert. */
export function baupreisKwp(jahr) {
  const erst = BAUPREIS.at(0), letzt = BAUPREIS.at(-1);
  if (jahr <= erst[0]) return { preis: erst[1], quelle: erst[2], geschaetzt: jahr < erst[0] };
  if (jahr >= letzt[0]) return { preis: letzt[1], quelle: letzt[2], geschaetzt: jahr > letzt[0] };
  const z = BAUPREIS.find(r => r[0] === jahr);
  return { preis: z[1], quelle: z[2], geschaetzt: false };
}
