import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Builds the two entry points of the published package:
 *
 *   @rsj-de/pdfmergesortsplit        dist/index.js   (ESM) + dist/index.cjs   (CJS)
 *   @rsj-de/pdfmergesortsplit/react  dist/react.js        + dist/react.cjs
 *
 * React is a peer dependency: the React entry imports it, the plain class never
 * does, so a plain-JS consumer does not need React at all.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.js'),
        react: resolve(import.meta.dirname, 'src/react.jsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entry) => `${entry}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
});
