import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DATES = [
  { at: '2026-06-01', d: '1. Juni 2026', y: '2026', t: 'Energy Sharing startet', x: 'Strom teilen im Bilanzierungsgebiet des Verteilnetzbetreibers nach § 42c EnWG.' },
  { at: '2026-10-01', d: '1. Oktober 2026', y: '2026', t: 'MiSpeL-Festlegung', x: 'Speicher dürfen Grün- und Netzstrom gemeinsam aufnehmen.' },
  { at: '2027-01-01', d: '1. Januar 2027', y: '2027', t: 'EEG-Novelle geplant', x: 'Laut Regierungsentwurf keine feste Einspeisevergütung mehr für neue kleine Anlagen.' },
  { at: '2027-05-18', d: '18. Mai 2027', y: '2027', t: 'Kapazitätsmarkt öffnet für Batterien', x: 'Erste Ausschreibung mit Batterien: 2 GW Erzeugungskapazität nach StromVKG.' },
  { at: '2027-09-30', d: '30. September 2027', y: '2027', t: 'Übergang MiSpeL endet', x: 'Bis dahin Mischbetrieb nur mit Zustimmung von Netz- und Messstellenbetreiber.' },
  { at: '2027-12-01', d: '1. Dezember 2027', y: '2027', t: 'Kapazitätsausschreibung', x: 'Offene Ausschreibung, das Volumen legt die Bundesnetzagentur fest.' },
  { at: '2028-06-01', d: '1. Juni 2028', y: '2028', t: 'Energy Sharing erweitert', x: 'Auch im angrenzenden Netzgebiet derselben Regelzone.' },
  { at: '2031-01-01', d: '2031', y: '2031', t: 'Lieferjahr Kapazitätsmarkt', x: 'Erste Vergütung für bereitgehaltene Leistung.' }
];
// „in Kraft“ und die Heute-Marke ergeben sich aus dem aktuellen Datum
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const ITEMS = (() => {
  const list = DATES.map(e => ({ ...e, past: e.at <= TODAY }));
  const i = list.findIndex(e => !e.past);
  list.splice(i < 0 ? list.length : i, 0, { now: true });
  return list;
})();

/**
 * Zeitstrahl als Kamerafahrt: Beim Scrollen gleiten die Termine von rechts nach links. Jede Glastafel dreht sich
 * zur Mitte hin auf und kippt am Rand wieder in die Tiefe. Die Schiene füllt sich gelb bis zum heutigen Tag
 * und darüber hinaus mit dem Scrollen.
 */
export default function Fristen() {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 961px) and (prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray('.fr-card', root.current);
        const setters = cards.map(c => ({
          r: gsap.quickSetter(c, 'rotationY', 'deg'),
          z: gsap.quickSetter(c, 'z', 'px'),
          o: gsap.quickSetter(c, 'opacity')
        }));
        const flow = () => {
          const mid = window.innerWidth / 2;
          cards.forEach((c, i) => {
            const b = c.getBoundingClientRect();
            const k = gsap.utils.clamp(-1.4, 1.4, (b.left + b.width / 2 - mid) / mid);
            setters[i].r(-k * 26);
            setters[i].z(-Math.abs(k) * 180);
            setters[i].o(1 - Math.min(0.65, Math.abs(k) * 0.45));
          });
        };
        const distance = () => track.current.scrollWidth - track.current.parentElement.clientWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          onUpdate: flow,
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: flow
          }
        });
        gsap.fromTo(
          '.fr-fill',
          { scaleX: 0.22 },
          { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: 0.6 } }
        );
        flow();
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section className="fristen relative overflow-hidden bg-nacht pb-24 pt-24 text-papier" id="fristen" aria-labelledby="fristen-h" ref={root}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-drift-a absolute left-[-5%] top-[45%] h-[460px] w-[620px] rounded-full bg-[#1d4f7a] opacity-35 blur-[130px]" />
        <div className="animate-drift-c absolute right-[5%] top-[10%] h-[380px] w-[380px] rounded-full bg-[#6b4f10] opacity-25 blur-[120px]" />
      </div>

      <div className="wrap relative">
        <h2 id="fristen-h" className="m-0 font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[0.98]">
          Fristen, die Geld bewegen
        </h2>
        <p className="mb-0 mt-5 max-w-[56ch] text-[1.15rem] leading-relaxed text-papier/75">
          Zwischen 2026 und 2031 ändern sich die Regeln für Solarstrom und Speicher grundlegend. Wer die Termine kennt, plant
          Anlage, Vertrag und Speicher passend.
        </p>
      </div>

      <div className="relative mt-14" style={{ perspective: '1200px' }}>
        {/* Schiene mit Füllung */}
        <span aria-hidden="true" className="absolute inset-x-0 top-[38px] h-[3px] bg-papier/10 max-[960px]:hidden">
          <span className="fr-fill absolute inset-0 origin-left bg-gradient-to-r from-sonne via-sonne to-sonne-hell shadow-[0_0_18px_rgba(242,183,5,.6)]" />
        </span>

        <ol
          ref={track}
          className="m-0 flex list-none gap-6 p-0 pl-[max(var(--pad),calc((100vw-var(--wrap))/2+var(--pad)))] pr-[20vw] max-[960px]:flex-col max-[960px]:pr-[var(--pad)] min-[961px]:w-max"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {ITEMS.map((e, i) =>
            e.now ? (
              <li key="heute" className="relative flex w-[120px] shrink-0 flex-col items-center pt-[26px] max-[960px]:w-auto max-[960px]:flex-row max-[960px]:gap-3 max-[960px]:pt-0">
                <span aria-hidden="true" className="relative grid h-7 w-7 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-sonne/40" />
                  <span className="h-3.5 w-3.5 rounded-full bg-sonne shadow-[0_0_16px_#f2b705]" />
                </span>
                <span className="mt-3 text-center font-display text-[1.1rem] font-semibold leading-tight text-sonne max-[960px]:mt-0">
                  Heute
                  <br className="max-[960px]:hidden" />
                  <span className="text-papier/60"> {MONTH}</span>
                </span>
              </li>
            ) : (
              <li
                key={e.d}
                className="fr-card relative w-[clamp(300px,29vw,400px)] shrink-0 max-[960px]:w-auto"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-7 top-[31px] z-10 h-4 w-4 rounded-full border-2 max-[960px]:hidden ${
                    e.past ? 'border-sonne bg-sonne shadow-[0_0_14px_#f2b705]' : 'border-sonne bg-nacht'
                  }`}
                />
                <div
                  className={`${e.past ? 'glass' : 'glass-strong'} rim relative mt-[70px] overflow-hidden rounded-[22px] px-8 pb-9 pt-8 shadow-[0_2px_4px_rgba(0,0,0,.25),0_30px_60px_-24px_rgba(0,0,0,.7)] max-[960px]:mt-0`}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-3 -top-6 font-display text-[7.5rem] font-bold leading-none text-papier/[0.05]"
                  >
                    {e.y}
                  </span>
                  <time className="relative block font-display text-[2.3rem] font-bold leading-tight text-sonne">{e.d}</time>
                  <h3 className="relative m-0 mt-2 font-display text-[1.6rem] font-semibold leading-tight">{e.t}</h3>
                  <p className="relative m-0 mt-3 text-[1.06rem] leading-relaxed text-papier/75">{e.x}</p>
                  {e.past && (
                    <span className="relative mt-4 inline-block rounded-full bg-gruen/15 px-3 py-1 text-[0.82rem] font-medium text-gruen">
                      in Kraft
                    </span>
                  )}
                  {i === ITEMS.length - 1 && <span className="sr-only">Ende des Zeitstrahls</span>}
                </div>
              </li>
            )
          )}
        </ol>
      </div>
    </section>
  );
}
