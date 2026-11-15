import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { euro, money } from '../lib/money.js';
import { sceneImg } from '../lib/url.js';

const end = money(22);
const spar = Math.round((1 - end.buyerFlex / end.buyerFix) * 100);
const faktor = (end.sellerStore / end.sellerPlain).toLocaleString('de-DE', { maximumFractionDigits: 1 });
const img = sceneImg;

const SHADOW =
  'shadow-[0_2px_4px_rgba(0,0,0,.25),0_24px_48px_-16px_rgba(0,0,0,.55),0_70px_120px_-40px_rgba(10,40,70,.75)]';

// Ein Punkt der Liste: fetter Einstieg, danach Fließtext
function Point({ title, children }) {
  return (
    <li className="relative pl-5 text-[1.02rem] leading-relaxed text-papier/75">
      <span aria-hidden="true" className="absolute left-0 top-[0.62em] h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      <strong className="font-semibold text-papier">{title}</strong> {children}
    </li>
  );
}

export default function ZweiSeiten({ onWant }) {
  const reduce = useReducedMotion();
  // Auf schmalen Bildschirmen stehen die Karten gerade untereinander
  const narrow = typeof window !== 'undefined' && window.innerWidth < 1024;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 18, mass: 0.7 });
  const sy = useSpring(my, { stiffness: 70, damping: 18, mass: 0.7 });
  const rotY = useTransform(sx, v => v * 6);
  const rotX = useTransform(sy, v => -v * 4);

  const move = e => {
    if (reduce || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    mx.set(0);
    my.set(0);
  };
  const enter = (delay, from) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 60, rotateX: 14, rotateY: narrow ? 0 : from.rotateY },
          whileInView: { opacity: 1, y: 0, rotateX: 0, rotateY: narrow ? 0 : from.rotateYTo },
          viewport: { once: true, margin: '-12% 0px' },
          transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }
        };

  return (
    <section
      className="relative overflow-hidden bg-nacht py-24 text-papier sm:py-32"
      id="angebot"
      aria-labelledby="angebot-h"
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {/* Langsamer Farbnebel im Hintergrund */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-drift-a absolute -left-[10%] top-[20%] h-[520px] w-[520px] rounded-full bg-[#1d4f7a] opacity-40 blur-[120px]" />
        <div className="animate-drift-b absolute right-[-8%] top-[45%] h-[560px] w-[560px] rounded-full bg-[#7a5a12] opacity-30 blur-[130px]" />
        <div className="animate-drift-c absolute left-[40%] top-[-10%] h-[380px] w-[380px] rounded-full bg-[#2e6b52] opacity-25 blur-[110px]" />
      </div>

      <div className="wrap relative">
        <h2 id="angebot-h" className="m-0 max-w-[14ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[0.98]">
          Zwei Seiten, ein Geschäft
        </h2>
        <p className="mb-0 mt-5 max-w-[56ch] text-[1.15rem] leading-relaxed text-papier/75">
          Was der eine mittags zu viel hat, braucht der andere abends. Wir bringen beide zusammen, damit der Käufer weniger
          zahlt und der Erzeuger mehr bekommt.
        </p>

        <div className="relative mt-16 sm:mt-24" style={{ perspective: '1400px' }}>
          <motion.div
            className="relative grid gap-24 lg:grid-cols-2 lg:gap-12"
            style={{ transformStyle: 'preserve-3d', rotateX: reduce ? 0 : rotX, rotateY: reduce ? 0 : rotY }}
          >
            {/* Brücke: der Mittagsstrom wandert von der Anlage zum Käufer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[-40px] z-10 hidden w-[40%] lg:block"
              style={{ transform: 'translateX(-50%) translateZ(140px)' }}
            >
              <svg viewBox="0 0 400 90" className="w-full overflow-visible">
                <path d="M370,80 Q200,-20 30,80" fill="none" stroke="#f2b705" strokeOpacity="0.18" strokeWidth="9" strokeLinecap="round" />
                <path
                  d="M370,80 Q200,-20 30,80"
                  fill="none"
                  stroke="#f2b705"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray="3 22"
                  className="flow-dash"
                  style={{ filter: 'drop-shadow(0 0 6px #f2b705)' }}
                />
              </svg>
              <p className="glass rim absolute left-1/2 top-[6px] m-0 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[0.88rem] font-medium text-papier">
                Mittagsstrom wird Abendstrom
              </p>
            </div>

            {/* Käufer */}
            <motion.article
              className={`glass rim relative flex flex-col rounded-[28px] px-7 pb-8 pt-0 sm:px-9 ${SHADOW}`}
              style={{ transformStyle: 'preserve-3d', transformOrigin: 'right center' }}
              {...enter(0, { rotateY: 18, rotateYTo: 5 })}
            >
              <div className="relative -mt-20 h-[190px] sm:h-[220px]" style={{ transformStyle: 'preserve-3d' }}>
                <div aria-hidden="true" className="absolute inset-x-[8%] bottom-1 h-8 rounded-[50%] bg-black/50 blur-xl" />
                <img
                  src={img('haeuser')}
                  alt="Wohnhäuser in der Nachbarschaft"
                  width="556"
                  height="153"
                  loading="lazy"
                  className="absolute bottom-0 left-1/2 block h-auto w-[104%] max-w-none drop-shadow-[0_18px_22px_rgba(0,0,0,.5)]"
                  style={{ transform: 'translateX(-50%) translateZ(70px)' }}
                />
              </div>
              <p className="m-0 mt-6 font-display text-[1.1rem] font-semibold text-netz">Sie kaufen Strom</p>
              <h3 className="m-0 mt-1 font-display text-[clamp(1.7rem,2.6vw,2.2rem)] font-bold leading-[1.05]">
                Weniger zahlen, ohne weniger zu verbrauchen
              </h3>
              <p className="m-0 mt-6 flex items-end gap-4">
                <strong className="font-display text-[clamp(4rem,8vw,6rem)] font-bold leading-[0.85] tabular-nums text-papier">
                  −{spar}&nbsp;%
                </strong>
                <span className="pb-1 text-[0.95rem] leading-snug text-papier/65">
                  Stromkosten im Rechenbeispiel
                  <br />
                  {euro(end.buyerFlex)} statt {euro(end.buyerFix)} bis 22 Uhr
                </span>
              </p>
              <ul className="m-0 mt-8 grid list-none gap-4 p-0 text-netz">
                <Point title="Strom aus der Nachbarschaft.">
                  Seit 1. Juni 2026 dürfen Anlagen im selben Netzgebiet Strom mit Ihnen teilen (§ 42c EnWG). Wir bauen die
                  Stromgemeinschaft auf und übernehmen die Abrechnung.
                </Point>
                <Point title="Dynamischer Tarif.">
                  Jeder Stromlieferant muss einen anbieten. Wir zeigen, welche Geräte Sie in die günstigen Stunden legen:
                  E-Auto, Wärmepumpe, Spülmaschine.
                </Point>
                <Point title="Ehrlich gesagt:">
                  Netzentgelte, Steuern und Umlagen zahlen Sie auch für Strom aus der Nachbarschaft. Sparen lässt sich am
                  Energieanteil und an der Uhrzeit. Voraussetzung ist ein intelligentes Messsystem.
                </Point>
              </ul>
              <a
                className="mt-9 inline-flex min-h-[48px] items-center self-start rounded-xl bg-papier px-6 font-display text-[1.15rem] font-semibold text-tinte no-underline shadow-[0_10px_30px_-10px_rgba(0,0,0,.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sonne"
                href="#warteliste"
                onClick={onWant('kaufen')}
              >
                Als Stromkäufer eintragen
              </a>
            </motion.article>

            {/* Erzeuger */}
            <motion.article
              className={`glass-strong rim relative flex flex-col rounded-[28px] px-7 pb-8 pt-0 sm:px-9 lg:mt-20 ${SHADOW}`}
              style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
              {...enter(0.15, { rotateY: -18, rotateYTo: -5 })}
            >
              <div className="relative -mt-20 h-[190px] sm:h-[220px]" style={{ transformStyle: 'preserve-3d' }}>
                <div aria-hidden="true" className="absolute inset-x-[4%] bottom-1 h-8 rounded-[50%] bg-black/50 blur-xl" />
                <img
                  src={img('hof')}
                  alt="Hof mit Photovoltaik auf den Dächern"
                  width="760"
                  height="295"
                  loading="lazy"
                  className="absolute bottom-0 left-[-6%] block h-auto w-[92%] max-w-none drop-shadow-[0_18px_22px_rgba(0,0,0,.5)]"
                  style={{ transform: 'translateZ(60px)' }}
                />
                <img
                  src={img('speicher')}
                  alt="Speicher-Container"
                  width="177"
                  height="78"
                  loading="lazy"
                  className="absolute bottom-[-10px] right-[-4%] block h-auto w-[40%] max-w-none drop-shadow-[0_20px_18px_rgba(0,0,0,.55)]"
                  style={{ transform: 'translateZ(120px)' }}
                />
              </div>
              <p className="m-0 mt-6 font-display text-[1.1rem] font-semibold text-sonne">Sie haben eine PV-Anlage</p>
              <h3 className="m-0 mt-1 font-display text-[clamp(1.7rem,2.6vw,2.2rem)] font-bold leading-[1.05]">
                Mehr bekommen für denselben Strom
              </h3>
              <p className="m-0 mt-6 flex items-end gap-4">
                <strong className="font-display text-[clamp(4rem,8vw,6rem)] font-bold leading-[0.85] tabular-nums text-sonne">
                  {faktor}×
                </strong>
                <span className="pb-1 text-[0.95rem] leading-snug text-papier/65">
                  Tageserlös im Rechenbeispiel
                  <br />
                  {euro(end.sellerStore)} statt {euro(end.sellerPlain)}
                </span>
              </p>
              <ul className="m-0 mt-8 grid list-none gap-4 p-0 text-sonne">
                <Point title="Speicher nachrüsten.">
                  Mittagsstrom zurücklegen und abends verkaufen. Seit der MiSpeL-Festlegung vom 1. Oktober 2026 darf ein
                  Speicher auch Netzstrom aufnehmen, ohne dass der grüne Anteil die EEG-Förderung verliert.
                </Point>
                <Point title="Besser vermarkten.">
                  Wir bündeln Anlagen für bessere Konditionen beim Direktvermarkter und regeln bei negativen Preisen sauber ab.
                </Point>
                <Point title="An Nachbarn verkaufen.">
                  Für nicht gewerblich betriebene Anlagen über die Stromgemeinschaft, für Gewerbe über einen Liefervertrag.
                </Point>
              </ul>
              <a
                className="mt-9 inline-flex min-h-[48px] items-center self-start rounded-xl bg-sonne px-6 font-display text-[1.15rem] font-semibold text-tinte no-underline shadow-[0_10px_34px_-8px_rgba(242,183,5,.55)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-papier"
                href="#warteliste"
                onClick={onWant('bestand')}
              >
                Als Anlagenbesitzer eintragen
              </a>
            </motion.article>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
