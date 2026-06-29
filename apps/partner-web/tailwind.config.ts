import type { Config } from 'tailwindcss';

const scale = (name: string, shades: number[]) =>
  Object.fromEntries(shades.map((s) => [s, `var(--sx-${name}-${s})`]));

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: scale('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        accent: scale('accent', [50, 100, 200, 300, 400, 500, 600]),
        neutral: scale('neutral', [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        success: 'var(--sx-success)',
        warning: 'var(--sx-warning)',
        danger: 'var(--sx-danger)',
        info: 'var(--sx-info)',
      },
      fontFamily: {
        sans: 'var(--sx-font-sans)',
        mono: 'var(--sx-font-mono)',
      },
      borderRadius: {
        DEFAULT: 'var(--sx-radius-md)',
        xl: 'var(--sx-radius-xl)',
        '2xl': '24px',
      },
      boxShadow: {
        soft: 'var(--sx-shadow-sm)',
        card: 'var(--sx-shadow-md)',
        lift: 'var(--sx-shadow-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
