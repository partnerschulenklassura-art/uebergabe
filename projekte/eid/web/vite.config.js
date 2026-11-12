import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Eine HTML-Datei je Bereich, damit jede Unterseite eigenen Titel und eigene Beschreibung für Suchmaschinen hat.
const pages = ['bewerten', 'anlagenwert', 'strom', 'speicher', 'komponenten', 'planen', 'pruefen', 'ueberwachen', 'schutz'];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(pages.map(p => [p, resolve(__dirname, `${p}/index.html`)]))
      }
    }
  },
  server: { proxy: { '/api': 'http://127.0.0.1:3120' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:3120' } }
});
