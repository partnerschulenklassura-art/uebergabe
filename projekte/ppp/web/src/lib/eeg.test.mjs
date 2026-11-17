import assert from 'node:assert/strict';
import { eegSatz, mischSatz, EEG } from './historie.js';
const near = (a, b, t = 0.011) => assert.ok(Math.abs(a - b) <= t, `${a} != ${b}`);

// SBZ-Beispiel: 120 kWp, Dach, 2006 = 49,82 ct
near(eegSatz(2006, 5, 120).ct, 49.82);
// klein bleibt beim kleinsten Satz
assert.equal(eegSatz(2006, 1, 8).ct, 51.8);
// Freifläche 2006 und 2010
assert.equal(eegSatz(2006, 1, 500, 'frei').ct, 40.6);
assert.equal(eegSatz(2010, 3, 2000, 'frei').ct, 28.43);
// 2009: 1.500 kWp Dach mit eigener Klasse über 1 MW
near(eegSatz(2009, 1, 1500).ct, (30 * 43.01 + 70 * 40.91 + 900 * 39.58 + 500 * 33.0) / 1500);
// 2011, 100 kWp Dach (Saarbrücken: 28,74 / 27,33)
near(eegSatz(2011, 6, 100).ct, (30 * 28.74 + 70 * 27.33) / 100);
// 2016: über 100 kWp keine feste Vergütung mehr
assert.equal(eegSatz(2016, 1, 150).ct, null);
assert.equal(eegSatz(2016, 1, 150).grund, 'groesse');
near(eegSatz(2016, 1, 30).ct, (10 * 12.31 + 20 * 11.97) / 30);
// Lücken
assert.equal(eegSatz(2014, 3, 8).grund, 'luecke');
assert.equal(eegSatz(2013, 1, 30).grund, 'luecke'); // nur ≤10 kWp belegt
assert.equal(eegSatz(2013, 1, 8).ct, 17.02);
// Volleinspeisung ab August 2022
assert.equal(eegSatz(2023, 5, 8, 'dach', true).ct, 13.0);
near(eegSatz(2026, 9, 20, 'dach', true).ct, (10 * 12.22 + 10 * 10.24) / 20);
assert.equal(eegSatz(2020, 5, 8, 'dach', true).ct, 9.87); // vor 08/2022 kein eigener Volleinspeisesatz
// vor 2000
assert.equal(eegSatz(1999, 1, 5).grund, 'vor2000');
// Tabelle aufsteigend
assert.ok(EEG.every((z, i) => i === 0 || EEG.at(i - 1).ab < z.ab));
assert.deepEqual(mischSatz([[10, 10], [Infinity, 5]], 20), { ct: 7.5 });
console.log('alle Tests bestanden');
