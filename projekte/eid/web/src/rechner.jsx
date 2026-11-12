// Eigenständige Fassung des Anlagenwert-Rechners: eine HTML-Datei ohne Server, zum Weitergeben und Testen.
// Bauen: npm run build:rechner  ->  dist-rechner/rechner.html
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './tw.css';
import { Logo } from './Layout.jsx';
import Anlagenwert from './pages/Anlagenwert.jsx';
import { site } from './site.config.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <header className="site-header">
      <div className="wrap header-row">
        <span className="brand">
          <Logo />
          <span>{site.name}</span>
        </span>
      </div>
    </header>
    <main id="inhalt">
      <Anlagenwert />
    </main>
    <footer className="site-footer">
      <p className="wrap footer-note">
        Vorschau des Rechners, Stand {site.stand}. Keine Rechts-, Steuer- oder Anlageberatung. Kontakt: {site.email}
      </p>
    </footer>
  </StrictMode>
);
