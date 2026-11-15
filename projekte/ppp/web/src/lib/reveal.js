import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Abschnittsüberschriften Zeile für Zeile aus einer Maske, Listen gestaffelt beim Hereinscrollen.
export function setupReveals(scope) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const splits = [];

  document.fonts.ready.then(() => {
    scope.querySelectorAll('.section h2').forEach(h => {
      const split = SplitText.create(h, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: self =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.08,
            scrollTrigger: { trigger: h, start: 'top 85%', once: true }
          })
      });
      splits.push(split);
    });

    gsap.set('.reveal-item', { autoAlpha: 0, y: 24 });
    ScrollTrigger.batch('.reveal-item', {
      start: 'top 88%',
      once: true,
      onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 })
    });
    ScrollTrigger.refresh();
  });

  return () => splits.forEach(s => s.revert());
}
