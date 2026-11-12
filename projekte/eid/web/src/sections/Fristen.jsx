import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DATES = [
  { d: '1. Juni 2026', t: 'Energy Sharing startet', x: 'Strom teilen im Bilanzierungsgebiet des Verteilnetzbetreibers nach § 42c EnWG.', past: true },
  { d: '1. Oktober 2026', t: 'MiSpeL-Festlegung', x: 'Speicher dürfen Grün- und Netzstrom gemeinsam aufnehmen.', past: true },
  { d: '1. Januar 2027', t: 'EEG-Novelle geplant', x: 'Laut Regierungsentwurf keine feste Einspeisevergütung mehr für neue kleine Anlagen.' },
  { d: '18. Mai 2027', t: 'Kapazitätsmarkt öffnet für Batterien', x: 'Erste Ausschreibung mit Batterien: 2 GW Erzeugungskapazität nach StromVKG.' },
  { d: '30. September 2027', t: 'Übergang MiSpeL endet', x: 'Bis dahin Mischbetrieb nur mit Zustimmung von Netz- und Messstellenbetreiber.' },
  { d: '1. Dezember 2027', t: 'Kapazitätsausschreibung', x: 'Offene Ausschreibung, das Volumen legt die Bundesnetzagentur fest.' },
  { d: '1. Juni 2028', t: 'Energy Sharing erweitert', x: 'Auch im angrenzenden Netzgebiet derselben Regelzone.' },
  { d: '2031', t: 'Lieferjahr Kapazitätsmarkt', x: 'Erste Vergütung für bereitgehaltene Leistung.' }
];

export default function Fristen() {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 961px) and (prefers-reduced-motion: no-preference)', () => {
        const distance = () => track.current.scrollWidth - track.current.parentElement.clientWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });
        gsap.fromTo('.rail-fill', { scaleX: 0 }, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: 0.6 }
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section className="section section-ink fristen" id="fristen" aria-labelledby="fristen-h" ref={root}>
      <div className="wrap">
        <h2 id="fristen-h">Fristen, die Geld bewegen</h2>
        <p className="lead narrow">
          Zwischen 2026 und 2031 ändern sich die Regeln für Solarstrom und Speicher grundlegend. Wer die Termine kennt,
          plant Anlage, Vertrag und Speicher passend.
        </p>
      </div>
      <div className="gallery">
        <span className="rail" aria-hidden="true">
          <span className="rail-fill" />
        </span>
        <ol className="gallery-track" ref={track}>
          {DATES.map(e => (
            <li key={e.d} className={e.past ? 'past' : ''}>
              <time>{e.d}</time>
              <h3>{e.t}</h3>
              <p>{e.x}</p>
              {e.past && <span className="tag">in Kraft</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
