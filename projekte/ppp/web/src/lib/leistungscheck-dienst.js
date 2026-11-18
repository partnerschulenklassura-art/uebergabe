// Holt im Hintergrund, was der Leistungscheck braucht: Standort, Sonne (PVGIS), Wetter (DWD), Umgebung (OpenStreetMap).
// Jeder Schritt darf scheitern; dann rechnet der Rechenkern mit Annahmen und das Ergebnis sagt, was gefehlt hat.

const API = '/api/leistungscheck';

async function hole(pfad, params, ms = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${API}/${pfad}?${new URLSearchParams(params)}`, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    const daten = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(daten.fehler || daten.error || `Fehler ${r.status}`);
    return daten;
  } finally {
    clearTimeout(t);
  }
}

/** Die letzten zwölf abgeschlossenen Monate, vom Monat vor `heute` an rückwärts. */
export function zeitraum(heute = new Date(), versatz = 1) {
  const bis = new Date(heute.getFullYear(), heute.getMonth() - versatz, 1);
  const von = new Date(bis.getFullYear(), bis.getMonth() - 11, 1);
  const f = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { von: f(von), bis: f(bis) };
}

export const AUSRICHTUNG = {
  sued: { titel: 'Süd', felder: [0] },
  suedost: { titel: 'Südost', felder: [-45] },
  suedwest: { titel: 'Südwest', felder: [45] },
  ostwest: { titel: 'Ost und West', felder: [-90, 90] },
  ost: { titel: 'Ost', felder: [-90] },
  west: { titel: 'West', felder: [90] },
  nord: { titel: 'Nord', felder: [180] }
};

const zahlK = v => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

/** Detailerfassung (Module, Wechselrichter mit Strings, Kabel) in die Felder des Rechenkerns übersetzen. Leere Zeilen fallen weg. */
export function komponentenAusFormular(k) {
  if (!k) return {};
  const module = (k.module || [])
    .filter(m => zahlK(m.wp) && zahlK(m.anzahl))
    .map(m => ({
      hersteller: m.hersteller || undefined,
      modell: m.modell || undefined,
      typ: m.typ || 'mono',
      wp: zahlK(m.wp),
      anzahl: zahlK(m.anzahl),
      uoc: zahlK(m.uoc) ?? undefined,
      vmpp: zahlK(m.vmpp) ?? undefined,
      impp: zahlK(m.impp) ?? undefined,
      tkUoc: zahlK(m.tkUoc) ?? undefined
    }));
  const wechselrichter = (k.wechselrichter || [])
    .filter(w => zahlK(w.kwAC))
    .map(w => ({
      hersteller: w.hersteller || undefined,
      typ: w.typ || undefined,
      kwAC: zahlK(w.kwAC),
      anzahl: zahlK(w.anzahl) || 1,
      umaxDC: zahlK(w.umaxDC) ?? undefined,
      mppMin: zahlK(w.mppMin) ?? undefined,
      mppMax: zahlK(w.mppMax) ?? undefined,
      strings: zahlK(w.moduleJeString) ? [{ modul: Number(w.modul) || 0, moduleJeString: zahlK(w.moduleJeString), anzahl: zahlK(w.stringAnzahl) || 1 }] : []
    }));
  const kabel = (k.kabel || []).filter(x => zahlK(x.querschnitt) && zahlK(x.laenge));
  const ab = x => ({ name: x.name || undefined, querschnitt: zahlK(x.querschnitt), laenge: zahlK(x.laenge), material: x.material === 'al' ? 'al' : 'cu', kabeltyp: x.kabeltyp || undefined });
  const aus = {};
  if (module.length) aus.module = module;
  if (wechselrichter.length) aus.wechselrichter = wechselrichter;
  const dc = kabel.filter(x => x.seite === 'dc').map(ab);
  const ac = kabel.filter(x => x.seite !== 'dc').map(ab);
  if (dc.length) aus.dc = dc;
  if (ac.length) aus.ac = ac;
  if (k.steckverbinderMischung) aus.steckverbinder = { mischung: true };
  return aus;
}

/** Aus dem kleinen Formular die Eingabe für den Rechenkern bauen. */
export function eingabeAusFormular(f) {
  const kwp = Number(String(f.kwp).replace(',', '.')) || 0;
  const richtungen = AUSRICHTUNG[f.ausrichtung]?.felder || [0];
  const neigung = Number(f.neigung) || (f.art === 'frei' ? 20 : 30);
  const zahl = v => (v === '' || v == null ? null : Number(String(v).replace(/\./g, '').replace(',', '.')));
  const kwh = zahl(f.ertrag);
  return {
    kwp,
    art: f.art,
    inbetriebnahme: { jahr: Number(f.jahr), monat: 6 },
    felder: richtungen.map((azimut, i) => ({
      name: richtungen.length > 1 ? (azimut < 0 ? 'Ostseite' : 'Westseite') : `Fläche ${i + 1}`,
      kwp: kwp / richtungen.length,
      azimut,
      neigung,
      aufgestaendert: f.art === 'frei'
    })),
    ist: {
      [f.quelle === 'wechselrichter' ? 'wechselrichterKwh' : 'zaehlerKwh']: kwh,
      ...(zahl(f.wrErtrag) != null ? { wechselrichterKwh: zahl(f.wrErtrag) } : {}),
      verlauf: f.verlauf || undefined,
      meldung: f.meldung ? 'ja' : 'nein',
      isolationsfehler: f.meldung === 'isolation',
      abschaltungenNetzspannung: f.meldung === 'netz',
      tageSeitReinigung: f.reinigung === 'jahr' ? 200 : f.reinigung === 'kuerzlich' ? 60 : null
    },
    ...komponentenAusFormular(f.komponenten),
    eegCt: zahl(f.eegCt) ?? undefined,
    evAnteil: zahl(f.evAnteil) ?? undefined,
    stichjahr: new Date().getFullYear()
  };
}

/**
 * Alles im Hintergrund ermitteln. `melde(schritt, status, text)` meldet den Fortschritt.
 * Ergebnis: Eingabe für den Rechenkern, ergänzt um Standort, PVGIS je Fläche, Wetter und Umgebung, plus `luecken`.
 */
export async function ermittle(formular, melde = () => {}) {
  const e = eingabeAusFormular(formular);
  const luecken = [];

  melde('ort', 'laeuft', 'Standort suchen');
  let ort = null;
  try {
    ort = await hole('ort', { q: formular.adresse }, 20000);
    e.standort = { ort: ort.name || formular.adresse, breite: ort.lat, laenge: ort.lon };
    melde('ort', 'fertig', ort.name || 'Standort gefunden');
  } catch (err) {
    luecken.push('Standort nicht gefunden, gerechnet wird mit Westsachsen.');
    melde('ort', 'fehlt', 'Standort nicht gefunden');
  }

  melde('sonne', 'laeuft', 'Sonne an diesem Ort berechnen (PVGIS)');
  if (ort) {
    try {
      const je = await Promise.all(
        e.felder.map(fl => hole('referenz', { lat: ort.lat, lon: ort.lon, azimut: fl.azimut, neigung: fl.neigung, aufgestaendert: fl.aufgestaendert ? 1 : 0 }, 30000))
      );
      e.felder = e.felder.map((fl, i) => ({ ...fl, pvgisKwhKwp: je[i].referenzKwhKwp }));
      const monate = Array.from({ length: 12 }, (_, m) => je.reduce((s, r, i) => s + (r.monate?.[m] || 0) * e.felder[i].kwp, 0) / (e.kwp || 1));
      e.wetter = { ...(e.wetter || {}), referenzMonate: monate };
      melde('sonne', 'fertig', `${Math.round(je.reduce((s, r, i) => s + r.referenzKwhKwp * e.felder[i].kwp, 0) / (e.kwp || 1)).toLocaleString('de-DE')} kWh je kWp im langjährigen Mittel`);
    } catch {
      luecken.push('PVGIS nicht erreichbar, Soll aus Durchschnittswerten.');
      melde('sonne', 'fehlt', 'PVGIS nicht erreichbar');
    }
  } else melde('sonne', 'fehlt', 'ohne Standort übersprungen');

  melde('wetter', 'laeuft', 'Wetter der letzten zwölf Monate (DWD)');
  if (ort) {
    let ok = false;
    for (const versatz of [1, 2]) {
      try {
        const w = await hole('wetter', { lat: ort.lat, lon: ort.lon, ...zeitraum(new Date(), versatz) }, 60000);
        e.wetter = { ...(e.wetter || {}), monate: w.monate, zeitraumFaktor: w.zeitraumFaktor };
        const pz = Math.round((w.zeitraumFaktor - 1) * 100);
        melde('wetter', 'fertig', pz === 0 ? 'so sonnig wie im Mittel' : `${Math.abs(pz)} % ${pz > 0 ? 'sonniger' : 'trüber'} als im Mittel`);
        ok = true;
        break;
      } catch {
        /* nächster Versuch einen Monat früher, falls der letzte Monat noch nicht veröffentlicht ist */
      }
    }
    if (!ok) {
      luecken.push('Wetterdaten nicht verfügbar, gerechnet wird mit einem Durchschnittsjahr.');
      melde('wetter', 'fehlt', 'nicht verfügbar');
    }
  } else melde('wetter', 'fehlt', 'ohne Standort übersprungen');

  melde('umgebung', 'laeuft', 'Umgebung prüfen (OpenStreetMap)');
  if (ort) {
    try {
      const u = await hole('umgebung', { lat: ort.lat, lon: ort.lon }, 60000);
      e.umgebung = Array.isArray(u) ? u : u.quellen || [];
      melde('umgebung', 'fertig', e.umgebung.length ? `${e.umgebung.length} mögliche Verschmutzer in der Nähe` : 'keine Verschmutzer in der Nähe');
    } catch {
      luecken.push('Umgebung nicht geprüft, Verschmutzung nur aus Ihren Angaben.');
      melde('umgebung', 'fehlt', 'nicht verfügbar');
    }
  } else melde('umgebung', 'fehlt', 'ohne Standort übersprungen');

  return { eingabe: e, luecken };
}

/**
 * Bauteile für den Prüfauftrag an PV-Monteur (Vertrag Fassung 2, Abschnitt 5).
 * Werte außerhalb der Grenzen werden weggelassen statt abgelehnt; Texte auf 80 Zeichen gekürzt.
 * Gibt null zurück, wenn nichts angegeben ist.
 */
export function komponentenFuerAuftrag(k) {
  const e = komponentenAusFormular(k);
  const txt = t => (t ? String(t).trim().slice(0, 80) || undefined : undefined);
  const ganz = v => (v != null && Number.isInteger(v) ? v : undefined);
  const im = (v, min, max) => (v != null && Number.isFinite(v) && v >= min && v <= max ? v : undefined);
  const TYP = { mono: 'mono', poly: 'poly', duennschicht: 'duenn' };
  const KABEL = { solarkabel: 'solar', NYY: 'nyy', NYM: 'nym', NAYY: 'nyy', andere: 'sonstig' };
  const module = (e.module || []).slice(0, 20).map(m => ({
    hersteller: txt(m.hersteller), modell: txt(m.modell), typ: TYP[m.typ] || 'unbekannt',
    wp: im(m.wp, 1, 1000), anzahl: ganz(im(m.anzahl, 1, 100000)),
    uoc: im(m.uoc, 1, 200), vmpp: im(m.vmpp, 1, 200), impp: im(m.impp, 0.1, 30), tk_uoc: im(m.tkUoc, -1, 0)
  }));
  const wechselrichter = (e.wechselrichter || []).slice(0, 20).map(w => {
    let mpp_min = im(w.mppMin, 0, 2000), mpp_max = im(w.mppMax, 0, 2000);
    if (mpp_min != null && mpp_max != null && mpp_min >= mpp_max) mpp_min = mpp_max = undefined;
    return {
      hersteller: txt(w.hersteller), modell: txt(w.typ), kw_ac: im(w.kwAC, 0.1, 10000), anzahl: ganz(im(w.anzahl, 1, 100000)),
      umax_dc: im(w.umaxDC, 50, 2000), mpp_min, mpp_max,
      strings: (w.strings || []).filter(s => (s.modul | 0) >= 0 && (s.modul | 0) < module.length).slice(0, 20).map(s => ({ modul_index: s.modul | 0, module_je_string: ganz(im(s.moduleJeString, 1, 100)), anzahl: ganz(im(s.anzahl, 1, 100000)) }))
    };
  });
  const kab = seite => x => ({
    seite, bezeichnung: txt(x.name), querschnitt_mm2: im(x.querschnitt, 0.5, 1000), laenge_m: im(x.laenge, 0.1, 5000),
    leiter: x.material === 'al' ? 'al' : 'cu', kabeltyp: KABEL[x.kabeltyp] || 'unbekannt'
  });
  const kabel = [...(e.dc || []).map(kab('dc')), ...(e.ac || []).map(kab('ac'))].slice(0, 20);
  const gemischt = !!e.steckverbinder?.mischung;
  if (!module.length && !wechselrichter.length && !kabel.length && !gemischt) return null;
  return JSON.parse(JSON.stringify({ herkunft: 'eigentuemer', module, wechselrichter, kabel, steckverbinder_gemischt: gemischt }));
}
