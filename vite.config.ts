import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['Android >= 7'],
      modernPolyfills: true,
    }),
  ],
  server: {
    port: 5173,
  },
});
