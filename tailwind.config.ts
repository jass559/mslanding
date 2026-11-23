import type { Config } from 'tailwindcss';

export const brandTokens = {
  background: '#0A0A0A',
  surface: '#171717',
  'surface-raised': '#1E1E1E',
  border: '#262626',
  accent: '#10B981',
  cta: '#F97316',
  'cta-hover': '#EA580C',
  'text-primary': '#F8FAFC',
  'text-secondary': '#94A3B8',
} as const;

const config = {
  content: [
    './index.html',
    './client/**/*.html',
    './client/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: brandTokens,
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
