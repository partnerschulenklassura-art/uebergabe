// Leistungscheck: Was muss die Anlage leisten, was leistet sie, warum fehlt etwas, was ist sie wert,
// und muss jemand vor Ort messen? Reine Rechnung ohne React, testbar mit node src/lib/leistungscheck.test.mjs.
//
// Drei Vergleiche:
//   1. Hardware: Datenblätter von Modulen, Wechselrichtern, AC-Kabeln (Leitungsverlust, Spannungsfall).
//   2. Inbetriebnahme: Planung und Aufbau (Ausrichtung, Neigung, Reihenabstand, Stringauslegung, DC/AC).
//   3. Ist heute: Zähler und Wechselrichter, bereinigt um das Wetter im Vergleichszeitraum.
// Die Differenz zwischen Soll und Ist wird zerlegt in Alterung, Planung, AC-Seite und einen unerklärten Rest.
//
// Regel: Die Rechnung erfindet keine Messwerte. Messwerte kommen aus PV-Monteur. Was hier steht, sind
// Rechenwerte aus Angaben und Datenblättern, und jede Annahme steht in ANNAHMEN.

import { anlagenwert } from './anlagenwert.js';
import { ursachen as ursachenBasis, URSACHEN as URSACHEN_BASIS } from './mehrwert.js';

export const ANNAHMEN = {
  breite: 50.7, // Westsachsen, falls kein Standort angegeben
  referenzKwhKwp: 950, // langjähriger Ertrag je kWp bei Süd, 35°, nach üblichen Systemverlusten außer Wechselrichter und Kabel (FfE, regional ±10 %); besser: PVGIS
  rho: { cu: 0.0178, al: 0.0286 }, // Ω·mm²/m bei 20 °C
  alpha: { cu: 0.00393, al: 0.00403 }, // Temperaturbeiwert je K
  leiterTemp: 50, // °C mittlere Leitertemperatur unter Last
  lastFaktorVerlust: 0.4, // Anteil des Volllast-Leitungsverlusts an der Jahresenergie (Verlust wächst mit P², PV läuft selten auf Volllast)
  acVerlustGrenze: 0.01, // Planungswert: höchstens 1 % AC-Verlust
  spannungsanstiegGrenze: 0.03, // VDE-AR-N 4105: höchstens 3 % am Verknüpfungspunkt
  acToleranz: 0.015, // Messtoleranz Wechselrichter gegen Zähler
  dcAcGrenze: 1.3,
  tMin: -10, // °C für die Leerlaufspannung
  tMax: 70, // °C Zelltemperatur für die MPP-Spannung
  wrWirkungsgrad: 0.97,
  sonstigeVerluste: 0.07, // nur bei PVGIS-Referenz (loss=0): Fehlanpassung 2 %, Leistungstoleranz und LID 2 %, Verfügbarkeit 1 %, normale Verschmutzung 2 %
  degradation: { mono: 0.005, poly: 0.005, duennschicht: 0.008 },
  garantieJahr1: { mono: 0.98, poly: 0.975, duennschicht: 0.95 },
  stufen: { gut: -0.05, auffaellig: -0.15 }, // Abweichung vom Soll heute
  restVorOrt: 0.05, // unerklärter Rest, ab dem eine Messung vor Ort nötig ist
  dcVerlustGrenze: 0.01, // Planungswert DC-Leitungen
  solarkabel: ['solarkabel', 'h1z2z2-k', 'pv1-f'], // für DC im Freien zugelassen (DIN EN 50618)
  // Neupreise je kWp für Freiflächen [klein, groß], wo sie vom Dach abweichen (Annahme, Marktspiegel 2026)
  freiflaeche: { unterkonstruktion: { preis: [110, 75], jahre: 30 }, montage: { preis: [150, 70], jahre: 30 }, elektro: { preis: [220, 130], jahre: 30 } }
};

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const rad = d => (d * Math.PI) / 180;
const num = (v, d = null) => (v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v));
const sum = (xs, f = x => x) => xs.reduce((s, x) => s + (f(x) || 0), 0);

// ---------------------------------------------------------------------------
// 1. Hardware

/** Ertragsfaktor einer Fläche gegenüber Süd/35° (Näherung für Mitteleuropa, wenn kein PVGIS-Wert vorliegt).
 *  azimut: 0 = Süd, −90 = Ost, 90 = West, 180 = Nord. Gegen PVGIS geprüft: flach 0,86, Süd 90° 0,66, Ost 30° 0,84, Nord 30° 0,61. */
export function ausrichtungsFaktor(azimut = 0, neigung = 35) {
  const t = clamp(neigung, 0, 90);
  const az = Math.abs(((azimut + 540) % 360) - 180); // 0 … 180
  const neigungsVerlust = 0.00012 * (t - 35) ** 2;
  const richtungsVerlust = 0.32 * Math.sin(rad(t)) * (1 - Math.cos(rad(az))) ** 1.3;
  return clamp(1 - neigungsVerlust - richtungsVerlust, 0.3, 1);
}

/** Leitungsverlust und Spannungsfall einer Drehstromleitung bei Volllast. */
export function acLeitung(abschnitt, kwAC, uNetz = 400, cosPhi = 1) {
  const mat = abschnitt.material === 'al' ? 'al' : 'cu';
  const a = ANNAHMEN;
  const rho = a.rho[mat] * (1 + a.alpha[mat] * (a.leiterTemp - 20));
  const querschnitt = num(abschnitt.querschnitt);
  const laenge = num(abschnitt.laenge);
  const parallel = Math.max(1, num(abschnitt.parallel, 1));
  if (!querschnitt || !laenge || !kwAC) return null;
  const strom = (kwAC * 1000) / (Math.sqrt(3) * uNetz * cosPhi); // A
  const r = (rho * laenge) / (querschnitt * parallel); // Ω je Leiter
  const verlustKw = (3 * strom ** 2 * r) / 1000;
  const spannungsfall = (Math.sqrt(3) * strom * r * cosPhi) / uNetz;
  return {
    name: abschnitt.name || 'AC-Leitung',
    material: mat,
    querschnitt,
    laenge,
    parallel,
    strom,
    widerstand: r,
    verlustKw,
    verlustAnteil: verlustKw / kwAC,
    energieAnteil: (verlustKw / kwAC) * a.lastFaktorVerlust,
    spannungsfall
  };
}

/** Verlust einer DC-Stringleitung (Hin- und Rückleiter) bei MPP-Strom und -Spannung. */
export function dcLeitung(abschnitt, strom, spannung) {
  const mat = abschnitt.material === 'al' ? 'al' : 'cu';
  const a = ANNAHMEN;
  const rho = a.rho[mat] * (1 + a.alpha[mat] * (a.leiterTemp - 20));
  const querschnitt = num(abschnitt.querschnitt);
  const laenge = num(abschnitt.laenge); // einfache Länge in m
  if (!querschnitt || !laenge || !strom || !spannung) return null;
  const r = (2 * rho * laenge) / querschnitt;
  const verlustAnteil = (strom * r) / spannung; // = I²R / (U·I)
  return { name: abschnitt.name || 'DC-Leitung', material: mat, querschnitt, laenge, strom, verlustAnteil, energieAnteil: verlustAnteil * a.lastFaktorVerlust };
}

/** Kabel und Steckverbinder als Qualitätsmerkmal. */
export function kabelQualitaet(n) {
  const befunde = [];
  for (const k of n.dc) {
    const typ = String(k.kabeltyp || '').toLowerCase();
    if (!typ) continue;
    if (!ANNAHMEN.solarkabel.includes(typ))
      befunde.push({ id: 'dcKabeltyp', schwere: 'befund', text: `${k.name || 'DC-Leitung'}: Kabeltyp „${k.kabeltyp}“ ist kein Solarkabel nach DIN EN 50618. Im Freien altert die Isolierung schneller, Isolationsfehler werden wahrscheinlicher.` });
    if (num(k.querschnitt) && k.querschnitt < 4)
      befunde.push({ id: 'dcQuerschnitt', schwere: 'hinweis', text: `${k.name || 'DC-Leitung'}: ${k.querschnitt} mm² ist für Stringleitungen knapp, üblich sind 4 oder 6 mm².` });
  }
  if (n.steckverbinder?.mischung)
    befunde.push({ id: 'steckverbinder', schwere: 'befund', text: 'Steckverbinder verschiedener Hersteller sind ineinander gesteckt. Das ist nicht zulässig und eine häufige Ursache für heiße Kontakte, Lichtbögen und Ertragsverlust.' });
  for (const k of n.ac)
    if (k.material === 'al' && !k.alKlemmen)
      befunde.push({ id: 'alKlemmen', schwere: 'hinweis', text: `${k.name || 'AC-Leitung'}: Aluminium braucht dafür zugelassene Klemmen und Kontaktfett. Prüfen, ob das so ausgeführt ist.` });
  return befunde;
}

// ---------------------------------------------------------------------------
// 2. Inbetriebnahme: Planung und Aufbau

/** Sonnenhöhe am 21. Dezember mittags. */
export const winterSonne = breite => 90 - breite - 23.44;

/** Eigenverschattung aufgeständerter Reihen: nötiger Reihenabstand (Achsabstand) und Verlustschätzung. */
export function reihen(feld, breite) {
  const tiefe = num(feld.modulTiefe); // geneigte Länge der Modulreihe in m
  const abstand = num(feld.reihenabstand); // Achsabstand von Reihe zu Reihe in m
  if (!feld.aufgestaendert || !tiefe || !abstand) return null;
  const beta = rad(num(feld.neigung, 20));
  const sonne = rad(Math.max(5, winterSonne(breite)));
  const noetig = tiefe * Math.cos(beta) + (tiefe * Math.sin(beta)) / Math.tan(sonne);
  const verhaeltnis = abstand / noetig;
  // grob: bei 100 % des nötigen Abstands etwa 2 % Jahresverlust, darunter steigt er schnell
  const verlust = verhaeltnis >= 1 ? 0.02 : clamp(0.02 + (1 - verhaeltnis) * 0.25, 0, 0.3);
  return { noetig, abstand, verhaeltnis, verlust, sonnenhoehe: winterSonne(breite) };
}

/** Stringauslegung gegen die Grenzen des Wechselrichters. */
export function stringauslegung(modul, wr, moduleJeString) {
  const n = num(moduleJeString);
  const uoc = num(modul?.uoc);
  const vmpp = num(modul?.vmpp);
  if (!n || !uoc || !wr) return null;
  const tk = num(modul.tkUoc, -0.29) / 100; // %/K, negativ
  const a = ANNAHMEN;
  const uocKalt = n * uoc * (1 + tk * (a.tMin - 25));
  const umppHeiss = vmpp ? n * vmpp * (1 + tk * (a.tMax - 25)) : null;
  const umppKalt = vmpp ? n * vmpp * (1 + tk * (a.tMin - 25)) : null;
  const befunde = [];
  if (num(wr.umaxDC) && uocKalt > wr.umaxDC)
    befunde.push({ id: 'uoc', schwere: 'gefahr', text: `Leerlaufspannung bei ${a.tMin} °C (${Math.round(uocKalt)} V) über der zulässigen DC-Spannung des Wechselrichters (${wr.umaxDC} V).` });
  if (umppHeiss && num(wr.mppMin) && umppHeiss < wr.mppMin)
    befunde.push({ id: 'mppMin', schwere: 'befund', text: `MPP-Spannung bei ${a.tMax} °C (${Math.round(umppHeiss)} V) unter dem MPP-Bereich (${wr.mppMin} V): Ertragsverlust an heißen Tagen.` });
  if (umppKalt && num(wr.mppMax) && umppKalt > wr.mppMax)
    befunde.push({ id: 'mppMax', schwere: 'befund', text: `MPP-Spannung bei ${a.tMin} °C (${Math.round(umppKalt)} V) über dem MPP-Bereich (${wr.mppMax} V).` });
  return { uocKalt, umppHeiss, umppKalt, befunde, verlust: befunde.some(b => b.id === 'mppMin') ? 0.03 : 0 };
}

/** Kappung bei großem DC/AC-Verhältnis (Näherung). */
export const kappung = verhaeltnis => (verhaeltnis <= 1.15 ? 0 : clamp((verhaeltnis - 1.15) * 0.08, 0, 0.1));

/** Wetterfaktor. Mit DWD-Monatsfaktoren und PVGIS-Monatserträgen gewichtet nach dem Ertrag der Anlage je Monat
 *  (DWD misst horizontal, die Module sind geneigt; so zählt ein sonniger Juni mehr als ein sonniger Dezember). */
export function wetterFaktor(w) {
  if (!w) return 1;
  const monate = w.monate || [];
  const pvgis = w.referenzMonate || []; // 12 Werte Januar … Dezember, kWh/kWp
  if (monate.length && pvgis.length === 12) {
    let ist = 0;
    let soll = 0;
    for (const m of monate) {
      const idx = Number(String(m.monat).slice(5, 7)) - 1;
      const e = pvgis[idx];
      if (!(e > 0) || !(m.faktor > 0)) continue;
      ist += e * m.faktor;
      soll += e;
    }
    if (soll > 0) return ist / soll;
  }
  return num(w.zeitraumFaktor, 1);
}

export function normalisiere(e) {
  const breite = num(e.standort?.breite, ANNAHMEN.breite);
  const felder = (e.felder?.length ? e.felder : [{ kwp: e.kwp, azimut: 0, neigung: 35 }]).map(f => ({
    ...f,
    kwp: num(f.kwp, 0),
    azimut: num(f.azimut, 0),
    neigung: num(f.neigung, 35)
  }));
  const modultypen = (Array.isArray(e.module) ? e.module : e.module ? [e.module] : []).map(m => ({
    ...m,
    typ: ANNAHMEN.degradation[m.typ] ? m.typ : 'mono',
    anzahl: num(m.anzahl, 0),
    wp: num(m.wp, 0)
  }));
  const kwpModule = sum(modultypen, m => (m.anzahl * m.wp) / 1000);
  const kwpGesamt = num(e.kwp, null) ?? (kwpModule || sum(felder, f => f.kwp));
  const wr = (e.wechselrichter || []).map(w => ({ ...w, anzahl: num(w.anzahl, 1), kwAC: num(w.kwAC, 0), strings: w.strings || (w.moduleJeString ? [{ modul: 0, moduleJeString: w.moduleJeString }] : []) }));
  const kwAC = sum(wr, w => w.kwAC * w.anzahl) || kwpGesamt / 1.1;
  const typ = modultypen[0]?.typ || 'mono';
  const jahr = num(e.inbetriebnahme?.jahr, 2010);
  const stichjahr = num(e.stichjahr, 2026);
  return {
    ...e,
    breite,
    felder: felder.map(f => ({ ...f, kwp: f.kwp || kwpGesamt / felder.length })),
    kwp: kwpGesamt,
    kwpModule,
    modultypen,
    art: e.art === 'frei' ? 'frei' : 'dach',
    dc: e.dc || [],
    wr,
    kwAC,
    typ,
    jahr,
    monat: num(e.inbetriebnahme?.monat, 6),
    alter: Math.max(0, stichjahr - jahr),
    stichjahr,
    ac: e.ac || [],
    referenz: num(e.wetter?.referenzKwhKwp), // PVGIS PVcalc mit loss=0 für diese Anlage (Werdau, Süd 30°: 1.189 kWh/kWp)
    wetterFaktor: wetterFaktor(e.wetter), // Einstrahlung im Zeitraum / langjähriges Mittel
    umgebung: e.umgebung || []
  };
}

/** Soll im ersten Jahr: ideal (gut geplant) und wie gebaut. */
export function planung(n) {
  const a = ANNAHMEN;
  const befunde = [];
  const flaechen = n.felder.map(f => {
    const ausrichtung = n.referenz ? 1 : ausrichtungsFaktor(f.azimut, f.neigung);
    const r = reihen(f, n.breite);
    if (r && r.verhaeltnis < 1)
      befunde.push({ id: 'reihen', schwere: 'befund', text: `Reihenabstand ${r.abstand.toFixed(1)} m, nötig wären ${r.noetig.toFixed(1)} m (Sonne am 21. Dezember mittags ${r.sonnenhoehe.toFixed(0)}°): Reihen verschatten sich im Winterhalbjahr.` });
    if (!n.referenz && ausrichtung < 0.8)
      befunde.push({ id: 'ausrichtung', schwere: 'hinweis', text: `${f.name || 'Fläche'}: Ausrichtung ${f.azimut}° und Neigung ${f.neigung}° bringen nur ${Math.round(ausrichtung * 100)} % einer Südfläche. Kein Fehler, aber die Erwartung muss dazu passen.` });
    return { ...f, ausrichtung, reihen: r };
  });
  const basis = n.referenz ? n.referenz * (1 - a.sonstigeVerluste) : a.referenzKwhKwp;
  const ideal = sum(flaechen, f => f.kwp * (num(f.pvgisKwhKwp) ? f.pvgisKwhKwp * (1 - a.sonstigeVerluste) : basis * f.ausrichtung)) * a.wrWirkungsgrad;

  const leitungen = n.ac.map(x => acLeitung(x, num(x.kwAC, n.kwAC), num(n.netzSpannung, 400))).filter(Boolean);
  const acAnteil = sum(leitungen, l => l.energieAnteil);
  const acVolllast = sum(leitungen, l => l.verlustAnteil);
  const spannungsfall = sum(leitungen, l => l.spannungsfall);
  if (acVolllast > a.acVerlustGrenze)
    befunde.push({ id: 'acVerlust', schwere: 'befund', text: `AC-Leitungsverlust bei Volllast ${(acVolllast * 100).toFixed(1)} % (Planungswert höchstens ${a.acVerlustGrenze * 100} %): Querschnitt zu klein oder Leitung zu lang.` });
  if (spannungsfall > a.spannungsanstiegGrenze)
    befunde.push({ id: 'spannung', schwere: 'befund', text: `Spannungsanstieg auf der AC-Leitung ${(spannungsfall * 100).toFixed(1)} % (Grenze ${a.spannungsanstiegGrenze * 100} %): Wechselrichter schalten an sonnigen Mittagen wegen Überspannung ab.` });

  const dcAc = n.kwp / n.kwAC;
  const kapp = kappung(dcAc);
  if (dcAc > a.dcAcGrenze) befunde.push({ id: 'dcac', schwere: 'hinweis', text: `DC/AC-Verhältnis ${dcAc.toFixed(2)}: an sonnigen Mittagen wird gekappt, geschätzt ${(kapp * 100).toFixed(1)} % im Jahr.` });

  const strings = n.wr.flatMap(w =>
    w.strings.map(st => {
      const modul = n.modultypen[num(st.modul, 0)];
      const r = stringauslegung(modul, w, st.moduleJeString);
      if (!r) return null;
      const name = [w.hersteller, w.typ].filter(Boolean).join(' ') || 'Wechselrichter';
      r.befunde = r.befunde.map(b => ({ ...b, text: `${name}, ${st.moduleJeString} Module je String: ${b.text}` }));
      return { ...r, wr: name, modul, moduleJeString: st.moduleJeString, anzahl: num(st.anzahl, 1) };
    })
  ).filter(Boolean);
  for (const st of strings) befunde.push(...st.befunde);
  const stringVerlust = Math.max(0, ...strings.map(st => st.verlust));

  // DC-Leitungen: Strom und Spannung aus dem ersten passenden String, sonst aus dem ersten Modultyp
  const m0 = n.modultypen[0] || {};
  const dcLeitungen = n.dc
    .map(k => {
      const st = strings[num(k.string, 0)];
      const modul = st?.modul || m0;
      const strom = num(k.strom, num(modul.impp));
      const spannung = num(k.spannung, num(modul.vmpp) && (st?.moduleJeString || num(k.moduleJeString)) ? modul.vmpp * (st?.moduleJeString || k.moduleJeString) : null);
      return dcLeitung(k, strom, spannung);
    })
    .filter(Boolean);
  const dcAnteil = dcLeitungen.length ? sum(dcLeitungen, l => l.energieAnteil) / dcLeitungen.length : 0;
  for (const l of dcLeitungen)
    if (l.verlustAnteil > a.dcVerlustGrenze)
      befunde.push({ id: 'dcVerlust', schwere: 'hinweis', text: `${l.name}: DC-Verlust bei Volllast ${(l.verlustAnteil * 100).toFixed(1)} % (Planungswert höchstens ${a.dcVerlustGrenze * 100} %).` });
  befunde.push(...kabelQualitaet(n));

  // Angaben gegeneinander: Module laut Liste gegen angegebene Leistung
  if (n.kwpModule && Math.abs(n.kwpModule / n.kwp - 1) > 0.03)
    befunde.push({ id: 'angaben', schwere: 'befund', text: `Die verbauten Module ergeben ${n.kwpModule.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kWp, angegeben sind ${n.kwp.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kWp. Die Unterlagen passen nicht zur Anlage.` });
  const kwAcListe = sum(n.wr, w => w.kwAC * w.anzahl);
  if (n.ist?.wrLeistungAngegeben && kwAcListe && Math.abs(n.ist.wrLeistungAngegeben / kwAcListe - 1) > 0.03)
    befunde.push({ id: 'angabenWr', schwere: 'befund', text: `Wechselrichter laut Liste ${kwAcListe} kW, angegeben ${n.ist.wrLeistungAngegeben} kW.` });

  const reihenVerlust = sum(flaechen, f => (f.reihen ? f.reihen.verlust * f.kwp : 0)) / n.kwp;
  const gebaut = ideal * (1 - acAnteil) * (1 - dcAnteil) * (1 - kapp) * (1 - stringVerlust) * (1 - reihenVerlust);
  return { flaechen, ideal, gebaut, verlust: 1 - gebaut / ideal, leitungen, dcLeitungen, dcAnteil, acAnteil, acVolllast, spannungsfall, dcAc, kappung: kapp, strings, reihenVerlust, befunde };
}

// ---------------------------------------------------------------------------
// 3. Ist heute und Zerlegung

/** Garantiekurve: Anteil der Anfangsleistung nach `alter` Jahren. */
export function garantie(n) {
  // je Modultyp nach Leistung gewichtet; ohne Liste nach Technologie
  const liste = n.modultypen.length ? n.modultypen : [{ typ: n.typ, anzahl: 1, wp: 1 }];
  const gewicht = sum(liste, m => m.anzahl * m.wp) || 1;
  const anteil = m => {
    const g1 = num(m.garantieJahr1, ANNAHMEN.garantieJahr1[m.typ] ?? ANNAHMEN.garantieJahr1.mono);
    const g = num(m.degradation, ANNAHMEN.degradation[m.typ] ?? ANNAHMEN.degradation.mono);
    return n.alter < 1 ? 1 : g1 - g * (n.alter - 1);
  };
  return sum(liste, m => anteil(m) * (m.anzahl * m.wp || 1)) / (n.modultypen.length ? gewicht : 1);
}

/** Verschmutzungsrisiko aus der Umgebung: Quellen mit Abstand in Metern (aus OpenStreetMap oder Ortsbegehung). */
export const VERSCHMUTZER = {
  tierhaltung: { titel: 'Tierhaltung (Stall, Geflügel)', reichweite: 1000, gewicht: 3 },
  steinbruch: { titel: 'Steinbruch, Kies- oder Zementwerk', reichweite: 2000, gewicht: 3 },
  industrie: { titel: 'Industrie, Schornstein', reichweite: 1000, gewicht: 2 },
  acker: { titel: 'Acker (Staub bei Ernte und Bodenbearbeitung)', reichweite: 300, gewicht: 2 },
  bahn: { titel: 'Bahnstrecke (Bremsabrieb)', reichweite: 200, gewicht: 2 },
  strasse: { titel: 'Hauptstraße oder Autobahn', reichweite: 150, gewicht: 1 },
  baustelle: { titel: 'Baustelle, Abbruch', reichweite: 500, gewicht: 2 },
  wald: { titel: 'Bäume, Wald (Laub, Pollen, Harz)', reichweite: 100, gewicht: 1 },
  voegel: { titel: 'Vogelplätze (Silo, Gewässer)', reichweite: 300, gewicht: 2 }
};

export function verschmutzung(n) {
  const quellen = n.umgebung
    .map(q => {
      const v = VERSCHMUTZER[q.art];
      const abstand = num(q.abstand);
      if (!v || abstand == null || abstand > v.reichweite) return null;
      return { ...q, titel: v.titel, punkte: v.gewicht * (1 - abstand / v.reichweite) };
    })
    .filter(Boolean)
    .sort((x, y) => y.punkte - x.punkte);
  const flach = n.felder.some(f => f.neigung < 15);
  const punkte = sum(quellen, q => q.punkte) * (flach ? 1.5 : 1);
  const tageSeitReinigung = num(n.ist?.tageSeitReinigung);
  const stufe = punkte >= 2.5 ? 'hoch' : punkte >= 1 ? 'mittel' : 'niedrig';
  // typischer Verlust ungereinigter Anlagen: 1–3 % normal, 5–15 % an starken Quellen und bei flachen Modulen
  const verlust = { niedrig: 0.02, mittel: 0.05, hoch: 0.1 }[stufe] * (tageSeitReinigung != null && tageSeitReinigung < 120 ? 0.3 : 1);
  return { stufe, punkte, quellen, flach, verlust };
}

/** Ist-Ertrag auf ein Jahr hochrechnen und um das Wetter bereinigen. */
export function istWerte(n) {
  const ist = n.ist || {};
  const tage = num(ist.tage, 365);
  const skal = 365 / tage;
  const zaehler = num(ist.zaehlerKwh) != null ? ist.zaehlerKwh * skal : null;
  const wr = num(ist.wechselrichterKwh) != null ? ist.wechselrichterKwh * skal : null;
  const basis = zaehler ?? wr;
  return { zaehler, wr, basis, wetterFaktor: n.wetterFaktor, quelle: zaehler != null ? 'zaehler' : wr != null ? 'wechselrichter' : null };
}

export function zerlege(n, p, w) {
  const a = ANNAHMEN;
  const g = garantie(n);
  const sollHeute = p.gebaut * g * w.wetterFaktor; // was die Anlage, so wie gebaut, heute liefern muss
  const idealHeute = p.ideal * g * w.wetterFaktor;
  const t = { ideal: idealHeute, planung: idealHeute - sollHeute, alterung: p.gebaut * (1 - g) * w.wetterFaktor, sollHeute };
  if (w.basis == null) return { ...t, bekannt: false, garantie: g };

  // AC-Seite: Wechselrichter gegen Zähler. Erwartet ist der berechnete Leitungsverlust plus Messtoleranz.
  let acMehr = 0;
  let acDiff = null;
  if (w.zaehler != null && w.wr != null && w.wr > 0) {
    acDiff = 1 - w.zaehler / w.wr;
    acMehr = Math.max(0, acDiff - p.acAnteil - a.acToleranz) * w.wr;
  }
  const fehlt = Math.max(0, sollHeute - w.basis);
  const ac = Math.min(acMehr, fehlt);
  const rest = fehlt - ac;
  const performance = w.basis / sollHeute;
  const abw = performance - 1;
  const stufe = abw >= a.stufen.gut ? 'gut' : abw >= a.stufen.auffaellig ? 'auffaellig' : 'schlecht';
  return { ...t, bekannt: true, garantie: g, ist: w.basis, fehlt, ac, acDiff, rest, restAnteil: rest / sollHeute, performance, abw, stufe, gegenIdeal: w.basis / idealHeute };
}

// ---------------------------------------------------------------------------
// Ursachen, Maßnahmen, Entscheidung über Vor-Ort-Prüfung

export const URSACHEN = {
  ...URSACHEN_BASIS,
  ac: {
    titel: 'AC-Seite',
    text: 'Zwischen Wechselrichter und Zähler geht mehr verloren als die Leitung erklärt: beschädigter Leiter, lose oder überhitzte Klemme, defektes Schutzorgan, Wandler oder Zähler.',
    pruefung: 'Isolationswiderstand je Leiter, Spannungsfall unter Last je Phase, Wärmebild der Klemmen und Schutzorgane, bei Verdacht Kabelmesswagen.'
  },
  planung: {
    titel: 'Planung und Aufbau',
    text: 'Die Anlage war schon bei Inbetriebnahme schwächer als nötig: Reihenabstand, Stringauslegung, AC-Querschnitt oder Überdimensionierung.',
    pruefung: 'Stringplan und Datenblätter gegen den Aufbau prüfen, Reihenabstand messen.'
  }
};

export function ursachen(n, p, z, s) {
  if (!z.bekannt) return [];
  const verlauf = n.ist?.verlauf;
  const liste = ursachenBasis({ performance: z.performance, verlauf, meldung: n.ist?.meldung, alter: n.alter, wrAlter: n.ist?.wrAlter ?? n.alter, kwp: n.kwp, jahr: n.jahr, verschattung: n.ist?.verschattung, neigung: n.felder.some(f => f.neigung < 15) ? 'flach' : 'normal' });
  const pkt = Object.fromEntries(liste.map(u => [u.id, u.punkte]));
  pkt.ac = 0;
  pkt.planung = 0;
  if (z.acDiff != null) pkt.ac += z.ac > 0 ? 6 : z.acDiff > p.acAnteil + 0.005 ? 2 : -2;
  if (n.ist?.abschaltungenNetzspannung) { pkt.ac += 3; pkt.abregelung += 2; }
  if (n.ist?.phasenUngleich) pkt.ac += 4;
  if (p.acVolllast > ANNAHMEN.acVerlustGrenze) pkt.ac += 2;
  if (p.verlust > 0.05) pkt.planung += 3 + Math.round(p.verlust * 20);
  if (p.befunde.some(b => b.id === 'steckverbinder' || b.id === 'dcKabeltyp')) { pkt.string += 2; pkt.wechselrichter += 1; }
  if (p.befunde.some(b => b.id === 'angaben')) pkt.planung += 3;
  if (verlauf === 'immer') pkt.planung += 2;
  pkt.verschmutzung += { niedrig: -1, mittel: 2, hoch: 4 }[s.stufe];
  return Object.entries(pkt)
    .map(([id, punkte]) => ({ id, ...URSACHEN[id], punkte }))
    .sort((x, y) => y.punkte - x.punkte);
}

/** Was der Eigentümer ändern oder klären kann, ohne dass jemand vor Ort misst. */
export function massnahmenOhneVorOrt(n, p, z, s, liste) {
  const m = [];
  const top = new Set(liste.slice(0, 3).map(u => u.id));
  if (s.stufe !== 'niedrig' || top.has('verschmutzung'))
    m.push({ id: 'reinigung', text: `Module reinigen lassen${s.quellen.length ? ` (Verschmutzer in der Nähe: ${s.quellen.map(q => q.titel).join(', ')})` : ''}. Danach Ertrag vier Wochen gegen den Vorjahreszeitraum vergleichen.`, wirkung: s.verlust });
  m.push({ id: 'fehlerspeicher', text: 'Fehlerspeicher der Wechselrichter im Portal auslesen und uns schicken: Abschaltungen, Isolationsfehler, Netzfehler mit Datum.' });
  if (top.has('abregelung') || n.ist?.abschaltungenNetzspannung)
    m.push({ id: 'einstellungen', text: 'Einstellungen der Wechselrichter prüfen lassen: Einspeisegrenze (70-%-Regel), Blindleistung, Abschaltgrenzen. Bei Abschaltungen wegen Netzspannung den Netzbetreiber um eine Spannungsmessung bitten.' });
  if (top.has('messung') || (z.acDiff != null && z.acDiff > 0.03))
    m.push({ id: 'abrechnung', text: 'Zählerstand, Wandlerfaktor und Abrechnung gegen die Wechselrichterwerte abgleichen. Ein falscher Wandlerfaktor kostet Geld, ohne dass die Anlage schlecht läuft.' });
  if (top.has('verschattung')) m.push({ id: 'vegetation', text: 'Bäume und Bewuchs vor der Anlage zurückschneiden.' });
  if (!n.ist?.monatswerte) m.push({ id: 'monitoring', text: 'Monatswerte von Zähler und Wechselrichtern regelmäßig erfassen. Dann sieht man einen Ausfall nach Wochen statt nach Jahren.' });
  return m;
}

export function vorOrt(n, p, z, liste) {
  const gruende = [];
  if (p.befunde.some(b => b.schwere === 'gefahr')) gruende.push('Sicherheitsrelevanter Planungsfehler (Spannung über der Grenze des Wechselrichters).');
  if (n.ist?.meldung === 'ja' && n.ist?.isolationsfehler) gruende.push('Wechselrichter meldet Isolationsfehler.');
  if (z.bekannt && z.ac > z.sollHeute * 0.01) gruende.push(`Auf der AC-Seite fehlen rund ${Math.round(z.ac).toLocaleString('de-DE')} kWh im Jahr mehr, als die Leitung erklärt.`);
  if (z.bekannt && z.stufe === 'schlecht' && z.restAnteil > ANNAHMEN.restVorOrt) gruende.push(`Leistung ${Math.round(z.performance * 100)} % des Solls, ${Math.round(z.restAnteil * 100)} % sind aus der Ferne nicht erklärbar.`);
  if (n.ist?.phasenUngleich) gruende.push('Ungleiche Phasen gemeldet.');
  const noetig = gruende.length > 0;
  return {
    noetig,
    dringend: p.befunde.some(b => b.schwere === 'gefahr') || Boolean(n.ist?.isolationsfehler),
    gruende,
    pruefpunkte: noetig ? liste.slice(0, 3).map(u => ({ ursache: u.titel, pruefung: u.pruefung })) : [],
    eigentuemerLiefert: noetig
      ? [
          'Zugang zur Anlage, zum Zählerplatz und zu den Wechselrichtern, Ansprechpartner vor Ort',
          'Datenblätter, Stringplan, Inbetriebnahmeprotokoll, Schaltplan der AC-Seite (wenn vorhanden)',
          'Zählerstände oder Abrechnungen der letzten zwölf Monate, Zugang zum Wechselrichter-Portal',
          'Terminvorschlag und Zustimmung zur Abschaltung während der Messung',
          'Annahme des Angebots (Preis nach Anlagengröße, Anfahrt 0,50 € je Kilometer)'
        ]
      : []
  };
}

// ---------------------------------------------------------------------------
// Wert

export function wert(n, z) {
  if (!z.bekannt) return null;
  const basis = {
    kwp: n.kwp,
    baujahr: n.jahr,
    monat: n.monat,
    art: n.art,
    eegCt: n.eegCt,
    evAnteil: n.evAnteil,
    baukosten: n.baukosten,
    zustand: n.zustand,
    wrJahr: n.wrJahr,
    speicherKwh: n.speicherKwh,
    pachtJahr: n.pachtJahr,
    annahmen: { stichjahr: n.stichjahr, ...(n.art === 'frei' ? ANNAHMEN.freiflaeche : {}) }
  };
  const istJahr = z.ist / n.wetterFaktor; // Normaljahr
  const sollJahr = z.sollHeute / n.wetterFaktor;
  const heute = anlagenwert({ ...basis, ertragJahr: istJahr });
  const behoben = anlagenwert({ ...basis, ertragJahr: sollJahr });
  return {
    marktwert: heute.marktwert, // was ein Käufer für die Erträge zahlt
    restwert: heute.substanz.summe, // Zeitwert der Komponenten
    buchwert: heute.substanz.buchwert,
    marktwertBehoben: behoben.marktwert,
    wertverlust: Math.max(0, behoben.marktwert - heute.marktwert), // so viel ist eine Reparatur höchstens wert
    restjahre: heute.eingabe.restjahre,
    eegCt: heute.eingabe.eegCt
  };
}

// ---------------------------------------------------------------------------
// Gesamtlauf

export function leistungscheck(eingabe) {
  const n = normalisiere(eingabe);
  const p = planung(n);
  const w = istWerte(n);
  const z = zerlege(n, p, w);
  const s = verschmutzung(n);
  const liste = ursachen(n, p, z, s);
  return {
    eingabe: n,
    planung: p,
    ist: w,
    zerlegung: z,
    verschmutzung: s,
    ursachen: liste,
    massnahmen: massnahmenOhneVorOrt(n, p, z, s, liste),
    vorOrt: vorOrt(n, p, z, liste),
    wert: wert(n, z),
    annahmen: ANNAHMEN
  };
}
