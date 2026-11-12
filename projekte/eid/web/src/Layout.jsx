import { useEffect, useRef, useState } from 'react';
import { startSmoothScroll } from './lib/smoothScroll.js';
import { setupReveals } from './lib/reveal.js';
import { site, PAGES } from './site.config.js';

export function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 23 A11 11 0 0 1 27 23" fill="none" stroke="var(--sonne)" strokeWidth="3" strokeLinecap="round" />
      <path d="M4 26h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Layout({ page, children }) {
  const main = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => startSmoothScroll(), []);
  useEffect(() => {
    // Masken-Überschriften erst im Leerlauf aufsetzen, damit der erste Aufbau nicht blockiert
    let cleanup = () => {};
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 200));
    const id = idle(() => (cleanup = setupReveals(main.current)), { timeout: 1500 });
    return () => {
      (window.cancelIdleCallback || clearTimeout)(id);
      cleanup();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <a className="skip" href="#inhalt">
        Zum Inhalt
      </a>
      <header className={`site-header${open ? ' menu-open' : ''}`}>
        <div className="wrap header-row">
          <a className="brand" href="/" aria-label={`${site.name}, Startseite`}>
            <Logo />
            <span>{site.name}</span>
          </a>
          <button
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="hauptmenue"
            onClick={() => setOpen(o => !o)}
          >
            {open ? 'Schließen' : 'Menü'}
          </button>
          <nav id="hauptmenue" aria-label="Hauptnavigation">
            {PAGES.filter(p => p.menu !== false).map(p => (
              <a key={p.id} href={p.href} aria-current={page === p.id ? 'page' : undefined}>
                {p.nav}
              </a>
            ))}
            <a className="nav-cta" href="#warteliste" onClick={() => setOpen(false)}>
              Warteliste
            </a>
          </nav>
        </div>
      </header>

      <main id="inhalt" ref={main}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="wrap footer-row">
          <div>
            <p className="brand footer-brand">
              <Logo />
              <span>{site.name}</span>
            </p>
            <p>Kompetenzzentrum für Solarstrom, Speicher und Anlagenbetrieb. Werdau, Sachsen.</p>
          </div>
          <div>
            <h2 className="footer-h">Bereiche</h2>
            <ul>
              {PAGES.map(p => (
                <li key={p.id}>
                  <a href={p.href}>{p.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="footer-h">Rechtliches</h2>
            <ul>
              <li>
                <a href="/impressum.html">Impressum</a>
              </li>
              <li>
                <a href="/datenschutz.html">Datenschutz</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
            </ul>
          </div>
        </div>
        <p className="wrap footer-note">
          Rechtsstand {site.stand}. Keine Rechts-, Steuer- oder Anlageberatung. Ohne Cookies und ohne Tracking.
        </p>
      </footer>
    </>
  );
}
