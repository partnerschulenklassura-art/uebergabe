import { url } from '../lib/url.js';
import { isLive } from '../site.config.js';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { gen, price, fmt, sunPos, clock, SUNRISE, SUNSET } from '../lib/day.js';
import { money } from '../lib/money.js';
import SunScene from './SunScene.jsx';

// Grundneigung der Bühne und wie stark die Maus sie zusätzlich kippt (Grad)
const BASE_X = 7;
const BASE_Y = -9;
const TILT = 7;

const DAY_START = SUNRISE - 0.7; // kurz vor Sonnenaufgang
const DAY_LEN = SUNSET + 0.7 - DAY_START;

/**
 * Uhr, die durch einen Sommertag läuft (eine Stunde je 1,8 s). Liefert die fließende Stunde für Sonne und Licht.
 * pick(h) stellt eine Uhrzeit von Hand ein; danach läuft die Uhr nach 6 s von dort weiter.
 * Bei reduzierter Bewegung steht sie auf 13:30 Uhr.
 */
function useDayClock(reduce) {
  const [hs, setHs] = useState(13.5);
  const anchor = useRef({ h: 13.5, t: null, hold: 0 });
  useEffect(() => {
    if (reduce) return;
    let raf;
    let last = 0;
    const loop = t => {
      const a = anchor.current;
      if (a.t === null) a.t = t;
      if (t < a.hold) a.t = t;
      else if (t - last > 40) {
        last = t;
        const run = (t - a.t) / 1800;
        setHs(DAY_START + ((((a.h - DAY_START + run) % DAY_LEN) + DAY_LEN) % DAY_LEN));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  const pick = h => {
    anchor.current = { h, t: performance.now() + 6000, hold: performance.now() + 6000 };
    setHs(h);
  };
  return [hs, pick];
}

const PHASES = [
  [-99, 'Nacht'],
  [-4, 'Dämmerung'],
  [3, 'Sonnenaufgang'],
  [12, 'Vormittag'],
  [45, 'Mittag']
];
function phase(elev, h) {
  if (elev < -4) return 'Nacht';
  if (h > 14) return elev < 3 ? 'Sonnenuntergang' : elev < 12 ? 'Abendsonne' : 'Nachmittag';
  let label = 'Nacht';
  for (const [e, l] of PHASES) if (elev >= e) label = l;
  return label;
}
const DIRS = ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'];
const compass = az => DIRS[Math.round(((az % 360) + 360) / 45) % 8];
const money2 = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const words = 'Strom hat eine Uhrzeit.'.split(' ');

function useSmall() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setSmall(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return small;
}

export default function Hero3D() {
  const reduce = useReducedMotion();
  const small = useSmall();
  const baseX = small ? 5 : BASE_X;
  const baseY = small ? -6 : BASE_Y;
  const section = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, v => baseY + v * TILT * 2);
  const rotateX = useTransform(sy, v => baseX - v * TILT * 1.4);
  // Licht folgt der Maus über die Glasfläche
  const glareX = useTransform(sx, v => `${50 + v * 80}%`);
  const glareY = useTransform(sy, v => `${30 + v * 80}%`);

  const [hs, pick] = useDayClock(reduce);
  const h = Math.round(hs * 4) / 4; // angezeigte Uhrzeit in Viertelstunden
  const sun = sunPos(hs);
  const m = money(h);
  const p = price(h);
  const g = gen(h);
  const charging = h >= 11 && h < 15;
  const selling = h >= 18 && h < 21;

  const onMove = e => {
    if (reduce || e.pointerType === 'touch') return;
    const r = section.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      ref={section}
      id="top"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative isolate min-h-svh overflow-hidden bg-nacht text-papier"
    >
      {/* Mesh-Gradient: vier weiche Farbflächen, die sich sehr langsam verschieben */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-drift-a absolute -left-[15%] -top-[25%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgba(242,183,5,0.22),transparent)] blur-2xl" />
        <div className="animate-drift-b absolute -right-[20%] top-[5%] h-[75vmax] w-[75vmax] rounded-full bg-[radial-gradient(closest-side,rgba(52,98,140,0.55),transparent)] blur-2xl" />
        <div className="animate-drift-c absolute bottom-[-35%] left-[20%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgba(28,92,86,0.45),transparent)] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(14,22,32,0.95),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(70%_60%_at_70%_45%,#000,transparent)]" />
      </div>

      <div className="mx-auto grid min-h-svh max-w-[1240px] items-center gap-10 px-6 pb-36 pt-28 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:px-10 lg:pb-32">
        {/* Text */}
        <div className="relative z-10">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="glass rim mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] font-medium text-papier/90"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sonne opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sonne" />
            </span>
            Energie-Netzwerk für Solarstrom
          </motion.p>

          <h1 className="m-0 max-w-[11ch] font-display text-[clamp(3.6rem,8.6vw,8.4rem)] font-bold leading-[0.88] tracking-[-0.02em]">
            {words.map((w, i) => (
              <motion.span
                key={w}
                className="mr-[0.22em] inline-block"
                initial={reduce ? false : { opacity: 0, y: 40, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.15 + i * 0.09, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-7 max-w-[46ch] text-[1.2rem] leading-relaxed text-[#c9d2da]"
          >
            Wer Strom kauft, will weniger zahlen. Wer ihn erzeugt, will mehr dafür bekommen. Beides entscheidet sich an der
            Uhrzeit. PV Performance Pro bringt beide Seiten zusammen.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href="#warteliste"
              className="inline-flex min-h-12 items-center rounded-xl bg-sonne px-6 font-semibold text-tinte no-underline shadow-[0_1px_0_rgba(255,255,255,.5)_inset,0_10px_30px_-8px_rgba(242,183,5,.65),0_2px_6px_rgba(0,0,0,.3)] transition hover:-translate-y-0.5 hover:bg-sonne-hell"
            >
              Auf die Warteliste
            </a>
            <a
              href="#story"
              className="glass rim inline-flex min-h-12 items-center rounded-xl px-6 font-semibold text-papier no-underline transition hover:-translate-y-0.5"
            >
              Den Tag ansehen
            </a>
          </motion.div>
        </div>

        {/* 3D-Bühne */}
        <div className="relative h-[540px] sm:h-[540px] lg:h-[600px]" style={{ perspective: '1100px' }}>
          {/* Außen: einmaliger Auftritt. Innen: Neigung durch die Maus. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
            initial={reduce ? false : { opacity: 0, y: 70, rotateX: 28 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', rotateX: reduce || small ? baseX : rotateX, rotateY: reduce || small ? baseY : rotateY }}
          >
            {/* Landschaft als Diorama aus freigestellten Ebenen, Licht und Sonne folgen der Uhrzeit */}
            <div className="absolute left-[-14%] top-[2%] w-[128%] sm:left-[-18%] sm:top-[-14%] sm:w-[146%]" style={{ transformStyle: 'preserve-3d' }}>
              <SunScene h={hs} />
            </div>

            {/* Ebene +40: Cockpit aus Glas, unten rechts über dem Foto */}
            <div
              className="glass-strong rim absolute bottom-[3%] right-0 w-[90%] max-w-[400px] overflow-hidden rounded-[22px] p-5 sm:right-[-8%] sm:w-[74%] sm:p-6"
              style={{ transform: 'translateZ(40px)' }}
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1/2 rounded-full"
                style={{
                  background: 'radial-gradient(closest-side, rgba(255,255,255,.16), transparent 70%)',
                  left: glareX,
                  top: glareY,
                  width: '70%',
                  height: '70%',
                  translateX: '-50%',
                  translateY: '-50%'
                }}
              />
              <div className="relative flex items-baseline justify-between gap-3">
                <span className="text-[0.9rem] font-medium text-papier/70">Ihr Strom, live gerechnet</span>
                <span className="font-display text-[0.95rem] font-semibold text-sonne">{phase(sun.elev, hs)}</span>
              </div>
              <div className="relative mt-1 flex items-end justify-between gap-4">
                <p className="m-0 font-display text-[3.6rem] font-bold leading-none tabular-nums text-papier sm:text-[4.2rem]" aria-hidden="true">
                  {clock(h)}
                  <span className="ml-1.5 text-[1.3rem] font-semibold text-papier/60">Uhr</span>
                </p>
                <p className="m-0 pb-1.5 text-right text-[0.85rem] leading-snug text-papier/70">
                  {sun.elev > 0 ? (
                    <>
                      Sonne <strong className="font-semibold text-papier">{Math.round(sun.elev)}°</strong> hoch
                      <br />
                      im {compass(sun.az)}
                    </>
                  ) : (
                    <>
                      Sonne unter
                      <br />
                      dem Horizont
                    </>
                  )}
                </p>
              </div>
              <dl className="relative m-0 mt-4 grid grid-cols-3 gap-2.5">
                {[
                  ['Erzeugung', `${Math.round(g * 100)} %`, 'text-sonne'],
                  ['Börsenpreis', `${fmt(p)} ct`, p < 0 ? 'text-[#ff9a8a]' : 'text-netz'],
                  ['Speicher', `${Math.round(m.soc * 100)} %`, 'text-gruen']
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl bg-white/[0.05] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
                    <dt className="text-[0.76rem] text-papier/60">{k}</dt>
                    <dd className={`m-0 mt-0.5 whitespace-nowrap font-display text-[1.15rem] font-semibold leading-none tabular-nums sm:text-[1.35rem] ${c}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              {/* Zeitleiste zum Selberschieben */}
              <label className="relative mt-4 flex items-center gap-2.5">
                <span className="sr-only">Uhrzeit wählen</span>
                <span aria-hidden="true" className="text-[0.75rem] tabular-nums text-papier/55">Aufgang</span>
                <input
                  type="range"
                  min={DAY_START}
                  max={DAY_START + DAY_LEN}
                  step={0.25}
                  value={h}
                  onChange={e => pick(Number(e.target.value))}
                  aria-valuetext={`${clock(h)} Uhr`}
                  className="sun-range h-6 min-w-0 flex-1 cursor-pointer"
                />
                <span aria-hidden="true" className="text-[0.75rem] tabular-nums text-papier/55">Untergang</span>
              </label>
            </div>

            {/* Ebene +110: schwebender Hinweis zum Speicher */}
            <div
              className="glass rim absolute left-[-8%] top-[60%] hidden rounded-2xl px-4 py-3 sm:block"
              style={{ transform: 'translateZ(110px)' }}
            >
              <p className="m-0 text-[0.78rem] text-papier/60">{selling ? 'Speicher verkauft' : charging ? 'Speicher lädt' : 'Speicher wartet'}</p>
              <p className="m-0 font-display text-[1.35rem] font-semibold leading-tight text-papier">
                {selling ? 'zum Abendpreis' : charging ? 'Mittagsstrom' : m.sellerStore - m.sellerPlain > 0 ? `+${money2(m.sellerStore - m.sellerPlain)} € heute` : 'bereit'}
              </p>
            </div>
          </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Drei Wege als Glasleiste am unteren Rand */}
      <nav aria-label="Einstieg nach Rolle" className="absolute inset-x-0 bottom-6 z-10 hidden px-6 md:block lg:px-10">
        <ul className="glass rim mx-auto m-0 grid max-w-[1180px] list-none grid-cols-3 overflow-hidden rounded-2xl p-0">
          {[
            ['/strom/', 'Sie kaufen Strom', 'Weniger zahlen durch Nachbarschaftsstrom und die richtige Uhrzeit'],
            ['/speicher/', 'Sie haben eine PV-Anlage', 'Mehr bekommen durch Speicher, Vermarktung und Verkauf an Nachbarn'],
            ['/pruefen/', 'Sie prüfen Anlagen', 'Prüfprotokolle nach VDE mit der App PV-Monteur']
          ].map(([href, t, x], i) => (
            <li key={href} className={i ? 'border-l border-white/10' : ''}>
              <a href={isLive(href.slice(1, -1)) ? url(href) : '#warteliste'} className="group block h-full px-6 py-4 no-underline transition hover:bg-white/[0.06]">
                <strong className="block font-display text-[1.45rem] font-semibold text-papier group-hover:text-sonne">{t}</strong>
                <span className="text-[0.95rem] text-papier/65">{x}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
