// Rechenbeispiele für die Tagesgeschichte. Alle Annahmen stehen hier und werden auf der Seite genannt.
// Quellen: BDEW-Strompreisanalyse 10/2026 (Ø 37,3 ct/kWh; Netzentgelt 9,2 ct; Steuern, Abgaben, Umlagen 12,6 ct
// inkl. 19 % USt.), Marktwerte Solar 2026 der Übertragungsnetzbetreiber (netztransparenz.de).
import { gen, price } from './day.js';

export const ASSUME = {
  festpreis: 37.3, // ct/kWh, Ø Haushalt 2026 (BDEW)
  netz: 9.2, // ct/kWh Netzentgelt
  abgabenNetto: 6.65, // ct/kWh Steuern, Abgaben, Umlagen ohne USt.
  vertrieb: 2, // ct/kWh Aufschlag des Lieferanten (Annahme)
  ust: 1.19,
  // Käufer: 12 kWh am Tag, davon 3,6 kWh verschiebbar (E-Auto, Wärmepumpe, Spülmaschine)
  grundlast: 0.35, // kWh je Stunde
  flexKwh: 3.6,
  // Erzeuger: 30-kWp-Anlage mit 60-kWh-Speicher, reiner Börsenerlös
  kwp: 30,
  ertragProKwp: 0.78, // kWh je kWp in der Mittagsstunde eines Sommertags
  speicherKwh: 60,
  ladenUnter: 3 // ct/kWh: Speicher lädt, wenn der Börsenpreis darunter liegt
};

// Preis im dynamischen Tarif: Börse + Vertrieb + Netz + Abgaben, darauf USt.
export const dynPreis = h => (price(h) + ASSUME.vertrieb + ASSUME.netz + ASSUME.abgabenNetto) * ASSUME.ust;

const STEP = 0.25;
const H0 = 4;
const H1 = 22;
const N = Math.round((H1 - H0) / STEP) + 1;

// Kumulierte Werte je Viertelstunde, damit der Zähler beim Scrollen nur nachschlagen muss.
const buyerFix = new Float32Array(N);
const buyerFlex = new Float32Array(N);
const sellerPlain = new Float32Array(N);
const sellerStore = new Float32Array(N);
const storeSoc = new Float32Array(N);

(() => {
  const A = ASSUME;
  let bf = 0;
  let bx = 0;
  let sp = 0;
  let ss = 0;
  let soc = 0;
  for (let i = 0; i < N; i++) {
    const h = H0 + i * STEP;
    const p = price(h);
    // Käufer: Grundlast immer; flexibler Anteil abends (18–21 Uhr) im Festpreis, mittags (11–14 Uhr) im dynamischen Tarif
    const base = A.grundlast * STEP;
    const flexEvening = h >= 18 && h < 21 ? (A.flexKwh / 3) * STEP : 0;
    const flexNoon = h >= 11 && h < 14 ? (A.flexKwh / 3) * STEP : 0;
    bf += ((base + flexEvening) * A.festpreis) / 100;
    bx += ((base + flexNoon) * dynPreis(h)) / 100;
    // Erzeuger
    const kwh = gen(h) * A.kwp * A.ertragProKwp * STEP;
    const erl = p > 0 ? p : 0; // bei negativen Preisen kein Erlös, Anlage regelt ab
    sp += (kwh * erl) / 100;
    let sell = kwh;
    if (p < A.ladenUnter && soc < A.speicherKwh) {
      const take = Math.min(kwh, A.speicherKwh - soc);
      soc += take;
      sell -= take;
    }
    let out = 0;
    if (h >= 18 && h < 21 && soc > 0) {
      out = Math.min(soc, (A.speicherKwh / 3) * STEP);
      soc -= out;
    }
    ss += (sell * erl + out * 0.92 * Math.max(p, 0)) / 100; // 8 % Speicherverluste
    buyerFix[i] = bf;
    buyerFlex[i] = bx;
    sellerPlain[i] = sp;
    sellerStore[i] = ss;
    storeSoc[i] = soc / A.speicherKwh;
  }
})();

const idx = h => Math.max(0, Math.min(N - 1, Math.round((h - H0) / STEP)));

export const money = h => {
  const i = idx(h);
  return {
    buyerFix: buyerFix[i],
    buyerFlex: buyerFlex[i],
    sellerPlain: sellerPlain[i],
    sellerStore: sellerStore[i],
    soc: storeSoc[i]
  };
};

export const euro = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
