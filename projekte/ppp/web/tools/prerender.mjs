// Nach `vite build`: rendert jede Seite vor und setzt das HTML in dist/<seite>/index.html ein.
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || 'dist';
execSync('npx vite build --ssr src/ssr.jsx --outDir .ssr --emptyOutDir', { cwd: root, stdio: 'inherit' });
const SITE = 'https://www.photovoltaikperformancepro.com';
const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'PV Performance Pro',
  alternateName: ['PPP', 'PV Performance Pro – Energie-Netzwerk'],
  description: 'Energie-Netzwerk in Westsachsen: prüft und wartet Solaranlagen selbst und vermittelt Stromgemeinschaft, Direktvermarktung, Speicher, Komponenten und Anlagenschutz an regionale Partner.',
  url: `${SITE}/`,
  logo: `${SITE}/favicon.svg`,
  email: 'info@photovoltaikperformancepro.com',
  telephone: '+49 3761 1874966',
  founder: { '@type': 'Person', name: 'André Häupl' },
  address: { '@type': 'PostalAddress', streetAddress: 'Steinpöhlstraße 1', postalCode: '08412', addressLocality: 'Werdau', addressRegion: 'Sachsen', addressCountry: 'DE' },
  areaServed: [{ '@type': 'State', name: 'Sachsen' }, { '@type': 'Country', name: 'Deutschland' }],
  sameAs: ['https://solarsecure.pro']
};
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function head(page, html) {
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const desc = html.match(/<meta name="description" content="(.*?)"/)[1];
  const url = page === 'start' ? `${SITE}/` : `${SITE}/${page}/`;
  const graph = [ORG];
  if (page === 'start') graph.push({ '@type': 'WebSite', '@id': `${SITE}/#web`, url: `${SITE}/`, name: 'PV Performance Pro', inLanguage: 'de-DE', publisher: { '@id': `${SITE}/#org` } });
  else {
    graph.push({ '@type': 'Service', name: title.split(' – ')[0], description: desc, url, provider: { '@id': `${SITE}/#org` }, areaServed: page === 'pruefen' ? 'Westsachsen' : 'DE' });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: title.split(' – ')[0], item: url }] });
  }
  return [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="de_DE" />`,
    `<meta property="og:site_name" content="PV Performance Pro" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}/og.jpg" />`,
    `<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`
  ].join('\n    ');
}
const { render, pages: allPages, SITE_PAGES } = await import(pathToFileURL(path.join(root, '.ssr/ssr.js')).href);
// Nur freigeschaltete Seiten ausliefern (live: true in site.config.js); die anderen fliegen aus dist.
const off = SITE_PAGES.filter(p => !p.live).map(p => p.id);
for (const id of off) rmSync(path.join(root, out, id), { recursive: true, force: true });
const pages = allPages.filter(p => !off.includes(p));
console.log('freigeschaltet:', pages.join(', '), '| ausgeblendet:', off.join(', ') || '-');
for (const page of pages) {
  const file = path.join(root, out, page === 'start' ? 'index.html' : `${page}/index.html`);
  const html = readFileSync(file, 'utf8');
  const marker = `<div id="root" data-page="${page}"></div>`;
  if (!html.includes(marker)) throw new Error(`Platzhalter fehlt in ${file}`);
  const withHead = html.replace('</head>', `  ${head(page, html)}\n  </head>`);
  writeFileSync(file, withHead.replace(marker, `<div id="root" data-page="${page}">${render(page)}</div>`));
  console.log('vorgerendert:', page);
}

// Sitemap für Suchmaschinen
const today = new Date().toISOString().slice(0, 10);
const urls = pages.map(p => (p === 'start' ? `${SITE}/` : `${SITE}/${p}/`)).concat(['agb.html', 'softwarebedingungen.html', 'partnerbedingungen.html'].map(f => `${SITE}/${f}`));
writeFileSync(path.join(root, out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log('sitemap.xml geschrieben');
const llms = path.join(root, out, 'llms.txt');
writeFileSync(llms, readFileSync(llms, 'utf8').split('\n').filter(l => !off.some(id => l.includes(`/${id}/`))).join('\n'));
