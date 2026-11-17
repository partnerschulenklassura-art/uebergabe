// Was die Anlage heute bekommt, was sie mit Stromverkauf über EID bekommen könnte, und ob sie liefert, was sie soll.
// Mehrerlös-Logik wie im Nachbarwatt-Rechner (02_Stromvermarktung/A_.../public/calc.js), damit beide gleich rechnen:
//   ausgeförderte Anlagen: Mehrerlös je verkaufter kWh = Verkaufspreis − Anschlussvergütung
//   EEG-Anlagen:           Mehrerlös je verkaufter kWh = Verkaufspreis − Marktwert Solar + 0,4 ct (§ 53 EEG)
// Alle Werte vor Gebühren. Rechtliche Prüfung der Stromgemeinschaft offen (00_Leitstand/OFFENE-PUNKTE.md, Punkt 7).

export const MEHR = {
  marktwertCt: 4.508, // Jahresmarktwert Solar 2025 (Übertragungsnetzbetreiber)
  ue20Ct: 3.793, // Anschlussvergütung 2025 ohne iMSys: 4,508 − 0,715 (BSW-Solar)
  abschlagCt: 0.4, // § 53 EEG
  dvEntgeltCt: 0.3, // Direktvermarktung über 100 kWp (Annahme)
  preisMin: 4,
  preisMax: 12,
  preisStart: 9.5, // wie Nachbarwatt
  anteilStart: 0.5, // wie Nachbarwatt
  mindestKwh: 5000, // darunter fressen Zähler- und Abwicklungskosten den Mehrerlös meist auf
  letztesEegJahr: 2026, // ab 2027 keine feste Vergütung für neue Anlagen (laut Regierungsentwurf)
  refKwhKwp: 950, // mittlere Jahreserzeugung je kWp (FfE-Annahme), regional etwa ±10 %
  degradation: 0.005
};

// Ertragsfaktor je Ausrichtung bei üblicher Dachneigung (Annahme)
export const AUSRICHTUNG = {
  sued: { titel: 'Süd', faktor: 1 },
  suedost: { titel: 'Südost oder Südwest', faktor: 0.95 },
  ostwest: { titel: 'Ost oder West', faktor: 0.85 },
  flach: { titel: 'Flachdach, aufgeständert', faktor: 0.95 },
  nord: { titel: 'Nord', faktor: 0.6 }
};

// Neigung und Verschattung (Annahme, auf der Seite offen genannt)
export const NEIGUNG = {
  normal: { titel: '25 bis 40 Grad', faktor: 1 },
  flach: { titel: 'flach, unter 15 Grad', faktor: 0.92 },
  steil: { titel: 'steil, über 50 Grad', faktor: 0.9 }
};
export const VERSCHATTUNG = {
  keine: { titel: 'keine', faktor: 1 },
  leicht: { titel: 'leicht (Gaube, Schornstein, Baum)', faktor: 0.93 },
  stark: { titel: 'stark (Nachbarhaus, Bäume mittags)', faktor: 0.8 }
};

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/**
 * Vergütung heute. a: { kwp, foerderEnde, eegCt|null, ertragJahr, evAnteil (0–1), stichjahr }
 */
export function heute(a) {
  const einspeisung = a.ertragJahr * (1 - (a.evAnteil || 0));
  const gross = a.kwp > 100;
  const eegLaeuft = a.foerderEnde > a.stichjahr;
  let art, ct;
  if (eegLaeuft) {
    art = 'eeg';
    ct = a.eegCt; // null = unbekannt
  } else {
    art = gross ? 'dv' : 'ue20';
    ct = gross ? MEHR.marktwertCt - MEHR.dvEntgeltCt : MEHR.ue20Ct;
  }
  return { art, ct, einspeisung, euroJahr: ct == null ? null : (einspeisung * ct) / 100, eegLaeuft };
}

/**
 * Mehrerlös mit Stromverkauf über EID. h = Ergebnis von heute(); o = { preisCt, anteil, gewerblich, baujahr }
 */
export function mitEid(h, o) {
  const preis = clamp(Number(o.preisCt) || MEHR.preisStart, MEHR.preisMin, MEHR.preisMax);
  const anteil = clamp(Number(o.anteil ?? MEHR.anteilStart), 0, 1);
  if (o.baujahr > MEHR.letztesEegJahr) return { moeglich: false, grund: 'neuanlage' };
  const ausgefoerdert = !h.eegLaeuft;
  const basis = ausgefoerdert ? h.ct : MEHR.marktwertCt - MEHR.abschlagCt;
  const extraCt = preis - basis;
  const kwh = h.einspeisung * anteil;
  const extraEuro = (kwh * extraCt) / 100;
  return {
    moeglich: true,
    modell: o.gewerblich ? 'liefer' : 'gemeinschaft', // § 42c nur für nicht gewerblich betriebene Anlagen
    preis,
    anteil,
    extraCt,
    kwh,
    extraEuro,
    unterMindest: h.einspeisung < MEHR.mindestKwh,
    neuEuroJahr: h.euroJahr == null ? null : h.euroJahr + extraEuro,
    plusProzent: h.euroJahr ? extraEuro / h.euroJahr : null
  };
}

/**
 * Performance: Ist gegen Soll. Ist kommt aus dem Ertrag (kWh) oder aus der Vergütung laut Abrechnung (€/Jahr),
 * die über den Satz und den Eigenverbrauchsanteil in kWh zurückgerechnet wird.
 * a: { kwp, alter, ertragIst, erloesIst, ct, evAnteil, ausrichtung, neigung, verschattung }
 */
export function leistung(a) {
  const f =
    (AUSRICHTUNG[a.ausrichtung] || AUSRICHTUNG.sued).faktor *
    (NEIGUNG[a.neigung] || NEIGUNG.normal).faktor *
    (VERSCHATTUNG[a.verschattung] || VERSCHATTUNG.keine).faktor;
  const soll = a.kwp * MEHR.refKwhKwp * f * (1 - MEHR.degradation) ** a.alter;
  const ev = clamp(a.evAnteil || 0, 0, 0.95);
  let ist = a.ertragIst > 0 ? a.ertragIst : null;
  let quelle = ist ? 'ertrag' : null;
  if (!ist && a.erloesIst > 0 && a.ct > 0) {
    ist = (a.erloesIst / (a.ct / 100)) / (1 - ev);
    quelle = 'erloes';
  }
  const sollEuro = a.ct == null ? null : (soll * (1 - ev) * a.ct) / 100;
  if (!ist) return { soll, sollEuro, faktor: f, bekannt: false };
  const performance = ist / soll;
  const abw = performance - 1;
  const stufe = abw >= -0.05 ? 'gut' : abw >= -0.15 ? 'auffaellig' : 'schlecht';
  const fehltKwh = Math.max(0, soll - ist);
  return {
    soll,
    sollEuro,
    faktor: f,
    bekannt: true,
    quelle,
    ist,
    performance,
    abw,
    stufe,
    fehltKwh,
    // entgangene Vergütung auf den eingespeisten Teil; der fehlende Eigenverbrauch kostet zusätzlich Strombezug
    fehltEuro: a.ct == null ? null : (fehltKwh * (1 - ev) * a.ct) / 100,
    istKwhKwp: ist / a.kwp,
    sollKwhKwp: soll / a.kwp
  };
}

// ---------------------------------------------------------------------------
// Fehlersuche: wahrscheinliche Ursachen einer schwachen Leistung, nach Hinweisen gewichtet.
// Keine Diagnose – eine Reihenfolge für das Gespräch und die Prüfung vor Ort.

export const VERLAUF = {
  unbekannt: 'weiß ich nicht',
  ploetzlich: 'plötzlich gesunken',
  schleichend: 'über Jahre weniger geworden',
  immer: 'war schon immer zu wenig'
};

export const MELDUNG = {
  unbekannt: 'weiß ich nicht',
  ja: 'ja, Fehler oder rote Lampe',
  nein: 'nein, alles grün'
};

export const URSACHEN = {
  wechselrichter: {
    titel: 'Wechselrichter',
    text: 'Abschaltungen, Isolationsfehler oder Drosselung bei Hitze. Wechselrichter halten meist 10 bis 15 Jahre.',
    pruefung: 'Fehlerspeicher auslesen, Isolationswiderstand messen, Lüfter und Temperatur prüfen.'
  },
  string: {
    titel: 'Ausgefallener String',
    text: 'Eine Sicherung, ein Stecker oder ein Kabel unterbricht eine ganze Modulreihe. Dann fehlt schnell ein Viertel bis die Hälfte.',
    pruefung: 'Leerlaufspannung und Kurzschlussstrom je String messen und vergleichen.'
  },
  module: {
    titel: 'Module',
    text: 'Zellbrüche nach Hagel oder Schneelast, Hotspots, PID-Effekt oder stärkere Alterung als üblich.',
    pruefung: 'Sichtprüfung, Stringwerte vergleichen, bei Verdacht Wärmebild und Kennlinienmessung.'
  },
  verschmutzung: {
    titel: 'Verschmutzung',
    text: 'Staub, Laub, Moos oder Vogelkot, vor allem bei flachen Modulen und in der Nähe von Landwirtschaft.',
    pruefung: 'Sichtprüfung, Vergleich vor und nach einer Teilreinigung.'
  },
  verschattung: {
    titel: 'Neue Verschattung',
    text: 'Gewachsene Bäume, ein Anbau oder Nachbarhaus. Schon ein beschattetes Modul kann einen ganzen String bremsen.',
    pruefung: 'Verschattung über den Tag aufnehmen, Stringaufteilung prüfen.'
  },
  abregelung: {
    titel: 'Abregelung',
    text: 'Feste Einspeisegrenze (oft 70 %), Steuerung durch den Netzbetreiber oder zu hohe Netzspannung, bei der der Wechselrichter abschaltet.',
    pruefung: 'Einstellungen des Wechselrichters und Netzspannung zur Mittagszeit prüfen.'
  },
  messung: {
    titel: 'Messung oder Abrechnung',
    text: 'Falscher Zählerstand, falscher Wandlerfaktor oder ein Abrechnungsfehler. Dann liefert die Anlage, wird aber nicht voll bezahlt.',
    pruefung: 'Zähler, Wechselrichter-Zähler und Abrechnung gegeneinander abgleichen.'
  }
};

/**
 * Ursachen nach Wahrscheinlichkeit sortiert.
 * h: { performance, verlauf, meldung, alter, wrAlter, kwp, jahr, verschattung, neigung }
 * Gibt [{ id, titel, text, pruefung, punkte }] zurück, höchste Punktzahl zuerst.
 */
export function ursachen(h) {
  const p = h.performance ?? 1;
  const tief = p < 0.8; // eher Ausfall als Verschleiß
  const pkt = { wechselrichter: 2, string: 2, module: 2, verschmutzung: 2, verschattung: 1, abregelung: 1, messung: 1 };

  if (tief) { pkt.wechselrichter += 2; pkt.string += 3; }
  else { pkt.verschmutzung += 2; pkt.module += 1; pkt.verschattung += 1; }

  if (h.meldung === 'ja') pkt.wechselrichter += 4;
  if (h.meldung === 'nein') pkt.wechselrichter -= 1;

  if (h.verlauf === 'ploetzlich') { pkt.wechselrichter += 2; pkt.string += 3; pkt.abregelung += 1; pkt.verschmutzung -= 1; }
  if (h.verlauf === 'schleichend') { pkt.verschmutzung += 2; pkt.module += 2; pkt.verschattung += 2; pkt.string -= 1; }
  if (h.verlauf === 'immer') { pkt.abregelung += 3; pkt.messung += 3; pkt.verschattung += 1; pkt.wechselrichter -= 1; pkt.string -= 1; }

  if ((h.wrAlter ?? 0) >= 10) pkt.wechselrichter += 2;
  if ((h.alter ?? 0) >= 12) pkt.module += 1;
  if (h.neigung === 'flach') pkt.verschmutzung += 1;
  if (h.verschattung && h.verschattung !== 'keine') pkt.verschattung += 1;
  // 70-%-Regel: kleine Anlagen von 2012 bis 2022 ohne Steuerung
  if (h.kwp <= 25 && h.jahr >= 2012 && h.jahr <= 2022) pkt.abregelung += 1;
  if (h.kwp > 100) pkt.messung += 1; // Wandlermessung

  return Object.entries(pkt)
    .map(([id, punkte]) => ({ id, ...URSACHEN[id], punkte }))
    .sort((x, y) => y.punkte - x.punkte);
}
