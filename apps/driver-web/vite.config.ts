import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GN_BASE lets us build each app under a sub-path (e.g. /customer/) for the
// co-located single-origin deploy, while defaulting to '/' for standalone.
export default defineConfig({
  base: process.env.GN_BASE || '/',
  plugins: [react()],
  server: { port: 5173 },
});
