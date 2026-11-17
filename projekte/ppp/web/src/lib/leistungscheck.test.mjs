import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { leistungscheck, ausrichtungsFaktor, acLeitung, reihen, stringauslegung, winterSonne } from './leistungscheck.js';
import { protokoll, mitPruefsumme, pruefsumme, alsHtml } from './protokoll.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b} (±${tol})`);

// Ausrichtung gegen PVGIS-Richtwerte (Mitteleuropa)
near(ausrichtungsFaktor(0, 35), 1, 0.001);
near(ausrichtungsFaktor(0, 0), 0.86, 0.02);
near(ausrichtungsFaktor(0, 90), 0.66, 0.04);
near(ausrichtungsFaktor(-90, 30), 0.84, 0.02);
near(ausrichtungsFaktor(180, 30), 0.61, 0.03);
assert.equal(ausrichtungsFaktor(90, 30), ausrichtungsFaktor(-90, 30));

// AC-Leitung: 240 mm² Kupfer, 100 m, 400 A → rund 3,6 kW Verlust bei 20 °C, bei 50 °C etwas mehr
const kw400A = (Math.sqrt(3) * 400 * 400) / 1000; // 277 kW
const l = acLeitung({ querschnitt: 240, laenge: 100, material: 'cu' }, kw400A);
near(l.strom, 400, 0.5);
near(l.verlustKw, 3.56 * (1 + 0.00393 * 30), 0.05);
assert.ok(l.verlustAnteil > 0.01 && l.verlustAnteil < 0.02);
const al = acLeitung({ querschnitt: 240, laenge: 100, material: 'al' }, kw400A);
assert.ok(al.verlustKw > l.verlustKw * 1.5, 'Aluminium verliert mehr');
assert.equal(acLeitung({ querschnitt: 0, laenge: 100 }, 100), null);

// Reihenabstand: Westsachsen, Sonne am 21.12. mittags knapp 16°
near(winterSonne(50.7), 15.86, 0.01);
const r = reihen({ aufgestaendert: true, modulTiefe: 2.3, neigung: 20, reihenabstand: 4 }, 50.7);
assert.ok(r.noetig > 4.8 && r.noetig < 5.1, `nötig ${r.noetig}`);
assert.ok(r.verlust > 0.02);

// Stringauslegung: 24 Module à 49,5 V Leerlauf an 1.000-V-Wechselrichter → bei −10 °C zu viel
const s = stringauslegung({ uoc: 49.5, vmpp: 41.5, tkUoc: -0.28 }, { umaxDC: 1000, mppMin: 500, mppMax: 850 }, 22);
assert.ok(s.uocKalt > 1000);
assert.equal(s.befunde[0].schwere, 'gefahr');

// Fall 1: gut laufende Dachanlage, 10 kWp Süd 35°, kein Ist-Fehler
const gut = leistungscheck({
  kwp: 10,
  inbetriebnahme: { jahr: 2016, monat: 5 },
  felder: [{ kwp: 10, azimut: 0, neigung: 35 }],
  wechselrichter: [{ kwAC: 9, anzahl: 1 }],
  ist: { zaehlerKwh: 9000 },
  evAnteil: 30,
  stichjahr: 2026
});
assert.equal(gut.zerlegung.stufe, 'gut');
assert.equal(gut.vorOrt.noetig, false);
assert.ok(gut.wert.marktwert > 0);

// Fall 2: AC-Schaden (Muster wie Steinpleis): Wechselrichter liefern, am Zähler kommt 9 % weniger an
const ac = leistungscheck({
  bezeichnung: 'Testanlage AC',
  standort: { ort: 'Landkreis Zwickau', breite: 50.7 },
  kwp: 99.6,
  inbetriebnahme: { jahr: 2012, monat: 7 },
  module: { typ: 'poly' },
  felder: [{ kwp: 99.6, azimut: 0, neigung: 25 }],
  wechselrichter: [{ kwAC: 30, anzahl: 3 }],
  ac: [{ name: 'Wechselrichter bis Zählerschrank', querschnitt: 95, material: 'cu', laenge: 60 }],
  ist: { zaehlerKwh: 76000, wechselrichterKwh: 83500, verlauf: 'ploetzlich', meldung: 'nein', phasenUngleich: true },
  eegCt: 24.43,
  stichjahr: 2026
});
assert.equal(ac.ursachen[0].id, 'ac', `erste Ursache ${ac.ursachen[0].id}`);
assert.ok(ac.zerlegung.ac > 2000, `AC ${ac.zerlegung.ac}`);
assert.ok(ac.vorOrt.noetig);
assert.ok(ac.vorOrt.pruefpunkte[0].pruefung.includes('Kabelmesswagen'));
assert.ok(ac.massnahmen.some(m => m.id === 'abrechnung'));
assert.ok(ac.wert.wertverlust > 0);

// Fall 3: Freifläche schlecht geplant: Reihen zu dicht, Strings zu lang, dünner Alu-Querschnitt
const plan = leistungscheck({
  kwp: 750,
  art: 'frei',
  inbetriebnahme: { jahr: 2020, monat: 4 },
  module: { typ: 'mono', uoc: 49.5, vmpp: 41.5, tkUoc: -0.28 },
  felder: [{ kwp: 750, azimut: 0, neigung: 20, aufgestaendert: true, modulTiefe: 2.3, reihenabstand: 3.8 }],
  wechselrichter: [{ kwAC: 100, anzahl: 5, umaxDC: 1000, mppMin: 500, mppMax: 850, moduleJeString: 22 }],
  ac: [{ name: 'Wechselrichter bis Trafo', querschnitt: 150, material: 'al', laenge: 220, kwAC: 500 }],
  ist: { zaehlerKwh: 640000, verlauf: 'immer' },
  stichjahr: 2026
});
const ids = plan.planung.befunde.map(b => b.id);
for (const id of ['reihen', 'uoc', 'acVerlust', 'dcac']) assert.ok(ids.includes(id), `Befund ${id} fehlt: ${ids}`);
assert.ok(plan.planung.verlust > 0.05);
assert.ok(plan.vorOrt.dringend, 'Überspannung ist dringend');
assert.ok(plan.ursachen.slice(0, 3).some(u => u.id === 'planung'));

// Fall 4: flache Module neben Geflügelstall und Acker, schleichender Verlust
const dreck = leistungscheck({
  kwp: 30,
  inbetriebnahme: { jahr: 2015, monat: 6 },
  felder: [{ kwp: 30, azimut: 0, neigung: 10 }],
  wechselrichter: [{ kwAC: 27, anzahl: 1 }],
  ist: { zaehlerKwh: 21500, verlauf: 'schleichend', meldung: 'nein' },
  umgebung: [{ art: 'tierhaltung', abstand: 250 }, { art: 'acker', abstand: 50 }],
  stichjahr: 2026
});
assert.equal(dreck.verschmutzung.stufe, 'hoch');
assert.equal(dreck.ursachen[0].id, 'verschmutzung');
assert.equal(dreck.massnahmen[0].id, 'reinigung');

// Ohne Ist-Werte: nur Soll
const leer = leistungscheck({ kwp: 8, inbetriebnahme: { jahr: 2022 } });
assert.equal(leer.zerlegung.bekannt, false);
assert.equal(leer.wert, null);
assert.equal(leer.ursachen.length, 0);

// Wetter: schlechtes Jahr senkt das Soll, die Anlage wird nicht schlecht geredet
const wetter = leistungscheck({ kwp: 10, inbetriebnahme: { jahr: 2016 }, ist: { zaehlerKwh: 8000 }, wetter: { zeitraumFaktor: 0.88 }, stichjahr: 2026 });
assert.equal(wetter.zerlegung.stufe, 'gut');

// Fall 5: zwei Modultypen, Strings je Wechselrichter, DC-Kabel ohne Solarzulassung, gemischte Steckverbinder,
// Unterlagen nennen mehr Leistung als verbaut ist (Muster: Anlage mit falschen Angaben verkauft)
const komp = leistungscheck({
  kwp: 60,
  art: 'frei',
  inbetriebnahme: { jahr: 2014, monat: 8 },
  module: [
    { hersteller: 'A', modell: 'P250', typ: 'poly', wp: 250, anzahl: 120, uoc: 37.6, vmpp: 30.4, impp: 8.2, tkUoc: -0.31 },
    { hersteller: 'B', modell: 'M300', typ: 'mono', wp: 300, anzahl: 40, uoc: 39.8, vmpp: 32.5, impp: 9.2, tkUoc: -0.29 }
  ],
  felder: [{ kwp: 42, azimut: 0, neigung: 25, aufgestaendert: true, modulTiefe: 1.65, reihenabstand: 4.5 }],
  wechselrichter: [{ hersteller: 'X', typ: 'TL 20', kwAC: 20, anzahl: 2, umaxDC: 1000, mppMin: 350, mppMax: 800, strings: [{ modul: 0, moduleJeString: 20, anzahl: 6 }, { modul: 1, moduleJeString: 20, anzahl: 2 }] }],
  dc: [{ name: 'String 1', querschnitt: 2.5, laenge: 80, kabeltyp: 'NYM' }],
  steckverbinder: { mischung: true },
  ac: [{ name: 'Wechselrichter bis Trafostation', querschnitt: 95, material: 'al', laenge: 120 }],
  ist: { zaehlerKwh: 33000 },
  stichjahr: 2026
});
const kids = komp.planung.befunde.map(b => b.id);
for (const id of ['angaben', 'dcKabeltyp', 'dcQuerschnitt', 'steckverbinder', 'alKlemmen']) assert.ok(kids.includes(id), `Befund ${id} fehlt: ${kids}`);
near(komp.eingabe.kwpModule, 42, 0.01);
assert.equal(komp.planung.strings.length, 2);
assert.ok(komp.planung.dcLeitungen[0].verlustAnteil > 0.01, 'dünnes DC-Kabel verliert');
const g = komp.zerlegung.garantie;
assert.ok(g > 0.9 && g < 0.94, `Garantie gewichtet ${g}`);
// Freifläche und Dach unterscheiden sich in Bauwert und Vergütung
const alsDach = leistungscheck({ ...komp.eingabe, inbetriebnahme: { jahr: 2011, monat: 6 }, art: 'dach', module: komp.eingabe.modultypen, kwp: 42 });
const alsFrei = leistungscheck({ ...komp.eingabe, inbetriebnahme: { jahr: 2011, monat: 6 }, art: 'frei', module: komp.eingabe.modultypen, kwp: 42 });
assert.ok(alsFrei.wert.restwert < alsDach.wert.restwert, 'Freifläche: geringerer Bauwert je kWp');
assert.notEqual(alsFrei.wert.eegCt, alsDach.wert.eegCt, 'Freifläche: andere Vergütung');
const prK = alsHtml(protokoll(komp));
assert.ok(prK.includes('Verbaute Komponenten') && prK.includes('Freifläche') && prK.includes('Steckverbinder'));

// Protokoll mit Prüfsumme
const pr = await mitPruefsumme(protokoll(ac, { nummer: 'LC-2026-0001', erstellt: '2026-11-17' }));
assert.equal(pr.pruefsumme.length, 64);
assert.equal(await pruefsumme(pr), pr.pruefsumme, 'Prüfsumme reproduzierbar');
assert.notEqual(await pruefsumme({ ...pr, anlage: { ...pr.anlage, kwp: 100 } }), pr.pruefsumme, 'Änderung fällt auf');
const html = alsHtml(pr);
for (const t of ['Leistungscheck Ihrer Solaranlage', 'AC-Seite', 'Wert der Anlage', 'Restwert', 'Prüfung vor Ort', 'ohne Termin vor Ort'])
  assert.ok(html.includes(t), `HTML ohne „${t}“`);
if (process.env.PROTOKOLL) writeFileSync(process.env.PROTOKOLL, html);

console.log('Fall AC:', ac.zerlegung.stufe, Math.round(ac.zerlegung.performance * 100) + ' %', 'AC', Math.round(ac.zerlegung.ac), 'kWh, Rest', Math.round(ac.zerlegung.rest), 'kWh, Wertverlust', Math.round(ac.wert.wertverlust), '€');
console.log('Fall Planung:', plan.zerlegung.stufe, 'Planungsverlust', Math.round(plan.planung.verlust * 100) + ' %', ids.join(','));
console.log('Fall Verschmutzung:', dreck.zerlegung.stufe, Math.round(dreck.zerlegung.performance * 100) + ' %');
console.log('alle Tests bestanden');
