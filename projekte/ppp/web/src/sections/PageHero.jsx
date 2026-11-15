import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { sceneImg } from '../lib/url.js';

/**
 * Kopf jeder Unterseite: Titel links, rechts eine kleine Bühne aus freigestellten Objekten der Foto-Szene,
 * die der Maus folgt, dazu schwebende Glas-Kennzahlen. Ohne WebGL, damit Unterseiten schnell laden.
 * scene: Name einer Zusammenstellung aus SCENES; facts: bis zu drei [Wert, Erklärung].
 */
// Lage der Objekte auf einer 16:10-Bühne: left/bottom in Prozent, w in Prozent der Breite, d = Tiefe für die Maus
const SCENES = {
  strom: [
    { id: 'park', left: 2, bottom: 40, w: 64, d: -0.8 },
    { id: 'mast', left: 22, bottom: 36, w: 6, d: -0.4 },
    { id: 'haeuser', left: 32, bottom: 28, w: 68, d: 0.2 }
  ],
  speicher: [
    { id: 'hof', left: -4, bottom: 34, w: 92, d: -0.4, fade: true },
    { id: 'speicher', left: 42, bottom: 14, w: 56, d: 0.6, shadow: true }
  ],
  komponenten: [
    { id: 'park', left: -2, bottom: 36, w: 104, d: -0.4 },
    { id: 'speicher', left: 52, bottom: 14, w: 44, d: 0.5, shadow: true }
  ],
  planen: [{ id: 'hof', left: 0, bottom: 26, w: 100, d: 0, fade: true }],
  pruefen: [
    { id: 'park', left: 30, bottom: 42, w: 72, d: -0.6 },
    { id: 'hof', left: -6, bottom: 24, w: 86, d: 0.15, fade: true }
  ],
  schutz: [
    { id: 'park', left: -2, bottom: 38, w: 104, d: -0.5 },
    { id: 'speicher', left: 46, bottom: 14, w: 48, d: 0.5, shadow: true }
  ]
};
const img = sceneImg;

function Piece({ p, sx, sy }) {
  const x = useTransform(sx, v => v * p.d * 50);
  const y = useTransform(sy, v => v * p.d * 20);
  return (
    <motion.img
      src={img(p.id)}
      alt=""
      className={`absolute block h-auto max-w-none ${p.shadow ? 'drop-shadow-[0_24px_20px_rgba(0,0,0,.6)]' : 'drop-shadow-[0_16px_18px_rgba(0,0,0,.45)]'}`}
      style={{
        left: `${p.left}%`,
        bottom: `${p.bottom}%`,
        width: `${p.w}%`,
        x,
        y,
        ...(p.fade && { maskImage: 'linear-gradient(to right, transparent, #000 10%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 10%)' })
      }}
    />
  );
}

export default function PageHero({ kicker, title, lead, children, scene, facts = [], visual }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 18 });
  const sy = useSpring(my, { stiffness: 70, damping: 18 });
  const rotY = useTransform(sx, v => -10 + v * 10);
  const rotX = useTransform(sy, v => 6 - v * 7);
  const pieces = SCENES[scene] || [];

  const move = e => {
    if (reduce || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section className="relative isolate overflow-hidden bg-nacht pb-16 pt-[calc(64px+3.5rem)] text-papier sm:pb-24 sm:pt-[calc(64px+5rem)]" onPointerMove={move}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-drift-a absolute -left-[10%] top-[10%] h-[560px] w-[560px] rounded-full bg-[#1d4f7a] opacity-45 blur-[130px]" />
        <div className="animate-drift-b absolute right-[-5%] top-[30%] h-[520px] w-[620px] rounded-full bg-[#7a5a12] opacity-30 blur-[140px]" />
        <div className="animate-drift-c absolute left-[45%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-[#2e6b52] opacity-25 blur-[120px]" />
      </div>

      <div className="wrap grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <p className="m-0 inline-flex items-center gap-2 rounded-full border border-papier/15 bg-white/[0.05] px-3.5 py-1.5 text-[0.95rem] font-medium text-papier/85 backdrop-blur">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-sonne shadow-[0_0_10px_#f2b705]" />
            {kicker}
          </p>
          <h1 className="m-0 mt-6 max-w-[15ch] font-display text-[clamp(2.8rem,6.4vw,5.6rem)] font-bold leading-[0.93]">{title}</h1>
          <p className="mb-0 mt-6 max-w-[52ch] text-[1.2rem] leading-relaxed text-papier/75">{lead}</p>
          {children && <div className="actions mt-9">{children}</div>}
        </div>

        {(pieces.length > 0 || visual) && (
          <div className="relative mx-auto aspect-[16/10] w-full max-w-[640px]" style={{ perspective: '1100px' }} aria-hidden="true">
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d', rotateY: reduce ? -10 : rotY, rotateX: reduce ? 6 : rotX }}
              initial={reduce ? false : { opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              {/* Glasplatte als Boden */}
              <div
                className="rim absolute inset-x-[0%] bottom-[2%] h-[46%] rounded-[50%] bg-gradient-to-b from-white/[0.08] to-white/[0.01] shadow-[0_50px_90px_-30px_rgba(0,0,0,.85),inset_0_1px_0_rgba(255,255,255,.12)]"
                style={{ transform: 'translateZ(-40px)' }}
              />
              {visual ? (
                <div className="absolute inset-0" style={{ transform: 'translateZ(20px)' }}>
                  {visual}
                </div>
              ) : (
                <div className="absolute inset-0">
                  {pieces.map(p => (
                    <Piece key={p.id} p={p} sx={sx} sy={sy} />
                  ))}
                </div>
              )}
              {facts.map(([v, t], i) => (
                <div
                  key={t}
                  className={`glass rim absolute rounded-2xl px-4 py-3 shadow-[0_20px_40px_-16px_rgba(0,0,0,.7)] ${
                    ['left-0 top-[-2%] sm:left-[-6%]', 'right-0 bottom-[-10%] sm:right-[-6%]', 'left-0 bottom-[-8%] sm:left-[-4%]'][i]
                  }`}
                  style={{ transform: `translateZ(${[90, 130, 110][i]}px)` }}
                >
                  <p className="m-0 font-display text-[1.6rem] font-bold leading-none text-sonne">{v}</p>
                  <p className="m-0 mt-1 max-w-[17ch] text-[0.85rem] leading-snug text-papier/70">{t}</p>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
