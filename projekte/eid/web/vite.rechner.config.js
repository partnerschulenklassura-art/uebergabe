import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Baut den Rechner als eine Datei: alles (JS, CSS, Schriften) wird danach von scripts/inline-rechner.mjs eingebettet.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist-rechner',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    target: 'es2020',
    rollupOptions: { input: resolve(__dirname, 'rechner.html'), output: { inlineDynamicImports: true } }
  }
});
