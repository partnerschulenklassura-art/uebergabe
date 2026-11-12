import assert from 'node:assert/strict';
import { heute, mitEid, leistung, ursachen, MEHR } from './mehrwert.js';
const near = (a, b, t = 0.01) => assert.ok(Math.abs(a - b) <= t, `${a} != ${b}`);

// Ü20-Anlage von 2006, 6 kWp, 5.400 kWh, alles eingespeist
const h1 = heute({ kwp: 6, foerderEnde: 2026, eegCt: 51.8, ertragJahr: 5400, evAnteil: 0, stichjahr: 2026 });
assert.equal(h1.art, 'ue20');
near(h1.euroJahr, 5400 * 0.03793);
const m1 = mitEid(h1, { preisCt: 9.5, anteil: 0.5, baujahr: 2006 });
// wie Nachbarwatt: (9,5 − 3,793) ct × 2.700 kWh
near(m1.extraCt, 9.5 - 3.793);
near(m1.extraEuro, 2700 * (9.5 - 3.793) / 100);
assert.equal(m1.unterMindest, false);
assert.equal(m1.modell, 'gemeinschaft');
near(m1.neuEuroJahr, h1.euroJahr + m1.extraEuro);

// EEG-Anlage 2016, 10 kWp, 12,31 ct, 30 % Eigenverbrauch
const h2 = heute({ kwp: 10, foerderEnde: 2036, eegCt: 12.31, ertragJahr: 9000, evAnteil: 0.3, stichjahr: 2026 });
assert.equal(h2.art, 'eeg');
near(h2.einspeisung, 6300);
const m2 = mitEid(h2, { preisCt: 9.5, anteil: 0.5, baujahr: 2016, gewerblich: true });
near(m2.extraCt, 9.5 - 4.508 + 0.4); // Nachbarwatt-Formel
assert.equal(m2.modell, 'liefer');

// Grenzen: Preis wird auf 4–12 begrenzt, Neuanlage 2027 nicht möglich, kleine Mengen markiert
assert.equal(mitEid(h1, { preisCt: 20, baujahr: 2006 }).preis, 12);
assert.equal(mitEid(h1, { preisCt: 9.5, baujahr: 2027 }).moeglich, false);
const klein = heute({ kwp: 3, foerderEnde: 2026, ertragJahr: 2700, stichjahr: 2026 });
assert.equal(mitEid(klein, { baujahr: 2006 }).unterMindest, true);

// Großanlage ausgefördert: Direktvermarktung
assert.equal(heute({ kwp: 300, foerderEnde: 2025, ertragJahr: 270000, stichjahr: 2026 }).art, 'dv');

// EEG-Satz unbekannt: kein Eurobetrag
assert.equal(heute({ kwp: 10, foerderEnde: 2034, eegCt: null, ertragJahr: 9000, stichjahr: 2026 }).euroJahr, null);

// Leistungs-Check
const l0 = leistung({ kwp: 10, alter: 10, ausrichtung: 'sued' });
assert.equal(l0.bekannt, false);
near(l0.soll, 10 * 950 * 0.995 ** 10, 0.001);
const l1 = leistung({ kwp: 10, alter: 10, ertragIst: 9000, ausrichtung: 'sued', ct: 12.31 });
assert.equal(l1.stufe, 'gut');
const l2 = leistung({ kwp: 10, alter: 10, ertragIst: 7000, ausrichtung: 'sued', ct: 12.31 });
assert.equal(l2.stufe, 'schlecht');
near(l2.fehltEuro, (l2.soll - 7000) * 0.1231);
near(l2.performance, 7000 / l2.soll);
// Ist aus der Vergütung laut Abrechnung: 700 € bei 12,31 ct und 30 % Eigenverbrauch
const l4 = leistung({ kwp: 10, alter: 10, erloesIst: 700, ct: 12.31, evAnteil: 0.3, ausrichtung: 'sued' });
assert.equal(l4.quelle, 'erloes');
near(l4.ist, 700 / 0.1231 / 0.7, 0.5);
// Neigung und Verschattung senken das Soll
const l5 = leistung({ kwp: 10, alter: 0, ausrichtung: 'sued', neigung: 'flach', verschattung: 'leicht' });
near(l5.soll, 10 * 950 * 0.92 * 0.93, 0.01);
const l3 = leistung({ kwp: 10, alter: 10, ertragIst: 7600, ausrichtung: 'ostwest', ct: 12.31 });
assert.equal(l3.stufe, 'gut'); // Ost-West erwartet weniger
assert.equal(MEHR.preisStart, 9.5);
// Fehlersuche: plötzlicher Einbruch mit Fehlermeldung -> Wechselrichter vorn
const u1 = ursachen({ performance: 0.55, verlauf: 'ploetzlich', meldung: 'ja', alter: 12, wrAlter: 12, kwp: 9, jahr: 2014 });
assert.equal(u1[0].id, 'wechselrichter');
// plötzlich, keine Meldung -> String vorn
const u2 = ursachen({ performance: 0.65, verlauf: 'ploetzlich', meldung: 'nein', alter: 6, wrAlter: 6, kwp: 30, jahr: 2020 });
assert.equal(u2[0].id, 'string');
// schleichend, flach, leicht unter Soll -> Verschmutzung oder Module vorn
const u3 = ursachen({ performance: 0.88, verlauf: 'schleichend', meldung: 'nein', alter: 14, wrAlter: 3, kwp: 10, jahr: 2012, neigung: 'flach' });
assert.ok(['verschmutzung', 'module'].includes(u3[0].id), u3[0].id);
// war schon immer zu wenig -> Abregelung oder Messung vorn
const u4 = ursachen({ performance: 0.85, verlauf: 'immer', meldung: 'nein', alter: 5, wrAlter: 5, kwp: 150, jahr: 2021 });
assert.ok(['abregelung', 'messung'].includes(u4[0].id), u4[0].id);
assert.equal(u1.length, 7);

console.log('alle Tests bestanden');
console.log('Ü20 6 kWp: heute', Math.round(h1.euroJahr), '€, mit EID', Math.round(m1.neuEuroJahr), '€ (+', Math.round(m1.extraEuro), ')');
console.log('2016 10 kWp: heute', Math.round(h2.euroJahr), '€, plus', Math.round(m2.extraEuro), '€');
console.log('Check 7000 kWh:', Math.round(l2.abw * 100), '%, fehlen', Math.round(l2.fehltEuro), '€');
