// Vorab-Rendern beim Build: erzeugt das HTML jeder Seite, damit Suchmaschinen und KI-Crawler
// den Inhalt ohne JavaScript lesen. Im Browser übernimmt danach main.jsx.
import { renderToString } from 'react-dom/server';
import Layout from './Layout.jsx';
import Start from './pages/Start.jsx';
import Strom from './pages/Strom.jsx';
import Speicher from './pages/Speicher.jsx';
import Komponenten from './pages/Komponenten.jsx';
import Planen from './pages/Planen.jsx';
import PruefenPage from './pages/PruefenPage.jsx';
import Schutz from './pages/Schutz.jsx';

const PAGES = { start: Start, strom: Strom, speicher: Speicher, komponenten: Komponenten, planen: Planen, pruefen: PruefenPage, schutz: Schutz };

export function render(page) {
  const Page = PAGES[page];
  return renderToString(
    <Layout page={page}>
      <Page />
    </Layout>
  );
}
export const pages = Object.keys(PAGES);
export { PAGES as SITE_PAGES } from './site.config.js';
