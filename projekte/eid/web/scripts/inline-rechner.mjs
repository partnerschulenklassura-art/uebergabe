// Bettet Skript und Stylesheet in dist-rechner/rechner.html ein, damit eine einzige Datei übrig bleibt.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-rechner';
let html = readFileSync(join(dir, 'rechner.html'), 'utf8');
html = html.replace(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g, (_, f) => {
  const js = readFileSync(join(dir, f), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g, (_, f) => `<style>${readFileSync(join(dir, f), 'utf8')}</style>`);
if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('Nicht alles eingebettet');
writeFileSync(join(dir, 'rechner.html'), html);
console.log(`dist-rechner/rechner.html: ${(html.length / 1024).toFixed(0)} KB`);
