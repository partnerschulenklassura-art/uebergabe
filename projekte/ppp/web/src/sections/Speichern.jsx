import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { sceneImg } from '../lib/url.js';

const MODES = {
  gruen: {
    label: 'Grünspeicher',
    edges: ['pv-s', 's-use', 's-grid'],
    rows: [
      ['Lädt aus', 'nur aus der eigenen Solaranlage'],
      ['EEG-Förderung', 'bleibt für den zwischengespeicherten Strom erhalten'],
      ['Genehmigung', 'am bestehenden Anschluss der Anlage, meist am einfachsten'],
      ['Erlös', 'Mittagsstrom am Abend einspeisen oder selbst verbrauchen'],
      ['Geeignet für', 'Bestandsanlagen mit Platz am Netzanschluss']
    ]
  },
  grau: {
    label: 'Graustromspeicher',
    edges: ['grid-s', 's-grid', 's-use'],
    rows: [
      ['Lädt aus', 'dem öffentlichen Netz, wenn der Preis niedrig ist'],
      ['EEG-Förderung', 'keine, der Strom ist Graustrom'],
      ['Genehmigung', 'als eigenständiger Speicher eigene Baugenehmigung und Netzanschluss nötig'],
      ['Erlös', 'Preisunterschiede am Day-Ahead- und Intradaymarkt, Flexibilität'],
      ['Geeignet für', 'Standorte nah am Umspannwerk, Investoren']
    ]
  },
  misch: {
    label: 'Mischbetrieb',
    edges: ['pv-s', 'grid-s', 's-use', 's-grid'],
    rows: [
      ['Lädt aus', 'Solaranlage und Netz im selben Speicher'],
      ['EEG-Förderung', 'für den grünen Anteil, ermittelt per Abgrenzungs- oder Pauschaloption'],
      ['Genehmigung', 'bis 30. September 2027 nur mit Zustimmung von Netz- und Messstellenbetreiber'],
      ['Erlös', 'beides: eigener Solarstrom und günstiger Netzstrom für teure Stunden'],
      ['Geeignet für', 'Anlagen, deren Speicher sonst im Winter leer steht']
    ]
  }
};

const NODES = {
  pv: { x: 95, y: 70, label: 'Solaranlage', img: 'hof' },
  grid: { x: 95, y: 230, label: 'Netz (Einkauf)', img: 'mast' },
  s: { x: 330, y: 150, label: 'Speicher', img: 'speicher' },
  use: { x: 565, y: 70, label: 'Verbrauch vor Ort', img: 'haeuser' },
  out: { x: 565, y: 230, label: 'Netz (Verkauf)', img: 'mast' }
};
const EDGES = {
  'pv-s': ['pv', 's'],
  'grid-s': ['grid', 's'],
  's-use': ['s', 'use'],
  's-grid': ['s', 'out']
};

export default function Speichern({ onWant }) {
  const [mode, setMode] = useState('gruen');
  const scope = useRef(null);
  const m = MODES[mode];

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo('.flow-on', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' });
    },
    { dependencies: [mode], scope }
  );

  return (
    <section className="section" id="speichern" aria-labelledby="speichern-h" ref={scope}>
      <div className="wrap">
        <h2 id="speichern-h">Drei Betriebsarten</h2>
        <p className="lead narrow">
          Ein Speicher macht aus Mittagsstrom Abendstrom. Seit der MiSpeL-Festlegung der Bundesnetzagentur vom 1. Oktober
          2026 darf ein Speicher grünen Strom und Netzstrom gemeinsam aufnehmen, ohne die EEG-Förderung für den grünen
          Anteil zu verlieren. Damit gibt es drei Betriebsarten.
        </p>

        <fieldset className="tabs mt-8 border-0" role="radiogroup">
          <legend className="sr-only">Betriebsart wählen</legend>
          {Object.entries(MODES).map(([key, v]) => (
            <label
              key={key}
              className={`relative cursor-pointer rounded-full px-5 py-3 font-display text-[1.15rem] font-semibold transition-colors ${
                mode === key ? 'bg-sonne text-tinte shadow-[0_6px_24px_-6px_rgba(242,183,5,.6)]' : 'text-papier/70 hover:bg-white/10 hover:text-papier'
              } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sonne`}
            >
              <input className="absolute inset-0 cursor-pointer opacity-0" type="radio" name="speichermodus" value={key} checked={mode === key} onChange={() => setMode(key)} />
              {v.label}
            </label>
          ))}
        </fieldset>

        <div className="storage mt-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Stromflüsse: Bahnen hinten, Objekte als Glasschilder davor */}
          <div className="relative aspect-[660/300] w-full" role="img" aria-label={`Stromflüsse im ${m.label}`} style={{ perspective: '1000px' }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 660 300" aria-hidden="true">
              {Object.entries(EDGES).map(([id, [a, b]]) => {
                const on = m.edges.includes(id);
                const A = NODES[a];
                const B = NODES[b];
                const d = `M${A.x + 60},${A.y} C${(A.x + B.x) / 2},${A.y} ${(A.x + B.x) / 2},${B.y} ${B.x - 60},${B.y}`;
                const c = a === 'grid' || b === 'out' ? '#8fb3d1' : '#f2b705';
                return (
                  <g key={`${id}-${mode}`}>
                    <path d={d} fill="none" stroke={on ? c : 'rgba(247,247,244,.12)'} strokeOpacity={on ? 0.2 : 1} strokeWidth={on ? 10 : 2} strokeLinecap="round" />
                    {on && (
                      <path d={d} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeDasharray="3 16" className="flow-dash" style={{ filter: `drop-shadow(0 0 5px ${c})` }} />
                    )}
                  </g>
                );
              })}
            </svg>
            {Object.entries(NODES).map(([id, n]) => {
              const dim = (id === 'pv' && !m.edges.includes('pv-s')) || (id === 'grid' && !m.edges.includes('grid-s'));
              const big = id === 's';
              return (
                <div
                  key={id}
                  aria-hidden="true"
                  className={`${big ? 'glass-strong' : 'glass'} rim absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl px-3 pb-2 pt-2 text-center shadow-[0_20px_40px_-18px_rgba(0,0,0,.8)] transition-[opacity,filter] duration-500 ${
                    dim ? 'opacity-35 grayscale' : ''
                  }`}
                  style={{ left: `${(n.x / 660) * 100}%`, top: `${(n.y / 300) * 100}%`, width: big ? '30%' : '22%' }}
                >
                  <img
                    src={sceneImg(n.img)}
                    alt=""
                    loading="lazy"
                    className={`block w-auto max-w-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,.5)] ${n.img === 'mast' ? 'h-14 sm:h-24' : big ? 'h-14 sm:h-24' : 'h-12 sm:h-20'}`}
                  />
                  <span className="mt-1 font-display text-[0.8rem] font-semibold leading-tight text-papier sm:text-[1rem]">{n.label}</span>
                </div>
              );
            })}
          </div>

          <dl className="model-rows storage-rows" aria-live="polite">
            {m.rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="note">
          Die Pauschaloption gilt nur für Solaranlagen bis 30 kW. DC-gekoppelte Speicher können die Abgrenzungsoption aus
          messtechnischen Gründen nicht nutzen. Hardware planen wir mit einem regionalen Speicherhersteller aus Westsachsen.
        </p>
        <a className="btn btn-ink" href="#warteliste" onClick={onWant('speicher')}>
          Speicher planen lassen
        </a>
      </div>
    </section>
  );
}
