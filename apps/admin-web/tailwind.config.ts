import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--sx-primary-50)',
          100: 'var(--sx-primary-100)',
          500: 'var(--sx-primary-500)',
          600: 'var(--sx-primary-600)',
          700: 'var(--sx-primary-700)',
        },
        accent: {
          400: 'var(--sx-accent-400)',
          500: 'var(--sx-accent-500)',
        },
      },
      fontFamily: {
        sans: 'var(--sx-font-sans)',
        mono: 'var(--sx-font-mono)',
      },
      borderRadius: {
        DEFAULT: 'var(--sx-radius-md)',
      },
    },
  },
  plugins: [],
} satisfies Config;
