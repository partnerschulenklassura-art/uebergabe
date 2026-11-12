import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { IsoSolarField, IsoBattery } from '../components/iso/Iso.jsx';
import { gen, price, fmt } from '../lib/day.js';
import { money } from '../lib/money.js';

// Grundneigung der Bühne und wie stark die Maus sie zusätzlich kippt (Grad)
const BASE_X = 14;
const BASE_Y = -20;
const TILT = 9;

/** Uhr, die langsam durch einen Sommertag läuft (eine Stunde je 1,6 s). Bei reduzierter Bewegung steht sie auf 13 Uhr. */
function useDayClock(reduce) {
  const [h, setH] = useState(13);
  useEffect(() => {
    if (reduce) return;
    let raf;
    let start;
    const loop = t => {
      start ??= t;
      const hour = 6 + (((t - start) / 1600) % 15); // 6–21 Uhr
      setH(Math.round(hour * 4) / 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  return h;
}

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
  const baseX = small ? 8 : BASE_X;
  const baseY = small ? -10 : BASE_Y;
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

  const h = useDayClock(reduce);
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

  const hh = String(Math.floor(h)).padStart(2, '0');
  const mm = String(Math.round((h % 1) * 60)).padStart(2, '0');

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
            Kompetenzzentrum für Solarstrom
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
            Uhrzeit. Das Energie-Institut Deutschland bringt beide Seiten zusammen.
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
        <div className="relative h-[460px] sm:h-[540px] lg:h-[620px]" style={{ perspective: '1000px' }}>
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
            {/* Ebene −120: PV-Feld weit hinten */}
            <div className="absolute left-[-2%] top-[-14%] w-[90%]" style={{ transform: 'translateZ(-120px)' }}>
              <IsoSolarField className="w-full opacity-90 drop-shadow-[0_30px_40px_rgba(0,0,0,.45)]" glow={0.25 + g * 0.45} />
            </div>

            {/* Ebene 0: Cockpit aus Glas */}
            <div
              className="glass-strong rim absolute left-[10%] top-[26%] w-[78%] max-w-[440px] overflow-hidden rounded-[22px] p-6"
              style={{ transform: 'translateZ(0px)' }}
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
              <div className="relative flex items-baseline justify-between">
                <span className="text-[0.9rem] font-medium text-papier/70">Ihr Strom, live gerechnet</span>
                <span className="font-display text-[0.95rem] font-semibold text-sonne">Sommertag</span>
              </div>
              <p className="relative m-0 mt-2 font-display text-[4.2rem] font-bold leading-none tabular-nums text-papier" aria-hidden="true">
                {hh}:{mm}
              </p>

              {/* Mini-Kurve des Tages mit Cursor */}
              <svg viewBox="0 0 300 70" className="relative mt-3 h-[70px] w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="hero-gen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f2b705" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#f2b705" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={`M0,66 ${Array.from({ length: 61 }, (_, i) => {
                    const hr = 4 + i * 0.3;
                    return `L${(i * 5).toFixed(1)},${(66 - gen(hr) * 56).toFixed(1)}`;
                  }).join(' ')} L300,66 Z`}
                  fill="url(#hero-gen)"
                />
                <polyline
                  points={Array.from({ length: 61 }, (_, i) => {
                    const hr = 4 + i * 0.3;
                    return `${(i * 5).toFixed(1)},${(60 - ((price(hr) + 4) / 26) * 54).toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#8fb3d1"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <line x1={((h - 4) / 18) * 300} x2={((h - 4) / 18) * 300} y1="2" y2="68" stroke="#fff" strokeOpacity="0.7" />
                <circle cx={((h - 4) / 18) * 300} cy={60 - ((p + 4) / 26) * 54} r="3.5" fill="#8fb3d1" stroke="#fff" />
              </svg>

              <dl className="relative m-0 mt-4 grid grid-cols-3 gap-3">
                {[
                  ['Erzeugung', `${Math.round(g * 100)} %`, 'text-sonne'],
                  ['Börsenpreis', `${fmt(p)} ct`, p < 0 ? 'text-[#ff9a8a]' : 'text-netz'],
                  ['Speicher', `${Math.round(m.soc * 100)} %`, 'text-gruen']
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl bg-white/[0.05] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
                    <dt className="text-[0.78rem] text-papier/60">{k}</dt>
                    <dd className={`m-0 mt-0.5 font-display text-[1.45rem] font-semibold leading-none tabular-nums ${c}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Ebene +70: Speicher ragt vorn links aus dem Cockpit */}
            <div className="absolute bottom-[3%] left-[-4%] w-[30%] max-w-[170px]" style={{ transform: 'translateZ(70px)' }}>
              <IsoBattery
                className="w-full drop-shadow-[0_28px_30px_rgba(0,0,0,.55)]"
                level={Math.max(0.08, m.soc)}
                color={selling ? '#8fb3d1' : charging ? '#f2b705' : '#5fb37f'}
              />
            </div>

            {/* Ebene +120: schwebende Hinweise */}
            <div
              className="glass rim absolute right-[-2%] top-[12%] rounded-2xl px-4 py-3"
              style={{ transform: 'translateZ(120px)' }}
            >
              <p className="m-0 text-[0.78rem] text-papier/60">{selling ? 'Speicher verkauft' : charging ? 'Speicher lädt' : 'Speicher wartet'}</p>
              <p className="m-0 font-display text-[1.35rem] font-semibold leading-tight text-papier">
                {selling ? 'Abendpreis' : charging ? 'Mittagsstrom' : 'Bereit'}
              </p>
            </div>
            <div
              className="glass rim absolute bottom-[14%] right-[4%] rounded-2xl px-4 py-3"
              style={{ transform: 'translateZ(90px)' }}
            >
              <p className="m-0 text-[0.78rem] text-papier/60">Mehrerlös mit Speicher heute</p>
              <p className="m-0 font-display text-[1.35rem] font-semibold leading-tight tabular-nums text-sonne">
                {m.sellerStore - m.sellerPlain > 0
                  ? `+${(m.sellerStore - m.sellerPlain).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                  : 'kommt abends'}
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
              <a href={href} className="group block h-full px-6 py-4 no-underline transition hover:bg-white/[0.06]">
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
