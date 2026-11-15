// Pfade zur Website-Wurzel. Im normalen Build ist BASE_URL '/', in der Vorschau './' (relativ):
// dann liegen Unterseiten eine Ebene tiefer und brauchen '../' vor jedem Pfad.
const BASE = import.meta.env.BASE_URL;
const ROOT =
  BASE !== './'
    ? BASE
    : typeof document !== 'undefined' && (document.getElementById('root')?.dataset.page || 'start') !== 'start'
      ? '../'
      : './';

/** Pfad ab Wurzel, z. B. url('/strom/') oder url('img/szene/hof.webp') */
export const url = p => ROOT + String(p).replace(/^\//, '');
export const sceneImg = name => url(`img/szene/${name}.webp`);
