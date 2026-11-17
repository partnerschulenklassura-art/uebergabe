// Protokoll zum Leistungscheck: festes Gerüst, Prüfsumme über den Inhalt, druckbares HTML.
// Das Protokoll gibt nur wieder, was leistungscheck() gerechnet hat. Es enthält keine Messwerte;
// Messwerte stehen im Prüfprotokoll von PV-Monteur.

const kwh = v => (v == null ? '–' : `${Math.round(v).toLocaleString('de-DE')} kWh`);
const euro = v => (v == null ? '–' : `${Math.round(v).toLocaleString('de-DE')} €`);
const pz = (v, d = 0) => (v == null ? '–' : `${(v * 100).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d })} %`);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const STUFE = {
  gut: 'Die Anlage arbeitet wie sie soll.',
  auffaellig: 'Die Anlage liefert spürbar weniger, als sie soll.',
  schlecht: 'Die Anlage liefert deutlich zu wenig.'
};

/** Strukturiertes Protokoll aus dem Ergebnis von leistungscheck(). */
export function protokoll(r, meta = {}) {
  const n = r.eingabe;
  const z = r.zerlegung;
  const p = r.planung;
  return {
    art: 'Leistungscheck',
    version: 1,
    nummer: meta.nummer || null,
    erstellt: meta.erstellt || new Date().toISOString().slice(0, 10),
    anlage: {
      bezeichnung: n.bezeichnung || null,
      ort: n.standort?.ort || null,
      art: n.art === 'frei' ? 'Freifläche' : 'Dachanlage',
      kwp: n.kwp,
      kwAC: Math.round(n.kwAC * 10) / 10,
      inbetriebnahme: `${String(n.monat).padStart(2, '0')}/${n.jahr}`,
      alter: n.alter,
      flaechen: p.flaechen.map(f => ({ name: f.name || null, kwp: f.kwp, azimut: f.azimut, neigung: f.neigung, aufgestaendert: Boolean(f.aufgestaendert) }))
    },
    ergebnis: {
      ...(z.bekannt
        ? { stufe: z.stufe, satz: STUFE[z.stufe], performance: z.performance, gegenIdeal: z.gegenIdeal }
        : { stufe: 'unbekannt', satz: 'Ohne Ist-Werte ist nur das Soll berechnet.' }),
      planung: p.verlust > 0.05 ? `Gegenüber einer gut geplanten Anlage fehlen schon seit der Inbetriebnahme rund ${pz(p.verlust)} Ertrag, siehe Planung und Aufbau.` : null
    },
    ertrag: {
      quelle: r.ist.quelle,
      wetterFaktor: n.wetterFaktor,
      ideal: z.ideal,
      sollHeute: z.sollHeute,
      ist: z.ist ?? null,
      zerlegung: [
        ['Alterung laut Modulgarantie', z.alterung],
        ['Planung und Aufbau', z.planung],
        ...(z.bekannt ? [['AC-Seite, mehr als die Leitung erklärt', z.ac], ['Nicht erklärt', z.rest]] : [])
      ]
    },
    komponenten: {
      module: n.modultypen.map(m => ({ name: [m.hersteller, m.modell || m.name].filter(Boolean).join(' ') || 'Modul', technologie: m.typ, wp: m.wp, anzahl: m.anzahl })),
      wechselrichter: n.wr.map(w => ({ name: [w.hersteller, w.typ].filter(Boolean).join(' ') || 'Wechselrichter', kwAC: w.kwAC, anzahl: w.anzahl })),
      kabel: [
        ...p.dcLeitungen.map(l => ({ seite: 'DC', name: l.name, querschnitt: l.querschnitt, material: l.material, laenge: l.laenge, verlustAnteil: l.verlustAnteil })),
        ...p.leitungen.map(l => ({ seite: 'AC', name: l.name, querschnitt: l.querschnitt, material: l.material, laenge: l.laenge, verlustAnteil: l.verlustAnteil }))
      ]
    },
    planung: { befunde: p.befunde, dcAc: p.dcAc, acVerlustVolllast: p.acVolllast, spannungsfall: p.spannungsfall, leitungen: p.leitungen.map(l => ({ name: l.name, querschnitt: l.querschnitt, material: l.material, laenge: l.laenge, verlustAnteil: l.verlustAnteil, spannungsfall: l.spannungsfall })) },
    verschmutzung: { stufe: r.verschmutzung.stufe, quellen: r.verschmutzung.quellen.map(q => ({ titel: q.titel, abstand: q.abstand })) },
    ursachen: r.ursachen.slice(0, 3).map(u => ({ titel: u.titel, text: u.text })),
    massnahmen: r.massnahmen.map(m => m.text),
    vorOrt: r.vorOrt,
    wert: r.wert,
    hinweis:
      'Rechnung aus Angaben des Eigentümers, Datenblättern und Wetterdaten. Keine Messung. Wo eine Messung nötig ist, steht es oben; das Prüfprotokoll vor Ort wird mit PV-Monteur erstellt.'
  };
}

/** SHA-256 über den Inhalt ohne Prüfsumme, hex. Läuft im Browser und in Node 20+. */
export async function pruefsumme(pr) {
  const { pruefsumme: _, ...rest } = pr;
  const daten = new TextEncoder().encode(JSON.stringify(rest));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', daten);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function mitPruefsumme(pr) {
  return { ...pr, pruefsumme: await pruefsumme(pr) };
}

/** Druckbares HTML (A4), ohne externe Abhängigkeiten. */
export function alsHtml(pr) {
  const zeile = (k, v) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  const liste = xs => (xs.length ? `<ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>Keine.</p>');
  const a = pr.anlage;
  const e = pr.ertrag;
  const w = pr.wert;
  const v = pr.vorOrt;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Leistungscheck ${esc(pr.nummer || '')}</title>
<style>
@page{size:A4;margin:18mm}body{font:10.5pt/1.45 system-ui,sans-serif;color:#14202b;max-width:180mm;margin:auto}
h1{font-size:17pt;margin:0 0 2mm}h2{font-size:11.5pt;margin:7mm 0 2mm;border-bottom:1px solid #c9d1d8;padding-bottom:1mm}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:1.2mm 2mm;border-bottom:1px solid #e3e7eb;vertical-align:top}th{width:45%;font-weight:600}
.stufe{padding:3mm 4mm;border-left:4px solid #f2b705;background:#fbf6e6;margin:3mm 0}.stufe.schlecht{border-color:#c0392b;background:#fbeaea}.stufe.gut{border-color:#2e8b57;background:#e9f5ee}
.klein{font-size:8.5pt;color:#55636f}.summe{font-family:monospace;font-size:8pt;word-break:break-all}
</style></head><body>
<h1>Leistungscheck Ihrer Solaranlage</h1>
<p class="klein">PV Performance Pro – Energie-Netzwerk · Steinpöhlstraße 1, 08412 Werdau · Protokoll ${esc(pr.nummer || 'ohne Nummer')} vom ${esc(pr.erstellt.split('-').reverse().join('.'))}</p>
<div class="stufe ${esc(pr.ergebnis.stufe)}"><strong>${esc(pr.ergebnis.satz)}</strong>${pr.ergebnis.performance != null ? ` Sie liefert ${pz(pr.ergebnis.performance)} dessen, was sie so wie gebaut heute liefern muss.` : ''}${pr.ergebnis.planung ? `<br>${esc(pr.ergebnis.planung)}` : ''}</div>
<h2>Anlage</h2><table>
${zeile('Bezeichnung, Ort', [a.bezeichnung, a.ort].filter(Boolean).join(', ') || '–')}
${zeile('Art', a.art)}
${zeile('Leistung', `${a.kwp.toLocaleString('de-DE')} kWp, Wechselrichter ${a.kwAC.toLocaleString('de-DE')} kW`)}
${zeile('Inbetriebnahme, Alter', `${a.inbetriebnahme}, ${a.alter} Jahre`)}
${a.flaechen.map((f, i) => zeile(f.name || `Fläche ${i + 1}`, `${f.kwp.toLocaleString('de-DE')} kWp, Azimut ${f.azimut}°, Neigung ${f.neigung}°${f.aufgestaendert ? ', aufgeständert' : ''}`)).join('')}
</table>
${pr.komponenten.module.length || pr.komponenten.wechselrichter.length || pr.komponenten.kabel.length ? `<h2>Verbaute Komponenten</h2><table>
${pr.komponenten.module.map(m => zeile(`Module: ${m.name}`, `${m.anzahl} × ${m.wp} Wp, ${m.technologie}`)).join('')}
${pr.komponenten.wechselrichter.map(w => zeile(`Wechselrichter: ${w.name}`, `${w.anzahl} × ${w.kwAC.toLocaleString('de-DE')} kW`)).join('')}
${pr.komponenten.kabel.map(k => zeile(`${k.seite}-Kabel: ${k.name}`, `${k.querschnitt} mm² ${k.material === 'al' ? 'Aluminium' : 'Kupfer'}, ${k.laenge} m, Verlust bei Volllast ${pz(k.verlustAnteil, 1)}`)).join('')}
</table>` : ''}
<h2>Ertrag im Jahr</h2><table>
${zeile('Gut geplant, heute möglich', kwh(e.ideal))}
${zeile('So wie gebaut, heute Soll', kwh(e.sollHeute))}
${zeile(`Ist (${e.quelle === 'zaehler' ? 'Zähler' : e.quelle === 'wechselrichter' ? 'Wechselrichter' : 'keine Angabe'})`, kwh(e.ist))}
${e.wetterFaktor !== 1 ? zeile('Wetter im Zeitraum gegenüber Mittel', pz(e.wetterFaktor)) : ''}
${e.zerlegung.map(([k, x]) => zeile(`davon fehlt: ${k}`, kwh(x))).join('')}
</table>
<h2>Planung, Aufbau und Kabel</h2>${liste(pr.planung.befunde.map(b => b.text))}
<p class="klein">DC/AC-Verhältnis ${pr.planung.dcAc.toLocaleString('de-DE', { maximumFractionDigits: 2 })}${pr.planung.leitungen.length ? `, AC-Verlust bei Volllast ${pz(pr.planung.acVerlustVolllast, 1)}, Spannungsfall ${pz(pr.planung.spannungsfall, 1)}` : ''}.</p>
<h2>Umgebung und Verschmutzung</h2><p>Risiko ${esc(pr.verschmutzung.stufe)}${pr.verschmutzung.quellen.length ? `: ${esc(pr.verschmutzung.quellen.map(q => `${q.titel} (${q.abstand} m)`).join(', '))}` : ''}.</p>
<h2>Wahrscheinliche Ursachen</h2>${pr.ursachen.length ? `<ol>${pr.ursachen.map(u => `<li><strong>${esc(u.titel)}:</strong> ${esc(u.text)}</li>`).join('')}</ol>` : '<p>Ohne Ist-Werte keine Einschätzung.</p>'}
<h2>Das können Sie ohne Termin vor Ort tun</h2>${liste(pr.massnahmen)}
<h2>Prüfung vor Ort</h2>${v.noetig ? `<p><strong>${v.dringend ? 'Dringend empfohlen.' : 'Empfohlen.'}</strong></p>${liste(v.gruende)}<p>Geprüft wird:</p>${liste(v.pruefpunkte.map(x => `${x.ursache}: ${x.pruefung}`))}<p>Dafür brauchen wir von Ihnen:</p>${liste(v.eigentuemerLiefert)}` : '<p>Nach dieser Rechnung nicht nötig.</p>'}
<h2>Wert der Anlage</h2>${w ? `<table>
${zeile('Wert aus den Erträgen (Marktwert)', euro(w.marktwert))}
${zeile('Restwert der Komponenten (Zeitwert)', euro(w.restwert))}
${zeile('Marktwert, wenn die Anlage ihr Soll liefert', euro(w.marktwertBehoben))}
${zeile('Wertverlust durch Minderleistung', euro(w.wertverlust))}
${zeile('Restnutzungsdauer', `${w.restjahre} Jahre`)}
</table>` : '<p>Ohne Ist-Werte nicht berechnet.</p>'}
<p class="klein">${esc(pr.hinweis)}</p>
${pr.pruefsumme ? `<p class="klein">Prüfsumme (SHA-256): <span class="summe">${esc(pr.pruefsumme)}</span></p>` : ''}
</body></html>`;
}
