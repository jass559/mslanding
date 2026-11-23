import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const clientSource = fileURLToPath(new URL('./client/src', import.meta.url));
const serverSource = fileURLToPath(new URL('./server/src', import.meta.url));
const sharedSource = fileURLToPath(new URL('./shared', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@client': clientSource,
      '@server': serverSource,
      '@shared': sharedSource,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['./tests/setup.ts'],
    passWithNoTests: true,
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'client/src/**/*.{test,spec}.{ts,tsx}',
      'server/src/**/*.{test,spec}.{ts,tsx}',
      'shared/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', 'dist'],
  },
});
