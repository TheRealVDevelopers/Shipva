/**
 * Ground Network brand tokens — blue · white · orange.
 * The web apps read the CSS-variable mirror (tokens.css); this TS copy is for
 * the React Native (Expo) app and any JS consumers. Keep the two in sync.
 */

export const colors = {
  primary: {
    50: '#EEF4FF',
    100: '#D9E6FF',
    200: '#B7CEFF',
    300: '#8AB0FF',
    400: '#5B89F8',
    500: '#2F66EA', // brand blue
    600: '#1E4FD0',
    700: '#1B40A8',
    800: '#1B3A85',
    900: '#182F66',
  },
  accent: {
    50: '#FFF3E9',
    100: '#FFE2C9',
    200: '#FFCFA3',
    300: '#FFB877',
    400: '#FF9A3D', // brand orange (bright)
    500: '#F97316', // brand orange
    600: '#DD5F0A',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F5F8FC',
    100: '#ECF1F7',
    200: '#DDE4EE',
    300: '#C4CEDC',
    400: '#94A1B4',
    500: '#677488',
    600: '#4A5567',
    700: '#333D4C',
    800: '#1E2632',
    900: '#0E141D',
  },
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
} as const;

export const fonts = {
  sans: '"Nunito", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif',
  mono: '"Nunito Sans", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const radii = {
  none: '0',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(24, 47, 102, 0.06)',
  md: '0 4px 14px rgba(24, 47, 102, 0.08)',
  lg: '0 16px 40px rgba(24, 47, 102, 0.12)',
} as const;

export const tokens = { colors, fonts, radii, shadows } as const;
export type Tokens = typeof tokens;
