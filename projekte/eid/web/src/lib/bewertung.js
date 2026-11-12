// Bewertung ausgeförderter und älterer Solaranlagen: vier Wege über einen Betrachtungszeitraum.
// Reine Rechnung ohne React, damit sie testbar ist. Alle Annahmen stehen in DEFAULTS und sind änderbar.
// Strompreis Haushalt 37,3 ct (BDEW 10/2026, wie money.js), Gewerbe 25 ct als Annahme.
// Rechtsstand und Quellen: 00_Leitstand/RECHTSLAGE.md, Abschnitt "Ü20 und Bestandsanlagen".

export const GROSS_KWP = 100; // über 100 kWp: sonstige Direktvermarktung statt Anschlussvergütung

export const DEFAULTS = {
  jahre: 10, // Betrachtungszeitraum
  zins: 0.04, // Abzinsung für den Ertragswert
  degradation: 0.005, // Ertragsverlust je Jahr
  ue20Ct: 3.79, // Anschlussvergütung je kWh 2025 ohne intelligentes Messsystem: 4,508 − 0,715 = 3,793 ct (BSW-Solar); mit iMSys 4,15 ct
  dvEntgeltCt: 0.3, // Entgelt Direktvermarkter je kWh (große Anlagen)
  dvFixEuro: 600, // Fernsteuerung, Messung, Vertrag je Jahr (große Anlagen)
  umruestEuro: 900, // Umbau auf Eigenverbrauch einmalig (Zählerschrank, Elektriker)
  messEuro: 40, // Mehrkosten Messstellenbetrieb je Jahr
  speicherEuroKwh: 650, // Speicher je kWh installiert
  speicherZyklen: 250, // genutzte Vollzyklen je Jahr
  wrEuroKw: 220, // Wechselrichtertausch je kW, kleine Anlagen
  wrEuroKwGross: 80, // je kW über 100 kWp
  wrMinEuro: 1200,
  neuEuroKwp: 1100, // Neuanlage je kWp, klein
  neuEuroKwpGross: 750, // Neuanlage je kWp, über 100 kWp
  neuErtrag: 950, // kWh je kWp und Jahr
  neuJahre: 20, // eine neue Anlage rechnen wir über 20 Jahre
  neuFaktor: 1.7, // gleiche Fläche, heutige Module leisten etwa so viel mehr
  neuEinspeisungCt: 5.2, // laut Regierungsentwurf EEG 2027, 36 Monate
  neuEinspeisungJahre: 3,
  neuEinspeisungGrossCt: 5.9 // Erlös je kWh große Neuanlage (Annahme, Rechtslage 2027 offen)
};

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Eigenverbrauchsanteil an der Erzeugung ohne Speicher, abhängig vom Verhältnis Erzeugung zu Verbrauch. */
export function evAnteilOhneSpeicher(erzeugung, verbrauch, gewerbe) {
  if (!verbrauch || !erzeugung) return 0;
  const r = erzeugung / verbrauch;
  // Haushalt: bei Erzeugung = Verbrauch etwa 30 %. Gewerbe mit Tagesverbrauch: etwa 50 %.
  const basis = gewerbe ? 0.5 : 0.3;
  return clamp(basis / Math.max(r, basis), 0, 0.9);
}

/** Eingaben vervollständigen und plausibilisieren. */
export function normalisiere(e) {
  const kwp = Math.max(0.5, Number(e.kwp) || 0);
  const gross = kwp > GROSS_KWP;
  const gewerbe = e.gewerbe ?? kwp > 30;
  const ertragJahr = Number(e.ertragJahr) > 0 ? Number(e.ertragJahr) : kwp * (Number(e.ertragKwp) || 850);
  return {
    kwp,
    gross,
    gewerbe,
    ertragJahr,
    verbrauch: Math.max(0, Number(e.verbrauch) || 0),
    strompreisCt: Number(e.strompreisCt) > 0 ? Number(e.strompreisCt) : gewerbe ? 25 : 37,
    wrOriginal: e.wrOriginal ?? true,
    speicherKwh: e.speicherKwh != null ? Math.max(0, Number(e.speicherKwh)) : null,
    a: { ...DEFAULTS, ...(e.annahmen || {}) }
  };
}

const barwert = (zahlungen, zins) => zahlungen.reduce((s, z, i) => s + z / (1 + zins) ** (i + 1), 0);

function wrKosten(n) {
  return n.wrOriginal ? Math.max(n.a.wrMinEuro, n.kwp * (n.gross ? n.a.wrEuroKwGross : n.a.wrEuroKw)) : 0;
}

/** Erlös je eingespeister kWh für die Altanlage. */
function einspeiseCt(n) {
  return n.gross ? n.a.ue20Ct - n.a.dvEntgeltCt : n.a.ue20Ct;
}

function jahresreihe(n, proJahr, jahre = n.a.jahre) {
  const out = [];
  for (let j = 0; j < jahre; j++) out.push(proJahr(j, (1 - n.a.degradation) ** j));
  return out;
}

function ergebnis(id, titel, n, investition, reihe, extra = {}) {
  const summe = reihe.reduce((s, x) => s + x, 0) - investition;
  const wert = barwert(reihe, n.a.zins) - investition;
  let kum = -investition;
  let amort = investition > 0 ? null : 0;
  reihe.forEach((x, i) => {
    kum += x;
    if (amort === null && kum >= 0) amort = i + 1;
  });
  return { id, titel, investition, jahr1: reihe[0], summe, wert, amortisation: amort, jahre: reihe.length, ...extra };
}

export function bewerte(eingabe) {
  const n = normalisiere(eingabe);
  const preis = n.strompreisCt / 100;
  const ein = einspeiseCt(n) / 100;
  const fix = n.gross ? n.a.dvFixEuro : 0;
  const wr = wrKosten(n);
  const optionen = [];

  // A) Weiter einspeisen wie bisher
  optionen.push(
    ergebnis('weiter', n.gross ? 'Weiter einspeisen über Direktvermarkter' : 'Weiter einspeisen wie bisher', n, wr,
      jahresreihe(n, (j, f) => n.ertragJahr * f * ein - fix),
      { text: n.gross ? 'Sonstige Direktvermarktung zum Marktwert, abzüglich Entgelt und Fixkosten.' : 'Nichts ändern. Der Netzbetreiber zahlt den Jahresmarktwert Solar abzüglich Vermarktungskosten.' })
  );

  // B) Eigenverbrauch
  const ev = evAnteilOhneSpeicher(n.ertragJahr, n.verbrauch, n.gewerbe);
  optionen.push(
    ergebnis('eigen', 'Auf Eigenverbrauch umstellen', n, wr + n.a.umruestEuro,
      jahresreihe(n, (j, f) => {
        const erz = n.ertragJahr * f;
        const selbst = Math.min(erz * ev, n.verbrauch);
        return selbst * preis + (erz - selbst) * ein - fix - n.a.messEuro;
      }),
      { evAnteil: ev, text: 'Strom selbst nutzen, Überschuss weiter einspeisen. Jede selbst genutzte kWh spart den vollen Strompreis.' })
  );

  // C) Eigenverbrauch + Speicher
  const kap = n.speicherKwh ?? clamp(Math.round(n.verbrauch / 1000), 0, n.gewerbe ? 500 : 15);
  if (kap > 0 && n.verbrauch > 0) {
    optionen.push(
      ergebnis('speicher', `Eigenverbrauch mit ${kap} kWh Speicher`, n, wr + n.a.umruestEuro + kap * n.a.speicherEuroKwh,
        jahresreihe(n, (j, f) => {
          const erz = n.ertragJahr * f;
          const direkt = Math.min(erz * ev, n.verbrauch);
          const ueber = erz - direkt;
          const zusatz = Math.min(kap * n.a.speicherZyklen * 0.9, ueber, n.verbrauch - direkt);
          return (direkt + zusatz) * preis + (ueber - zusatz / 0.9) * ein - fix - n.a.messEuro;
        }),
        { speicherKwh: kap, text: 'Mittagsstrom für den Abend speichern. Lohnt sich vor allem bei hohem Verbrauch am Abend.' })
    );
  }

  // D) Neue Anlage auf derselben Fläche
  const neuKwp = Math.round(n.kwp * n.a.neuFaktor * 10) / 10;
  const neuGross = neuKwp > GROSS_KWP;
  const neuInv = neuKwp * (neuGross ? n.a.neuEuroKwpGross : n.a.neuEuroKwp);
  const neuEv = evAnteilOhneSpeicher(neuKwp * n.a.neuErtrag, n.verbrauch, n.gewerbe);
  optionen.push(
    ergebnis('neu', `Neue Anlage mit ${neuKwp.toLocaleString('de-DE')} kWp`, n, neuInv,
      jahresreihe(n, (j, f) => {
        const erz = neuKwp * n.a.neuErtrag * (1 - n.a.degradation) ** j;
        const selbst = Math.min(erz * neuEv, n.verbrauch);
        const ct = neuGross ? n.a.neuEinspeisungGrossCt - n.a.dvEntgeltCt : j < n.a.neuEinspeisungJahre ? n.a.neuEinspeisungCt : n.a.ue20Ct;
        return selbst * preis + (erz - selbst) * (ct / 100) - (neuGross ? n.a.dvFixEuro : 0) - n.a.messEuro;
      }, n.a.neuJahre),
      { neuKwp, jahre: n.a.neuJahre, text: 'Alte Module abbauen, auf derselben Fläche neu bauen. Heutige Module bringen auf gleicher Fläche deutlich mehr Leistung.' })
  );

  const beste = optionen.reduce((b, o) => (o.wert > b.wert ? o : b), optionen[0]);
  return { eingabe: n, optionen, besteId: beste.id, anlagenwert: Math.max(0, optionen[0].wert) };
}
