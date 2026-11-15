import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import 'lenis/dist/lenis.css';
import './tw.css';
import Layout from './Layout.jsx';
import Start from './pages/Start.jsx';

// Jede HTML-Datei sagt per data-page, welche Seite sie ist. Unterseiten werden einzeln geladen.
const PAGES = {
  start: Start,
  strom: lazy(() => import('./pages/Strom.jsx')),
  speicher: lazy(() => import('./pages/Speicher.jsx')),
  komponenten: lazy(() => import('./pages/Komponenten.jsx')),
  planen: lazy(() => import('./pages/Planen.jsx')),
  pruefen: lazy(() => import('./pages/PruefenPage.jsx')),
  schutz: lazy(() => import('./pages/Schutz.jsx'))
};

const root = document.getElementById('root');
const page = root.dataset.page || 'start';
const Page = PAGES[page] || Start;

createRoot(root).render(
  <StrictMode>
    <Layout page={page}>
      <Suspense fallback={<div className="page-loading" />}>
        <Page />
      </Suspense>
    </Layout>
  </StrictMode>
);
