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
