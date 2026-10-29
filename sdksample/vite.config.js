import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The SDK is linked (`link:../sdk`), so its own node_modules contains a react
  // that would otherwise be bundled next to this app's: two React copies make
  // hooks fail. A published package has no node_modules, so this only matters
  // while developing against the local SDK.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
