import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Lenis an den GSAP-Ticker koppeln, damit ScrollTrigger und Smooth-Scroll im selben Takt laufen.
export function startSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.11,
    anchors: { offset: -72 }
  });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = time => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
