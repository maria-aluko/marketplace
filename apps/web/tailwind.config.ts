import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand — Emerald Trust
        primary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // brand default
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Accent — Amber Gold (celebration/owambe energy)
        celebration: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // accent default
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Warm neutrals — Stone (not cold blue-gray)
        surface: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Semantic — Verified badge only
        verified: {
          DEFAULT: '#0284c7',
          light:   '#e0f2fe',
          text:    '#075985',
        },
        // Vendor status semantic colors
        status: {
          draft:    { bg: '#f5f5f4', text: '#57534e', border: '#e7e5e4' },
          pending:  { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
          active:   { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' },
          changes:  { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
          suspended:{ bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
        },
      },
      screens: {
        xs: '375px',
      },
      borderRadius: {
        // Slightly softer than shadcn default for mobile friendliness
        DEFAULT: '0.625rem',
      },
    },
  },
  plugins: [],
};

export default config;
