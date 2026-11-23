import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const clientSource = fileURLToPath(new URL('./client/src', import.meta.url));
const sharedSource = fileURLToPath(new URL('./shared', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@client': clientSource,
      '@shared': sharedSource,
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
