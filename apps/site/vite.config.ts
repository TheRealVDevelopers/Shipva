import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * The public Sarva Express website.
 *
 * Served at the root of every host. The staff CRM (apps/partner-web) is built
 * with base '/app/' and copied into this build's `dist/app`, so a single
 * domain carries the marketing site at `/` and the CRM at `/app` — see the
 * `build:web` script in the root package.json and the hosting rewrites in
 * firebase.json.
 */
export default defineConfig({
  server: { host: '::', port: 8081 },
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
