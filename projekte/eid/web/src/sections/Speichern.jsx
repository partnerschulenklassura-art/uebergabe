import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

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
  pv: { x: 95, y: 70, label: 'Solaranlage' },
  grid: { x: 95, y: 230, label: 'Netz (Einkauf)' },
  s: { x: 330, y: 150, label: 'Speicher' },
  use: { x: 565, y: 70, label: 'Verbrauch vor Ort' },
  out: { x: 565, y: 230, label: 'Netz (Verkauf)' }
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

        <fieldset className="switch">
          <legend className="sr-only">Betriebsart wählen</legend>
          {Object.entries(MODES).map(([key, v]) => (
            <label key={key} className={mode === key ? 'on' : ''}>
              <input type="radio" name="speichermodus" value={key} checked={mode === key} onChange={() => setMode(key)} />
              {v.label}
            </label>
          ))}
        </fieldset>

        <div className="storage reveal-item">
          <svg className="flow" viewBox="0 0 660 300" role="img" aria-label={`Stromflüsse im ${m.label}`}>
            {Object.entries(EDGES).map(([id, [a, b]]) => {
              const on = m.edges.includes(id);
              const A = NODES[a];
              const B = NODES[b];
              const d = `M${A.x + 80},${A.y} C${(A.x + B.x) / 2},${A.y} ${(A.x + B.x) / 2},${B.y} ${B.x - 80},${B.y}`;
              return (
                <path
                  key={`${id}-${mode}`}
                  d={d}
                  pathLength="1"
                  className={on ? `flow-on flow-${a === 'grid' || b === 'out' ? 'net' : 'sun'}` : 'flow-off'}
                />
              );
            })}
            {Object.entries(NODES).map(([id, n]) => {
              const dim = (id === 'pv' && !m.edges.includes('pv-s')) || (id === 'grid' && !m.edges.includes('grid-s'));
              return (
                <g key={id} className={`node ${id === 's' ? 'node-s' : ''} ${dim ? 'node-dim' : ''}`}>
                  <rect x={n.x - 80} y={n.y - 24} width="160" height="48" rx={id === 's' ? 4 : 24} />
                  <text x={n.x} y={n.y + 6} textAnchor="middle">
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>

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
