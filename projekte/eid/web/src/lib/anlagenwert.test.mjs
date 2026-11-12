import assert from 'node:assert/strict';
import { anlagenwert, VORGABEN } from './anlagenwert.js';
import { eegSatz, baupreisKwp, EEG, BAUPREIS } from './historie.js';

const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

// Tabelle: Details in eeg.test.mjs
assert.equal(eegSatz(2006, 1, 5).ct, 51.8);
near(eegSatz(2006, 1, 40).ct, (30 * 51.8 + 10 * 49.28) / 40, 0.011); // anteilig
assert.equal(eegSatz(2014, 5, 5).ct, null);
assert.equal(eegSatz(2026, 9, 8).ct, 7.7);
assert.ok(EEG.every((z, i) => i === 0 || EEG.at(i - 1).ab < z.ab), 'Tabelle aufsteigend');
assert.equal(baupreisKwp(2006).preis, 6000);
assert.equal(baupreisKwp(2003).geschaetzt, true);
assert.equal(baupreisKwp(2026).preis, 1015);
assert.equal(BAUPREIS.length, 21);

// Neupreis heute für 10 kWp klein = 1.015 €/kWp wie die Preisreihe 2026
const neu = anlagenwert({ kwp: 10, baujahr: 2026, monat: 9 });
near(neu.substanz.neu / 10, 1015, 0.5);
assert.equal(neu.eingabe.eegCt, 7.7);
assert.ok(neu.eingabe.eegAusTabelle);
near(neu.substanz.damals, 10150, 0.5);
near(neu.substanz.buchwert, 10150, 0.5);

// Ü20 von 2006, 5 kWp: Satz aus Tabelle, EEG vorbei, Restnutzung aus Inbetriebnahme
const u = anlagenwert({ kwp: 5, baujahr: 2006, ertragJahr: 4500 });
assert.equal(u.eingabe.restjahre, 10);
assert.equal(u.eingabe.eegCt, 51.8);
assert.equal(u.ertrag.teile.eeg, 0);
assert.equal(u.substanz.buchwert, 0);
near(u.substanz.damals, 30000);
const mod = u.substanz.teile.find(t => t.id === 'module');
near(mod.basis, 700); // niedrigerer Wert: heute 700 € statt damals rund 4.600 €
near(mod.zeitwert, 700 / 3);

// 2016, 10 kWp: Satz 12,31 bis Ende 2036, Restbuchwert aus Baupreis 1.700 €/kWp
const m = anlagenwert({ kwp: 10, baujahr: 2016, evAnteil: 25 });
assert.equal(m.eingabe.eegCt, 12.31);
assert.equal(m.ertrag.jahre.filter(j => j.eeg > 0).length, 10);
near(m.substanz.buchwert, 17000 * 0.5);
assert.equal(m.eingabe.restjahre, 20);

// Eigene Baukosten haben Vorrang, eigene Vergütung auch
const r = anlagenwert({ kwp: 10, baujahr: 2016, baukosten: 6000, eegCt: 12.5 });
assert.equal(r.eingabe.eegAusTabelle, false);
assert.equal(r.eingabe.eegCt, 12.5);
near(r.substanz.damals, 6000);
assert.ok(r.substanz.teile.filter(t => t.damals != null).every(t => t.basis === t.damals), 'Rechnung niedriger als heute');

// Großanlage: Größenfaktor, Netzanschluss, keine Tabelle
const g = anlagenwert({ kwp: 1000, baujahr: 2014, eegCt: 9, ertragKwp: 950, netzanschlussEuro: 80000, zustand: 'maengel' });
assert.ok(g.eingabe.gross);
assert.equal(g.eingabe.eegAusTabelle, false);
assert.ok(g.substanz.baupreis.jeKwp < 2000, 'große Anlagen günstiger je kWp');
near(g.ertrag.jahre.at(0).eeg, 1000 * 950 * 0.995 * 0.087, 1);

// Freifläche 2010, 2.000 kWp: Satz aus Tabelle
const ff = anlagenwert({ kwp: 2000, baujahr: 2010, monat: 3, art: 'frei', ertragKwp: 950 });
assert.equal(ff.eingabe.eegCt, 28.43);
assert.ok(ff.eingabe.eegAusTabelle);
// Dach 2010 gleich groß: anderer, anteiliger Satz
const dg = anlagenwert({ kwp: 2000, baujahr: 2010, monat: 3, ertragKwp: 950 });
near(dg.eingabe.eegCt, (30 * 39.14 + 70 * 37.23 + 900 * 35.23 + 1000 * 29.37) / 2000, 0.011);

for (const x of [neu, u, m, r, g, ff]) {
  near(Object.values(x.ertrag.teile).reduce((s, v) => s + v, 0), x.ertrag.summe, 0.01);
  assert.equal(x.steuerwert, Math.max(x.ertrag.summe, x.substanz.summe, 0));
}
assert.equal(VORGABEN.stichjahr, 2026);
console.log('alle Tests bestanden');
for (const [k, x] of [['neu', neu], ['ue20', u], ['2016', m], ['1MW', g]])
  console.log(k, 'Ertrag', Math.round(x.ertrag.summe), 'Substanz', Math.round(x.substanz.summe), 'Buchwert', Math.round(x.substanz.buchwert), 'Baupreis/kWp', Math.round(x.substanz.baupreis.jeKwp));
