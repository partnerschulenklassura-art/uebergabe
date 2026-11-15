import { useEffect, useRef, useState } from 'react';
import { startSmoothScroll } from './lib/smoothScroll.js';
import { setupReveals } from './lib/reveal.js';
import { site, LIVE_PAGES as PAGES } from './site.config.js';
import { url } from './lib/url.js';

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
          <a className="brand" href={url('/')} aria-label={`${site.name}, Startseite`}>
            <Logo />
            <span className="brand-name">
              {site.name}
              <small>{site.tagline}</small>
            </span>
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
            {PAGES.map(p => (
              <a key={p.id} href={url(p.href)} aria-current={page === p.id ? 'page' : undefined}>
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
              <span className="brand-name">
              {site.name}
              <small>{site.tagline}</small>
            </span>
            </p>
            <p>Energie-Netzwerk für Solarstrom, Speicher und Anlagenbetrieb. Werdau, Sachsen.</p>
            <p className="footer-role">PV Performance Pro liefert keinen Strom und verkauft keine Komponenten im eigenen Namen. Wir vermitteln an Partner, die jeweils Ihr Vertragspartner sind.</p>
          </div>
          <div>
            <h2 className="footer-h">Bereiche</h2>
            <ul>
              {PAGES.map(p => (
                <li key={p.id}>
                  <a href={url(p.href)}>{p.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="footer-h">Rechtliches</h2>
            <ul>
              <li>
                <a href={url('/impressum.html')}>Impressum</a>
              </li>
              <li>
                <a href={url('/datenschutz.html')}>Datenschutz</a>
              </li>
              <li>
                <a href={url('/agb.html')}>AGB</a>
              </li>
              <li>
                <a href={url('/softwarebedingungen.html')}>Softwarebedingungen</a>
              </li>
              <li>
                <a href={url('/partnerbedingungen.html')}>Partnerbedingungen</a>
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
