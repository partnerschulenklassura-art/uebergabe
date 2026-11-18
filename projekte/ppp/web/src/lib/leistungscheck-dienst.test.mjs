import assert from 'node:assert/strict';
import { eingabeAusFormular, komponentenAusFormular, zeitraum } from './leistungscheck-dienst.js';
import { leistungscheck } from './leistungscheck.js';

assert.deepEqual(zeitraum(new Date(2026, 10, 18)), { von: '2025-11', bis: '2026-10' });
assert.deepEqual(komponentenAusFormular(null), {});
const k = komponentenAusFormular({
  module: [{ hersteller: 'A', modell: 'P250', typ: 'poly', wp: '250', anzahl: '120', uoc: '37,6', vmpp: '30,4', impp: '8,2', tkUoc: '-0,31' }, { wp: '', anzahl: '' }],
  wechselrichter: [{ hersteller: 'X', typ: 'TL', kwAC: '25', anzahl: '1', umaxDC: '1000', mppMin: '350', mppMax: '800', modul: '0', moduleJeString: '20', stringAnzahl: '6' }],
  kabel: [{ seite: 'dc', name: 'String 1', querschnitt: '2,5', laenge: '80', material: 'cu', kabeltyp: 'NYM' }, { seite: 'ac', querschnitt: '95', laenge: '120', material: 'al' }, { seite: 'ac', querschnitt: '', laenge: '' }],
  steckverbinderMischung: true
});
assert.equal(k.module.length, 1, 'leere Modulzeile fällt weg');
assert.equal(k.module[0].uoc, 37.6);
assert.equal(k.wechselrichter[0].strings[0].moduleJeString, 20);
assert.equal(k.dc.length, 1);
assert.equal(k.ac.length, 1);
assert.equal(k.ac[0].material, 'al');
assert.deepEqual(k.steckverbinder, { mischung: true });

const e = eingabeAusFormular({ adresse: 'x', art: 'dach', kwp: '30', jahr: '2014', ausrichtung: 'sued', neigung: '30', ertrag: '24.000', quelle: 'zaehler', komponenten: {
  module: [{ typ: 'poly', wp: '250', anzahl: '120', uoc: '37,6', vmpp: '30,4', impp: '8,2' }],
  wechselrichter: [{ kwAC: '25', anzahl: '1', umaxDC: '1000', mppMin: '350', mppMax: '800', modul: '0', moduleJeString: '20' }],
  kabel: [{ seite: 'dc', querschnitt: '2,5', laenge: '80', material: 'cu', kabeltyp: 'NYM' }],
  steckverbinderMischung: true } });
assert.equal(e.ist.zaehlerKwh, 24000, 'Tausenderpunkt');
const r = leistungscheck(e);
const ids = r.planung.befunde.map(b => b.id);
for (const id of ['dcKabeltyp', 'dcQuerschnitt', 'steckverbinder']) assert.ok(ids.includes(id), `${id} fehlt: ${ids}`);
console.log('Dienst-Tests bestanden');
