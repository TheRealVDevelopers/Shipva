/**
 * Where the staff CRM lives.
 *
 * The website is served at the root of the domain and the Transporter OS
 * (apps/partner-web) is built with base `/app/` and dropped into this build's
 * `dist/app`, so a single host carries both. Anything pointing at the CRM
 * should use this constant rather than hard-coding the path — if the CRM ever
 * moves to its own subdomain, this is the one line that changes.
 *
 * `VITE_STAFF_APP_URL` overrides it at build time for exactly that case.
 */
export const STAFF_APP_URL: string =
  (import.meta.env.VITE_STAFF_APP_URL as string | undefined) ?? '/app';
