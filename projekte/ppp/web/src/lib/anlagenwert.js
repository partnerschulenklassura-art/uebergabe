// Wert einer bestehenden Solaranlage aus Komponenten, wie Gutachter ihn ermitteln:
// 1. Ertragswert: abgezinste Reinerträge der Restnutzungsdauer, aufgeteilt in seine Bausteine.
// 2. Substanzwert: heutiger Neupreis je Komponente, gemindert nach Alter und Zustand.
// Reine Rechnung ohne React, testbar mit node src/lib/anlagenwert.test.mjs.
// Quellen der Vorgaben: Modulpreis pvXchange-Index Juli 2026 (Mainstream 0,135 €/Wp), Anschlussvergütung 2025
// 3,79 ct/kWh ohne iMSys (BSW-Solar: 4,508 − 0,715), Betriebskosten Kleinanlagen 26 €/kW (Fraunhofer ISE). Alles Übrige sind Annahmen und auf der Seite änderbar.

import { eegSatz, baupreisKwp } from './historie.js';

export const GROSS_KWP = 100;

export const VORGABEN = {
  stichjahr: 2026, // Bewertungsjahr
  zins: 0.05, // Abzinsung: Rendite, die ein Käufer erwartet
  degradation: 0.005,
  lebensdauer: 30, // Gesamtnutzungsdauer der Anlage in Jahren
  marktwertCt: 3.79, // Vergütung nach Förderende je kWh (2025, ohne iMSys)
  dvEntgeltCt: 0.3, // über 100 kWp
  betriebKwp: 26, // € je kWp und Jahr, bis 100 kWp
  betriebKwpGross: 15, // € je kWp und Jahr, über 100 kWp
  rueckbauKwp: 20, // € je kWp am Ende, abzüglich Erlös für Altteile
  // Neupreise heute je Komponente [klein, groß] und Nutzungsdauer in Jahren
  module: { preis: [140, 130], jahre: 30 }, // € je kWp
  wechselrichter: { preis: [150, 60], jahre: 15, min: 1200 }, // € je kW
  unterkonstruktion: { preis: [120, 90], jahre: 30 }, // € je kWp
  elektro: { preis: [275, 140], jahre: 30 }, // Kabel, Schutztechnik, Zählerschrank, € je kWp
  montage: { preis: [300, 100], jahre: 30 }, // Montage, Planung, Netzanmeldung, € je kWp
  afaJahre: 20, // lineare Abschreibung für den Restbuchwert
  messung: { preis: [300, 15], jahre: 10 }, // klein pauschal €, groß € je kWp
  speicher: { preis: 650, jahre: 15 } // € je kWh
};

export const ZUSTAND = { gut: 1, maengel: 0.85, schaeden: 0.6 };

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const zahl = (v, d) => (v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v));

export function normalisiere(e) {
  const a = { ...VORGABEN, ...(e.annahmen || {}) };
  const kwp = Math.max(0.5, zahl(e.kwp, 10));
  const gross = kwp > GROSS_KWP;
  const baujahr = clamp(Math.round(zahl(e.baujahr, a.stichjahr - 10)), 1990, a.stichjahr);
  const alter = a.stichjahr - baujahr;
  const gewerbe = e.gewerbe ?? kwp > 30;
  return {
    a,
    kwp,
    gross,
    baujahr,
    alter,
    foerderEnde: baujahr + 20,
    ertragJahr: zahl(e.ertragJahr, 0) > 0 ? Number(e.ertragJahr) : kwp * zahl(e.ertragKwp, 900),
    monat: clamp(Math.round(zahl(e.monat, 1)), 1, 12),
    art: e.art === 'frei' ? 'frei' : 'dach',
    voll: Boolean(e.voll),
    eegCt: zahl(e.eegCt, null), // Vergütungssatz laut Abrechnung; leer = aus der Tabelle, sonst nur Marktwert
    baukosten: Math.max(0, zahl(e.baukosten, 0)), // tatsächliche Kosten laut Rechnung, netto
    evAnteil: clamp(zahl(e.evAnteil, 0) / 100, 0, 1),
    strompreisCt: zahl(e.strompreisCt, gewerbe ? 25 : 37.3),
    pachtJahr: Math.max(0, zahl(e.pachtJahr, 0)),
    restjahre: clamp(a.lebensdauer - alter, 1, 40), // ergibt sich aus der Inbetriebnahme
    wrJahr: clamp(Math.round(zahl(e.wrJahr, baujahr)), baujahr, a.stichjahr),
    zustand: ZUSTAND[e.zustand] ?? 1,
    speicherKwh: Math.max(0, zahl(e.speicherKwh, 0)),
    speicherJahr: Math.round(zahl(e.speicherJahr, baujahr)),
    netzanschlussEuro: Math.max(0, zahl(e.netzanschlussEuro, 0)),
    netzanschlussJahr: Math.round(zahl(e.netzanschlussJahr, baujahr))
  };
}

const wrPreis = n => Math.max(n.a.wechselrichter.min, n.kwp * n.a.wechselrichter.preis[n.gross ? 1 : 0]);

/** Ertragswert: Barwert je Baustein über die Restnutzungsdauer. */
export function ertragswert(n) {
  const a = n.a;
  const teile = { eeg: 0, markt: 0, eigen: 0, betrieb: 0, ersatz: 0, rueckbau: 0 };
  const betrieb = n.kwp * (n.gross ? a.betriebKwpGross : a.betriebKwp) + n.pachtJahr;
  const dvAbzug = n.gross ? a.dvEntgeltCt : 0;
  let wrAlter = a.stichjahr - n.wrJahr;
  const jahre = [];
  for (let j = 0; j < n.restjahre; j++) {
    const jahr = a.stichjahr + 1 + j; // erstes volles Jahr nach dem Stichtag
    const df = 1 / (1 + a.zins) ** (j + 1);
    const erz = n.ertragJahr * (1 - a.degradation) ** (j + 1);
    const eigen = erz * n.evAnteil;
    const ein = erz - eigen;
    const mitEeg = n.eegCt != null && jahr <= n.foerderEnde;
    const ct = (mitEeg ? n.eegCt : a.marktwertCt) - dvAbzug;
    const zeile = { jahr, eeg: 0, markt: 0, eigen: eigen * (n.strompreisCt / 100), betrieb: -betrieb, ersatz: 0 };
    if (mitEeg) zeile.eeg = (ein * ct) / 100;
    else zeile.markt = (ein * ct) / 100;
    wrAlter += 1;
    // Wechselrichter fällt nach seiner Nutzungsdauer an, aber nicht mehr in den letzten drei Jahren
    if (wrAlter > a.wechselrichter.jahre && n.restjahre - j > 3) {
      zeile.ersatz = -wrPreis(n);
      wrAlter = 0;
    }
    for (const k of ['eeg', 'markt', 'eigen', 'betrieb', 'ersatz']) teile[k] += zeile[k] * df;
    jahre.push(zeile);
  }
  teile.rueckbau = (-n.kwp * a.rueckbauKwp) / (1 + a.zins) ** n.restjahre;
  const summe = Object.values(teile).reduce((s, x) => s + x, 0);
  return { summe, teile, jahre };
}

/** Substanzwert: Zeitwert je Komponente. */
export function substanzwert(n) {
  const a = n.a;
  const g = n.gross ? 1 : 0;
  const rest = (jahre, seit) => Math.max(0, 1 - (a.stichjahr - seit) / jahre) * n.zustand;
  const posten = [
    ['module', 'Module', n.kwp * a.module.preis[g], a.module.jahre, n.baujahr],
    ['wechselrichter', 'Wechselrichter', wrPreis(n), a.wechselrichter.jahre, n.wrJahr],
    ['unterkonstruktion', 'Unterkonstruktion', n.kwp * a.unterkonstruktion.preis[g], a.unterkonstruktion.jahre, n.baujahr],
    ['elektro', 'Kabel und Schutztechnik', n.kwp * a.elektro.preis[g], a.elektro.jahre, n.baujahr],
    ['montage', 'Montage, Planung, Anmeldung', n.kwp * a.montage.preis[g], a.montage.jahre, n.baujahr],
    ['messung', 'Messung und Datenlogger', n.gross ? n.kwp * a.messung.preis[1] : a.messung.preis[0], a.messung.jahre, n.baujahr]
  ];
  if (n.speicherKwh > 0) posten.push(['speicher', 'Speicher', n.speicherKwh * a.speicher.preis, a.speicher.jahre, n.speicherJahr]);
  if (n.netzanschlussEuro > 0) posten.push(['netz', 'Netzanschluss und Trafostation', n.netzanschlussEuro, 35, n.netzanschlussJahr]);
  // Baupreis damals: Preis je kWp im Inbetriebnahmejahr (bei großen Anlagen im Verhältnis der heutigen Preise
  // groß zu klein gemindert) oder die tatsächlichen Kosten, aufgeteilt nach den heutigen Anteilen der Anlagenteile.
  const anlage = posten.filter(p => p[4] === n.baujahr && p[0] !== 'speicher' && p[0] !== 'netz');
  const heuteSumme = anlage.reduce((s, p) => s + p[2], 0);
  const bp = baupreisKwp(n.baujahr);
  const heuteKlein = n.kwp * (a.module.preis[0] + a.wechselrichter.preis[0] + a.unterkonstruktion.preis[0] + a.elektro.preis[0] + a.montage.preis[0]) + a.messung.preis[0];
  const groesse = n.gross ? heuteSumme / heuteKlein : 1;
  const damalsSumme = n.baukosten > 0 ? n.baukosten : n.kwp * bp.preis * groesse;
  const teile = posten.map(([id, titel, neu, jahre, seit]) => {
    const damals = anlage.some(p => p[0] === id) ? (damalsSumme * neu) / heuteSumme : null;
    const basis = damals == null ? neu : Math.min(neu, damals);
    return { id, titel, neu, damals, basis, jahre, alter: a.stichjahr - seit, zeitwert: basis * rest(jahre, seit) };
  });
  return {
    summe: teile.reduce((s, t) => s + t.zeitwert, 0),
    neu: teile.reduce((s, t) => s + t.neu, 0),
    damals: damalsSumme,
    buchwert: damalsSumme * Math.max(0, 1 - (a.stichjahr - n.baujahr) / a.afaJahre),
    baupreis: { ...bp, jeKwp: damalsSumme / n.kwp, ausRechnung: n.baukosten > 0 },
    teile
  };
}

export function anlagenwert(eingabe) {
  const n = normalisiere(eingabe);
  // Vergütung aus der Tabelle, wenn keine eigene Angabe
  n.eegTabelle = eegSatz(n.baujahr, n.monat, n.kwp, n.art, n.voll);
  n.eegAusTabelle = n.eegCt == null && n.eegTabelle.ct != null;
  if (n.eegAusTabelle) n.eegCt = n.eegTabelle.ct;
  const ew = ertragswert(n);
  const sw = substanzwert(n);
  return {
    eingabe: n,
    ertrag: ew,
    substanz: sw,
    marktwert: Math.max(0, ew.summe), // was ein Käufer für die Erträge zahlt
    steuerwert: Math.max(ew.summe, sw.summe, 0) // Erbe, Schenkung: der höhere Wert
  };
}
