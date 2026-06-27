/**
 * Brand tokens — v1 placeholder.
 * Locked decision (§0.5 #6): use a neutral logistics palette so Phase 1
 * coding isn't blocked. When the real brand kit / sarvaexpress.com
 * extraction lands, ONLY values here change — no component code edits.
 */

export const colors = {
  primary: {
    50: '#E6EEF8',
    100: '#C0D4EB',
    200: '#8CB0DA',
    300: '#5589C6',
    400: '#2A66B0',
    500: '#0F3D72', // brand primary — deep logistics blue
    600: '#0D3461',
    700: '#0A284C',
    800: '#071D38',
    900: '#041224',
  },
  accent: {
    50: '#FEF2E5',
    100: '#FCDABF',
    200: '#FABA8E',
    300: '#F89A5D',
    400: '#F58220', // brand accent — warm orange
    500: '#D86C0E',
    600: '#A85308',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F8FA',
    100: '#EDEFF3',
    200: '#D8DCE3',
    300: '#B6BCC8',
    400: '#8A93A3',
    500: '#5F6A7C',
    600: '#414B5C',
    700: '#2A323F',
    800: '#181D27',
    900: '#0B0E14',
  },
  success: '#1B8A4B',
  warning: '#C77B16',
  danger: '#B42D2D',
  info: '#1F6FAF',
} as const;

export const fonts = {
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const radii = {
  none: '0',
  sm: '4px',
  md: '8px', // brand default
  lg: '12px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(11, 14, 20, 0.06)',
  md: '0 4px 12px rgba(11, 14, 20, 0.08)',
  lg: '0 12px 32px rgba(11, 14, 20, 0.12)',
} as const;

export const tokens = { colors, fonts, fontSizes, spacing, radii, shadows } as const;

export type Tokens = typeof tokens;
