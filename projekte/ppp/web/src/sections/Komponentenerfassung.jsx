// Detailerfassung für den Leistungscheck: Module, Wechselrichter mit Strings, Kabel.
// Alles optional; leere Zeilen werden beim Rechnen ignoriert.

const LEER = {
  module: { hersteller: '', modell: '', typ: 'mono', wp: '', anzahl: '', uoc: '', vmpp: '', impp: '', tkUoc: '' },
  wechselrichter: { hersteller: '', typ: '', kwAC: '', anzahl: '1', umaxDC: '', mppMin: '', mppMax: '', modul: '0', moduleJeString: '', stringAnzahl: '' },
  kabel: { seite: 'ac', name: '', querschnitt: '', material: 'cu', laenge: '', kabeltyp: '' }
};

export const komponentenLeer = () => ({ module: [{ ...LEER.module }], wechselrichter: [{ ...LEER.wechselrichter }], kabel: [{ ...LEER.kabel }], steckverbinderMischung: false });

function Feld({ titel, wert, onChange, text, placeholder }) {
  return (
    <label>
      <span className="lbl text-[0.9rem]">{titel}</span>
      <input inputMode={text ? undefined : 'decimal'} placeholder={placeholder} value={wert} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

function Auswahl({ titel, wert, onChange, optionen }) {
  return (
    <label>
      <span className="lbl text-[0.9rem]">{titel}</span>
      <select value={wert} onChange={e => onChange(e.target.value)}>
        {optionen.map(([k, t]) => (
          <option key={k} value={k}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function Liste({ titel, art, k, setK, kopf, zeile }) {
  const liste = k[art];
  const aendere = (i, feld) => v => setK(x => ({ ...x, [art]: x[art].map((z, j) => (j === i ? { ...z, [feld]: v } : z)) }));
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-white/10 p-4">
      <legend className="px-1 font-display text-[1.15rem] font-semibold text-papier">{titel}</legend>
      {kopf}
      {liste.map((z, i) => (
        <div key={i} className="grid gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{zeile(z, feld => aendere(i, feld), i)}</div>
          {liste.length > 1 && (
            <button type="button" className="justify-self-start text-[0.9rem] text-papier/60 underline" onClick={() => setK(x => ({ ...x, [art]: x[art].filter((_, j) => j !== i) }))}>
              Zeile entfernen
            </button>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-line-light justify-self-start" onClick={() => setK(x => ({ ...x, [art]: [...x[art], { ...LEER[art] }] }))}>
        Weitere Zeile
      </button>
    </fieldset>
  );
}

export default function Komponentenerfassung({ k, setK }) {
  const modulOptionen = k.module.map((m, i) => [String(i), [m.hersteller, m.modell].filter(Boolean).join(' ') || `Modultyp ${i + 1}`]);
  return (
    <div className="grid gap-4">
      <p className="m-0 text-[0.95rem] text-papier/70">
        Alles freiwillig. Die Werte stehen auf dem Typenschild oder im Datenblatt. Je mehr Sie angeben, desto genauer prüft der Leistungscheck Planung, Strings und Kabel.
      </p>
      <Liste
        titel="Module"
        art="module"
        k={k}
        setK={setK}
        zeile={(z, f) => (
          <>
            <Feld titel="Hersteller" text="1" wert={z.hersteller} onChange={f('hersteller')} />
            <Feld titel="Modell" text="1" wert={z.modell} onChange={f('modell')} />
            <Feld titel="Leistung (Wp)" wert={z.wp} onChange={f('wp')} />
            <Feld titel="Anzahl" wert={z.anzahl} onChange={f('anzahl')} />
            <Auswahl titel="Technik" wert={z.typ} onChange={f('typ')} optionen={[['mono', 'Monokristallin'], ['poly', 'Polykristallin'], ['duennschicht', 'Dünnschicht']]} />
            <Feld titel="Leerlaufspannung Uoc (V)" wert={z.uoc} onChange={f('uoc')} />
            <Feld titel="MPP-Spannung (V)" wert={z.vmpp} onChange={f('vmpp')} />
            <Feld titel="MPP-Strom (A)" wert={z.impp} onChange={f('impp')} />
            <Feld titel="Temp.-Koeff. Uoc (%/K)" placeholder="-0,29" wert={z.tkUoc} onChange={f('tkUoc')} />
          </>
        )}
      />
      <Liste
        titel="Wechselrichter und Strings"
        art="wechselrichter"
        k={k}
        setK={setK}
        zeile={(z, f) => (
          <>
            <Feld titel="Hersteller" text="1" wert={z.hersteller} onChange={f('hersteller')} />
            <Feld titel="Typ" text="1" wert={z.typ} onChange={f('typ')} />
            <Feld titel="Leistung AC (kW)" wert={z.kwAC} onChange={f('kwAC')} />
            <Feld titel="Anzahl Geräte" wert={z.anzahl} onChange={f('anzahl')} />
            <Feld titel="max. DC-Spannung (V)" wert={z.umaxDC} onChange={f('umaxDC')} />
            <Feld titel="MPP-Bereich von (V)" wert={z.mppMin} onChange={f('mppMin')} />
            <Feld titel="MPP-Bereich bis (V)" wert={z.mppMax} onChange={f('mppMax')} />
            <Auswahl titel="Modultyp an diesem Gerät" wert={z.modul} onChange={f('modul')} optionen={modulOptionen} />
            <Feld titel="Module je String" wert={z.moduleJeString} onChange={f('moduleJeString')} />
            <Feld titel="Strings je Gerät" wert={z.stringAnzahl} onChange={f('stringAnzahl')} />
          </>
        )}
      />
      <Liste
        titel="Kabel"
        art="kabel"
        k={k}
        setK={setK}
        zeile={(z, f) => (
          <>
            <Auswahl titel="Seite" wert={z.seite} onChange={f('seite')} optionen={[['ac', 'AC (Wechselrichter bis Zähler)'], ['dc', 'DC (Stringleitung)']]} />
            <Feld titel="Bezeichnung" text="1" placeholder="z. B. WR bis Zählerschrank" wert={z.name} onChange={f('name')} />
            <Feld titel="Querschnitt (mm²)" wert={z.querschnitt} onChange={f('querschnitt')} />
            <Feld titel="Länge einfach (m)" wert={z.laenge} onChange={f('laenge')} />
            <Auswahl titel="Leiter" wert={z.material} onChange={f('material')} optionen={[['cu', 'Kupfer'], ['al', 'Aluminium']]} />
            <Auswahl
              titel="Kabeltyp"
              wert={z.kabeltyp}
              onChange={f('kabeltyp')}
              optionen={[['', 'weiß ich nicht'], ['solarkabel', 'Solarkabel (H1Z2Z2-K, PV1-F)'], ['NYY', 'NYY'], ['NYM', 'NYM'], ['NAYY', 'NAYY (Alu)'], ['andere', 'anderes']]}
            />
          </>
        )}
      />
      <label className="check">
        <input type="checkbox" checked={k.steckverbinderMischung} onChange={e => setK(x => ({ ...x, steckverbinderMischung: e.target.checked }))} />
        <span>Es stecken Steckverbinder verschiedener Hersteller ineinander (z. B. MC4 mit Nachbau).</span>
      </label>
    </div>
  );
}
