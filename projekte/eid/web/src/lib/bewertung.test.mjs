import assert from 'node:assert/strict';
import { bewerte, evAnteilOhneSpeicher, DEFAULTS } from './bewertung.js';

// Haushalt: 5 kWp von 2006, 4.000 kWh Verbrauch
const h = bewerte({ kwp: 5, ertragKwp: 850, verbrauch: 4000 });
const weiter = h.optionen.find(o => o.id === 'weiter');
// 5 * 850 = 4250 kWh * 3,79 ct = 161 € im ersten Jahr
assert.equal(Math.round(weiter.jahr1), 161);
assert.equal(weiter.investition, 1200); // WR-Mindestkosten
assert.ok(h.optionen.find(o => o.id === 'eigen').jahr1 > weiter.jahr1 * 2, 'Eigenverbrauch muss deutlich mehr bringen');
assert.equal(h.optionen.length, 4);
// EV-Anteil: Erzeugung ≈ Verbrauch -> ~28-30 %
const ev = evAnteilOhneSpeicher(4250, 4000, false);
assert.ok(ev > 0.27 && ev < 0.3, String(ev));
// Wert der Weiter-Option = Anlagenwert
assert.equal(h.anlagenwert, Math.max(0, weiter.wert));

// Große Anlage 1.000 kWp Gewerbe: Direktvermarktung mit Abzügen
const g = bewerte({ kwp: 1000, ertragKwp: 900, verbrauch: 300000 });
const gw = g.optionen.find(o => o.id === 'weiter');
// 900.000 kWh * (3,79-0,3) ct = 31.410 € - 600 € fix
assert.equal(Math.round(gw.jahr1), 30810);
assert.equal(g.eingabe.strompreisCt, 25);
assert.ok(g.optionen.find(o => o.id === 'speicher').speicherKwh === 300);
assert.equal(gw.investition, 80000); // 1.000 kW * 80 €
assert.equal(g.optionen.find(o => o.id === 'neu').jahre, 20);

// Kein Verbrauch: kein Speicher, Eigenverbrauch = 0
const z = bewerte({ kwp: 10, verbrauch: 0 });
assert.equal(z.optionen.some(o => o.id === 'speicher'), false);
assert.ok(z.optionen.every(o => Number.isFinite(o.wert)));

// Annahmen überschreibbar
const a = bewerte({ kwp: 5, verbrauch: 4000, wrOriginal: false, annahmen: { ue20Ct: 6 } });
assert.equal(Math.round(a.optionen[0].jahr1), Math.round(4250 * 0.06));
assert.equal(a.optionen[0].investition, 0);
assert.equal(a.optionen[0].amortisation, 0);
assert.equal(DEFAULTS.jahre, 10);
console.log('alle Tests bestanden');
for (const o of h.optionen) console.log('H', o.id, Math.round(o.jahr1), Math.round(o.investition), Math.round(o.summe), Math.round(o.wert), o.amortisation);
for (const o of g.optionen) console.log('G', o.id, Math.round(o.jahr1), Math.round(o.investition), Math.round(o.summe), Math.round(o.wert), o.amortisation);
